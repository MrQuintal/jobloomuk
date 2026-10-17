-- Pro analytics clicks, availability status, response time, and favourite customers.

ALTER TABLE public.profile_events DROP CONSTRAINT IF EXISTS profile_events_kind_check;
ALTER TABLE public.profile_events ADD CONSTRAINT profile_events_kind_check CHECK (kind IN ('view', 'enquiry', 'click'));

CREATE OR REPLACE FUNCTION public.record_profile_event(_worker uuid, _kind text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF _kind NOT IN ('view', 'enquiry', 'click') THEN
    RETURN;
  END IF;
  IF auth.uid() IS NOT DISTINCT FROM _worker THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.worker_profiles w
    WHERE w.user_id = _worker AND w.is_published
  ) THEN
    RETURN;
  END IF;
  INSERT INTO public.profile_events (worker_id, kind) VALUES (_worker, _kind);
END;
$$;

ALTER TABLE public.worker_profiles
  ADD COLUMN IF NOT EXISTS availability_status text
  CHECK (availability_status IN ('available', 'busy', 'away'));

CREATE OR REPLACE FUNCTION public.guard_paid_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tier_at_least(NEW.user_id, 'pro') THEN
    IF NEW.is_sponsored THEN NEW.is_sponsored := false; END IF;
    NEW.banner_path := NULL;
    NEW.availability_status := NULL;
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.worker_response_seconds(_worker uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH first_ask AS (
    SELECT c.id, min(m.created_at) AS asked
    FROM public.conversations c
    JOIN public.messages m ON m.conversation_id = c.id AND m.sender_id = c.customer_id
    WHERE c.worker_id = _worker
      AND m.created_at > now() - interval '90 days'
      AND public.tier_at_least(_worker, 'pro')
      AND (
        auth.uid() = _worker
        OR EXISTS (SELECT 1 FROM public.worker_profiles w WHERE w.user_id = _worker AND w.is_published)
      )
    GROUP BY c.id
  ),
  replied AS (
    SELECT EXTRACT(EPOCH FROM (min(reply.created_at) - a.asked)) AS delay
    FROM first_ask a
    JOIN public.messages reply ON reply.conversation_id = a.id AND reply.sender_id = _worker AND reply.created_at >= a.asked
    GROUP BY a.id, a.asked
  )
  SELECT CASE
    WHEN count(*) >= 3 THEN round(percentile_cont(0.5) WITHIN GROUP (ORDER BY delay))::integer
    ELSE NULL
  END
  FROM replied
  WHERE delay >= 0;
$$;
GRANT EXECUTE ON FUNCTION public.worker_response_seconds(uuid) TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.favourite_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid NOT NULL REFERENCES public.worker_profiles(user_id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (worker_id, customer_id),
  CHECK (worker_id <> customer_id)
);
GRANT SELECT, INSERT, DELETE ON public.favourite_customers TO authenticated;
ALTER TABLE public.favourite_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pro reads favourites" ON public.favourite_customers;
CREATE POLICY "pro reads favourites" ON public.favourite_customers FOR SELECT TO authenticated
  USING (worker_id = auth.uid() AND public.tier_at_least(auth.uid(), 'pro'));
DROP POLICY IF EXISTS "pro saves favourites" ON public.favourite_customers;
CREATE POLICY "pro saves favourites" ON public.favourite_customers FOR INSERT TO authenticated
  WITH CHECK (
    worker_id = auth.uid()
    AND public.tier_at_least(auth.uid(), 'pro')
    AND (
      EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.customer_id = favourite_customers.customer_id
          AND (
            j.status = 'open'
            OR EXISTS (SELECT 1 FROM public.job_responses r WHERE r.job_id = j.id AND r.worker_id = auth.uid())
          )
      )
      OR EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.worker_id = auth.uid() AND c.customer_id = favourite_customers.customer_id
      )
    )
  );
DROP POLICY IF EXISTS "pro removes favourites" ON public.favourite_customers;
CREATE POLICY "pro removes favourites" ON public.favourite_customers FOR DELETE TO authenticated
  USING (worker_id = auth.uid());

CREATE OR REPLACE FUNCTION public.my_favourite_customers()
RETURNS TABLE (customer_id uuid, display_name text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.customer_id, COALESCE(NULLIF(btrim(p.display_name), ''), 'Jobloom member'), f.created_at
  FROM public.favourite_customers f
  JOIN public.profiles p ON p.id = f.customer_id
  WHERE f.worker_id = auth.uid() AND public.tier_at_least(auth.uid(), 'pro')
  ORDER BY f.created_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.my_favourite_customers() TO authenticated;

UPDATE public.subscription_plans
SET features = replace(features::text, 'Up to 5 portfolio projects', 'Up to 3 portfolio projects')::jsonb
WHERE slug = 'free' AND features::text LIKE '%Up to 5 portfolio projects%';

NOTIFY pgrst, 'reload schema';

ALTER TABLE public.business_access_grants ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'business';
ALTER TABLE public.business_access_grants ADD CONSTRAINT business_access_grants_tier_check CHECK (tier IN ('pro','business'));

CREATE OR REPLACE FUNCTION public.admin_set_complimentary_tier(_user_id uuid, _tier text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'super_admin') THEN
    RAISE EXCEPTION 'Only super admins can change complimentary plans' USING ERRCODE = '42501';
  END IF;
  IF _tier IS NOT NULL AND _tier NOT IN ('pro','business') THEN
    RAISE EXCEPTION 'Unknown plan';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id) THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  IF _tier IS NOT NULL AND NOT public.has_role(_user_id, 'worker') THEN
    RAISE EXCEPTION 'Complimentary plans can only be granted to a professional';
  END IF;
  IF _tier IS NULL THEN
    DELETE FROM public.business_access_grants WHERE user_id = _user_id;
  ELSE
    INSERT INTO public.business_access_grants(user_id, granted_by, tier)
    VALUES (_user_id, auth.uid(), _tier)
    ON CONFLICT (user_id) DO UPDATE SET tier = EXCLUDED.tier, granted_by = EXCLUDED.granted_by, granted_at = now();
  END IF;
  INSERT INTO public.audit_logs(actor_id, action, target_type, target_id, details)
  VALUES (auth.uid(), CASE WHEN _tier IS NULL THEN 'revoke_complimentary_plan' ELSE 'grant_complimentary_plan' END,
    'profile', _user_id, jsonb_build_object('complimentary', true, 'tier', _tier, 'billing_changed', false));
END $$;
REVOKE ALL ON FUNCTION public.admin_set_complimentary_tier(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_complimentary_tier(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.plan_tier(_u uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH paid AS (
    SELECT COALESCE((SELECT CASE WHEN price_id LIKE 'business_%' THEN 'business' WHEN price_id LIKE 'pro_%' THEN 'pro' ELSE 'free' END
      FROM public.subscriptions WHERE user_id = _u AND (
        (status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now()))
      ORDER BY (price_id LIKE 'business_%') DESC LIMIT 1), 'free') AS t
  ), comp AS (
    SELECT COALESCE((SELECT tier FROM public.business_access_grants WHERE user_id = _u), 'free') AS t
  )
  SELECT CASE WHEN 'business' IN (paid.t, comp.t) THEN 'business'
              WHEN 'pro' IN (paid.t, comp.t) THEN 'pro' ELSE 'free' END
  FROM paid, comp
$$;
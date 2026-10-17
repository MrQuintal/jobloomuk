-- A professional can choose the ending of /pro/their-address. The previous ending still opens the same page.

CREATE TABLE public.profile_slug_history (
  slug text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  worker_id uuid NOT NULL REFERENCES public.worker_profiles(user_id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profile_slug_history ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.guard_profile_slug() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cleaned text;
  reserved text[] := ARRAY['about','account','admin','alerts','api','auth','billing','contact','customer','dashboard','invoices','jobs','messages','notifications','onboarding','pricing','privacy','pro','professionals','terms','tools','worker'];
BEGIN
  cleaned := lower(regexp_replace(btrim(NEW.slug), '[^a-z0-9]+', '-', 'g'));
  cleaned := trim(both '-' from cleaned);
  IF length(cleaned) > 40 THEN
    cleaned := trim(both '-' from left(cleaned, 40));
  END IF;
  IF cleaned !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(cleaned) < 3 THEN
    RAISE EXCEPTION 'Use 3 to 40 letters, numbers and hyphens';
  END IF;
  IF cleaned = ANY (reserved) THEN
    RAISE EXCEPTION 'That address is reserved';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.worker_profiles w
    WHERE w.slug = cleaned AND w.user_id IS DISTINCT FROM NEW.user_id
  ) OR EXISTS (
    SELECT 1 FROM public.profile_slug_history h
    WHERE h.slug = cleaned AND h.worker_id IS DISTINCT FROM NEW.user_id
  ) THEN
    RAISE EXCEPTION 'That address is already used';
  END IF;
  DELETE FROM public.profile_slug_history WHERE slug = cleaned AND worker_id = NEW.user_id;
  IF TG_OP = 'UPDATE' AND OLD.slug IS DISTINCT FROM cleaned THEN
    INSERT INTO public.profile_slug_history (slug, worker_id) VALUES (OLD.slug, NEW.user_id)
    ON CONFLICT (slug) DO UPDATE SET worker_id = EXCLUDED.worker_id;
  END IF;
  NEW.slug := cleaned;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profile_slug ON public.worker_profiles;
CREATE TRIGGER profile_slug BEFORE INSERT OR UPDATE OF slug ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_slug();

CREATE OR REPLACE FUNCTION public.current_profile_slug(_slug text)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT w.slug FROM public.worker_profiles w WHERE w.slug = lower(_slug) AND w.is_published),
    (SELECT w.slug FROM public.profile_slug_history h
      JOIN public.worker_profiles w ON w.user_id = h.worker_id
      WHERE h.slug = lower(_slug) AND w.is_published)
  );
$$;
GRANT EXECUTE ON FUNCTION public.current_profile_slug(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

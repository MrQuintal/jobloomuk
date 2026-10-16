ALTER TABLE public.worker_profiles ADD COLUMN banner_path text, ADD COLUMN is_sponsored boolean NOT NULL DEFAULT false;
ALTER TABLE public.portfolio_projects ADD COLUMN video_url text;

CREATE OR REPLACE FUNCTION public.guard_paid_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.is_sponsored AND NOT public.tier_at_least(NEW.user_id,'pro') THEN NEW.is_sponsored := false; END IF;
  IF NEW.banner_path IS NOT NULL AND NOT public.tier_at_least(NEW.user_id,'pro') THEN NEW.banner_path := NULL; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER paid_profile BEFORE INSERT OR UPDATE ON public.worker_profiles FOR EACH ROW EXECUTE FUNCTION public.guard_paid_profile();

CREATE OR REPLACE FUNCTION public.guard_portfolio_video() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NEW.video_url IS NOT NULL THEN
    IF NOT public.tier_at_least(NEW.worker_id,'pro') THEN RAISE EXCEPTION 'Videos are part of Pro'; END IF;
    IF NEW.video_url !~ '^https://(www\.)?(youtube\.com/watch\?v=|youtu\.be/|vimeo\.com/)' THEN RAISE EXCEPTION 'Use a YouTube or Vimeo link'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER portfolio_video BEFORE INSERT OR UPDATE ON public.portfolio_projects FOR EACH ROW EXECUTE FUNCTION public.guard_portfolio_video();

CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.worker_profiles(user_id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  area text NOT NULL CHECK (char_length(area) BETWEEN 2 AND 80),
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.branches TO anon;
GRANT SELECT, INSERT, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.branches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "business insert" ON public.branches FOR INSERT TO authenticated WITH CHECK (business_id = auth.uid() AND public.tier_at_least(auth.uid(),'business'));
CREATE POLICY "owner delete" ON public.branches FOR DELETE TO authenticated USING (business_id = auth.uid());

CREATE OR REPLACE FUNCTION public.trg_job_alerts() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s record;
BEGIN
  FOR s IN SELECT DISTINCT ON (worker_id) worker_id, name FROM public.saved_searches
    WHERE worker_id <> NEW.customer_id
      AND (category_id IS NULL OR category_id = NEW.category_id)
      AND (keyword IS NULL OR keyword = '' OR NEW.title ILIKE '%'||keyword||'%' OR NEW.description ILIKE '%'||keyword||'%')
      AND (area IS NULL OR area = '' OR NEW.area ILIKE '%'||area||'%')
  LOOP
    IF public.tier_at_least(s.worker_id,'pro') THEN
      PERFORM public.notify(s.worker_id, 'New job matching "'||s.name||'": '||NEW.title, '/jobs');
    END IF;
  END LOOP;
  RETURN NEW;
END $$;
CREATE TRIGGER job_alerts AFTER INSERT ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.trg_job_alerts();
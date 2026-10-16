ALTER TABLE public.worker_profiles ADD COLUMN phone text;
COMMENT ON COLUMN public.worker_profiles.phone IS 'Primary business contact number shown on the public profile and printed PDF.';
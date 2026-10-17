ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS image_paths text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_image_paths_max;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_image_paths_max CHECK (cardinality(image_paths) <= 3);

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('job-photos', 'job-photos', false, 8388608)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.job_photo_visible(_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE _name = ANY (j.image_paths)
      AND (
        j.status = 'open'
        OR j.customer_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.conversations c
          WHERE c.job_id = j.id
            AND (c.customer_id = auth.uid() OR c.worker_id = auth.uid())
        )
      )
  );
$$;
GRANT EXECUTE ON FUNCTION public.job_photo_visible(text) TO authenticated;

DROP POLICY IF EXISTS "job photo owner write" ON storage.objects;
CREATE POLICY "job photo owner write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'job-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "job photo owner update" ON storage.objects;
CREATE POLICY "job photo owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'job-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "job photo owner delete" ON storage.objects;
CREATE POLICY "job photo owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'job-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "job photo read" ON storage.objects;
CREATE POLICY "job photo read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'job-photos'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.job_photo_visible(name)
    )
  );

CREATE OR REPLACE FUNCTION public.conversation_job_summary(_conv uuid)
RETURNS TABLE(title text, description text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
  SELECT j.title, j.description
  FROM public.conversations c
  JOIN public.jobs j ON j.id = c.job_id
  WHERE c.id = _conv
    AND (c.customer_id = auth.uid() OR c.worker_id = auth.uid() OR public.is_admin(auth.uid()));
$$;
GRANT EXECUTE ON FUNCTION public.conversation_job_summary(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_profile_event(_worker uuid, _kind text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  IF _kind NOT IN ('view', 'enquiry') THEN
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
GRANT EXECUTE ON FUNCTION public.record_profile_event(uuid, text) TO anon, authenticated;

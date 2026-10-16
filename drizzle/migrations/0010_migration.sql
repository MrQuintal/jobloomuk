CREATE OR REPLACE FUNCTION public.storage_file_is_public(_bucket text, _name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT CASE _bucket
    WHEN 'avatars' THEN EXISTS (SELECT 1 FROM public.profiles p WHERE p.avatar_url = _name AND p.account_status = 'active')
    WHEN 'portfolio' THEN EXISTS (SELECT 1 FROM public.worker_profiles w WHERE w.user_id::text = split_part(_name,'/',1) AND w.is_published)
    ELSE false END
$$;
GRANT EXECUTE ON FUNCTION public.storage_file_is_public(text, text) TO anon, authenticated;
DROP POLICY "avatar read" ON storage.objects;
DROP POLICY "portfolio read" ON storage.objects;
CREATE POLICY "avatar read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'avatars' AND ((storage.foldername(name))[1] = (select auth.uid()::text) OR public.storage_file_is_public(bucket_id, name)));
CREATE POLICY "portfolio read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'portfolio' AND ((storage.foldername(name))[1] = (select auth.uid()::text) OR public.storage_file_is_public(bucket_id, name)));
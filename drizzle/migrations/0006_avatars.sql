CREATE POLICY "avatar own upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY "avatar own update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE POLICY "avatar own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='avatars' AND (storage.foldername(name))[1]=auth.uid()::text);
CREATE OR REPLACE FUNCTION public.public_avatars(_ids uuid[]) RETURNS TABLE(id uuid, avatar_url text) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select p.id, p.avatar_url from public.profiles p where p.id = any(_ids) and p.account_status='active' and p.avatar_url is not null
$$;
GRANT EXECUTE ON FUNCTION public.public_avatars(uuid[]) TO anon, authenticated;
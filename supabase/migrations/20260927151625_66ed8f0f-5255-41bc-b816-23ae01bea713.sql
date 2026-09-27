-- template likes: hide who liked what
DROP POLICY IF EXISTS "Anyone can view template likes" ON public.template_likes;
CREATE POLICY "Users can view their own template likes" ON public.template_likes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE SELECT ON public.template_likes FROM anon;

CREATE OR REPLACE FUNCTION public.get_template_like_count(p_template_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::int FROM public.template_likes WHERE template_id = p_template_id
$$;
GRANT EXECUTE ON FUNCTION public.get_template_like_count(uuid) TO anon, authenticated;

-- feature flags: only active flags are readable by signed-in users
DROP POLICY IF EXISTS "Authenticated users can read feature flags" ON public.feature_flags;
CREATE POLICY "Authenticated users can read active feature flags" ON public.feature_flags
  FOR SELECT TO authenticated USING (is_enabled = true OR default_enabled = true);

-- storage: public buckets serve files by URL; listing only for owners
DROP POLICY IF EXISTS "Public read access for media" ON storage.objects;
CREATE POLICY "Owners can list their media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'user-media' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "user-media-large public read" ON storage.objects;
CREATE POLICY "user-media-large owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'user-media-large' AND (storage.foldername(name))[1] = auth.uid()::text);
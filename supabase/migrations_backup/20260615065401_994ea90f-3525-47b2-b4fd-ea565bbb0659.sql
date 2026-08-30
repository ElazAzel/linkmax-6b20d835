DROP POLICY IF EXISTS "Public can view sites for published pages" ON public.sites;
CREATE POLICY "Public can view sites for published pages"
ON public.sites
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.pages p
    WHERE p.site_id = sites.id AND p.is_published = true
  )
);

REVOKE SELECT (user_id) ON public.sites FROM anon;

DROP POLICY IF EXISTS "Users can update own verification documents" ON storage.objects;
CREATE POLICY "Users can update own verification documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'verification-documents'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own verification documents" ON storage.objects;
CREATE POLICY "Users can delete own verification documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
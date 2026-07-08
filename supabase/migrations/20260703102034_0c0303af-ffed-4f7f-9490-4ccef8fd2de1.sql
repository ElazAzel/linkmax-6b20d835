-- Owner-scoped RLS on storage.objects for the user-media-large bucket.
DROP POLICY IF EXISTS "user-media-large public read" ON storage.objects;
DROP POLICY IF EXISTS "user-media-large owner insert" ON storage.objects;
DROP POLICY IF EXISTS "user-media-large owner update" ON storage.objects;
DROP POLICY IF EXISTS "user-media-large owner delete" ON storage.objects;

CREATE POLICY "user-media-large public read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'user-media-large');

CREATE POLICY "user-media-large owner insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-media-large'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "user-media-large owner update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-media-large'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'user-media-large'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "user-media-large owner delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-media-large'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
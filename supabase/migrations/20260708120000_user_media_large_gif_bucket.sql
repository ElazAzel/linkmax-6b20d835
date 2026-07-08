INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-media-large',
  'user-media-large',
  true,
  31457280,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/wav'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = GREATEST(COALESCE(storage.buckets.file_size_limit, 0), 31457280),
  allowed_mime_types = ARRAY(
    SELECT DISTINCT mime_type
    FROM unnest(
      COALESCE(storage.buckets.allowed_mime_types, ARRAY[]::text[])
      || EXCLUDED.allowed_mime_types
    ) AS allowed(mime_type)
  );

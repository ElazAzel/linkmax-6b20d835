-- Keep all existing block values, including legacy search rows.
ALTER TABLE public.blocks DROP CONSTRAINT IF EXISTS blocks_type_check;
ALTER TABLE public.blocks ADD CONSTRAINT blocks_type_check CHECK (type = ANY (ARRAY[
  'profile', 'link', 'button', 'socials', 'text', 'image', 'product', 'video',
  'carousel', 'search', 'custom_code', 'messenger', 'form', 'download',
  'newsletter', 'testimonial', 'scratch', 'map', 'avatar', 'separator',
  'catalog', 'before_after', 'faq', 'countdown', 'pricing', 'shoutout',
  'booking', 'community', 'event', 'audio'
]));

-- A separate bucket enforces audio limits without changing existing video/file limits.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('page-audio', 'page-audio', true, 52428800,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/vnd.wave'])
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "page_audio_owner_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'page-audio' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "page_audio_owner_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'page-audio' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Replacement uploads receive a new path; retained files remain usable by page history.

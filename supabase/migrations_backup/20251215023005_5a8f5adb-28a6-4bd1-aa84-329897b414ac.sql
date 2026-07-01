-- Add preview_url column to pages table for custom page previews
ALTER TABLE public.pages 
ADD COLUMN preview_url text DEFAULT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pages_preview_url ON public.pages(preview_url) WHERE preview_url IS NOT NULL;
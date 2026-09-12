-- Add Webhook support to pages
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

-- Add description for columns
COMMENT ON COLUMN public.pages.webhook_url IS 'External URL to send lead and form data to via POST request';
COMMENT ON COLUMN public.pages.webhook_secret IS 'Secret key for signing webhook payloads to ensure authenticity';

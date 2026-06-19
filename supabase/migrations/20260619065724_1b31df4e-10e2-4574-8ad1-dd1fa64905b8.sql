ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS webhook_secret TEXT;

REVOKE SELECT (webhook_url, webhook_secret) ON public.pages FROM anon, authenticated;
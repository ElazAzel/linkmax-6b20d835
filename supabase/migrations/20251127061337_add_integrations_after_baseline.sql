-- Apply the historical integrations column after the baseline tables exist.
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS integrations JSONB DEFAULT '{}'::jsonb;

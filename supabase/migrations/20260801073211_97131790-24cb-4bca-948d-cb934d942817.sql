CREATE TABLE IF NOT EXISTS public.external_api_cache (
  cache_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.external_api_cache TO service_role;
ALTER TABLE public.external_api_cache ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_external_api_cache_expires ON public.external_api_cache (expires_at);

CREATE OR REPLACE FUNCTION public.cleanup_external_api_cache()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.external_api_cache WHERE expires_at < now() - interval '1 day';
$$;
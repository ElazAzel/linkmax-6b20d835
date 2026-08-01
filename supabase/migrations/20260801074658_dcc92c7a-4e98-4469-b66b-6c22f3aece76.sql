REVOKE ALL ON public.external_api_cache FROM anon;
REVOKE ALL ON public.external_api_cache FROM authenticated;
GRANT ALL ON public.external_api_cache TO service_role;
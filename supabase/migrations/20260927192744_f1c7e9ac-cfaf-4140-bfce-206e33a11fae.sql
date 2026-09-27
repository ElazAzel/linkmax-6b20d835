CREATE OR REPLACE FUNCTION public.gen_event_checkin_token()
RETURNS text
LANGUAGE sql
VOLATILE
SET search_path = public, extensions
AS $$
  SELECT replace(replace(replace(encode(gen_random_bytes(24), 'base64'), '/', ''), '+', ''), '=', '');
$$;

REVOKE EXECUTE ON FUNCTION public.gen_event_checkin_token() FROM public;
REVOKE EXECUTE ON FUNCTION public.gen_event_checkin_token() FROM anon;
REVOKE EXECUTE ON FUNCTION public.gen_event_checkin_token() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.gen_event_checkin_token() TO service_role;
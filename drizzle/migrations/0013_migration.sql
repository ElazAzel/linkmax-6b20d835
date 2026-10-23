REVOKE EXECUTE ON FUNCTION public.increment_challenge_progress(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_challenge_progress(text) TO service_role;
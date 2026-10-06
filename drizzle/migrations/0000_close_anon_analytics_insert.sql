DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can insert marketing analytics" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
REVOKE INSERT ON public.analytics FROM anon, authenticated;
GRANT ALL ON public.analytics TO service_role;
-- 1. external_api_cache: explicit service-role-only design
ALTER TABLE public.external_api_cache ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.external_api_cache FROM anon, authenticated;
GRANT ALL ON public.external_api_cache TO service_role;
DROP POLICY IF EXISTS "Service role manages external api cache" ON public.external_api_cache;
CREATE POLICY "Service role manages external api cache"
ON public.external_api_cache FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 2. integration_secrets: service-role only, never client readable
ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.integration_secrets FROM anon, authenticated;
GRANT ALL ON public.integration_secrets TO service_role;
DROP POLICY IF EXISTS "Service role manages integration secrets" ON public.integration_secrets;
CREATE POLICY "Service role manages integration secrets"
ON public.integration_secrets FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 3. zone_conversations: admin-only updates (assignment/status)
DROP POLICY IF EXISTS "Zone admins can update conversations" ON public.zone_conversations;
CREATE POLICY "Zone admins can update conversations"
ON public.zone_conversations FOR UPDATE TO authenticated
USING (public.is_zone_admin(zone_id, auth.uid()))
WITH CHECK (public.is_zone_admin(zone_id, auth.uid()));
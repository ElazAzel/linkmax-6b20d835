-- 1. external_api_cache: explicit service-role-only design
DO $$
BEGIN
  IF to_regclass('public.external_api_cache') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.external_api_cache ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON public.external_api_cache FROM anon, authenticated';
    EXECUTE 'GRANT ALL ON public.external_api_cache TO service_role';
    EXECUTE 'DROP POLICY IF EXISTS "Service role manages external api cache" ON public.external_api_cache';
    EXECUTE 'CREATE POLICY "Service role manages external api cache" ON public.external_api_cache FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END
$$;

-- 2. integration_secrets: service-role only, never client readable
DO $$
BEGIN
  IF to_regclass('public.integration_secrets') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.integration_secrets ENABLE ROW LEVEL SECURITY';
    EXECUTE 'REVOKE ALL ON public.integration_secrets FROM anon, authenticated';
    EXECUTE 'GRANT ALL ON public.integration_secrets TO service_role';
    EXECUTE 'DROP POLICY IF EXISTS "Service role manages integration secrets" ON public.integration_secrets';
    EXECUTE 'CREATE POLICY "Service role manages integration secrets" ON public.integration_secrets FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END
$$;

-- 3. zone_conversations: admin-only updates (assignment/status)
DROP POLICY IF EXISTS "Zone admins can update conversations" ON public.zone_conversations;
CREATE POLICY "Zone admins can update conversations"
ON public.zone_conversations FOR UPDATE TO authenticated
USING (public.is_zone_admin(zone_id, auth.uid()))
WITH CHECK (public.is_zone_admin(zone_id, auth.uid()));

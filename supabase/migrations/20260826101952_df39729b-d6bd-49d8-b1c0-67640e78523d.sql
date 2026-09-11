-- These tables are used by the generated Supabase contract but were missing
-- from the migration history. Create the service-owned storage before applying
-- the RLS hardening below so a clean replay has the same contract.
CREATE TABLE IF NOT EXISTS public.external_api_cache (
  cache_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.integration_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.cleanup_external_api_cache()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.external_api_cache WHERE expires_at <= now();
$$;

REVOKE ALL ON FUNCTION public.cleanup_external_api_cache() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_external_api_cache() TO service_role;

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

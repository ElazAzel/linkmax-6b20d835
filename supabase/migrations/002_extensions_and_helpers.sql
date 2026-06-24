BEGIN;

-- ============================================================================
-- 002_extensions_and_helpers.sql — Additional extensions, schema, helper functions
-- Merged from: 20251207183404, 20260127023041, 20260218210000, 20260222094800
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- ============================================================================
-- 2. SCHEMAS
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS extensions;

GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- 3. FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Edge function warm-up (pg_cron + pg_net)
CREATE OR REPLACE FUNCTION public.warmup_edge_functions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  base_url TEXT;
BEGIN
  base_url := 'https://pphdcfxucfndmwulpfwv.supabase.co';
  PERFORM net.http_get(url := base_url || '/functions/v1/seo-ssr?warmup=true', headers := '{}'::jsonb);
  PERFORM net.http_get(url := base_url || '/functions/v1/telegram-bot-webhook?warmup=true', headers := '{}'::jsonb);
  PERFORM net.http_get(url := base_url || '/functions/v1/pixel-proxy?warmup=true', headers := '{}'::jsonb);
END;
$$;

COMMENT ON FUNCTION public.warmup_edge_functions IS 'Pings critical edge functions every 4 minutes to prevent cold start latency. Uses pg_net for non-blocking HTTP calls.';

-- ============================================================================
-- 4. CRON JOB
-- ============================================================================

SELECT cron.schedule(
  'warmup-edge-functions',
  '*/4 * * * *',
  $$SELECT public.warmup_edge_functions()$$
);

COMMIT;

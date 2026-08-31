-- ============================================
-- Edge Function Cold Start Warm-up (pg_cron + pg_net)
-- Pings critical edge functions every 4 minutes to prevent cold starts
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ─── Warm-up function ────────────────────────────────────────────
-- Uses pg_net for async HTTP calls (non-blocking)
CREATE OR REPLACE FUNCTION public.warmup_edge_functions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  base_url TEXT;
  anon_key TEXT;
BEGIN
  -- Get Supabase URL from environment
  -- These are available in Supabase SQL via current_setting
  base_url := 'https://pphdcfxucfndmwulpfwv.supabase.co';
  
  -- Fire warm-up pings (fire-and-forget via pg_net)
  -- seo-ssr: critical for SEO bots
  PERFORM net.http_get(
    url := base_url || '/functions/v1/seo-ssr?warmup=true',
    headers := '{}'::jsonb
  );

  -- telegram-bot-webhook: critical for Telegram notifications
  PERFORM net.http_get(
    url := base_url || '/functions/v1/telegram-bot-webhook?warmup=true',
    headers := '{}'::jsonb
  );

  -- pixel-proxy: critical for analytics
  PERFORM net.http_get(
    url := base_url || '/functions/v1/pixel-proxy?warmup=true',
    headers := '{}'::jsonb
  );

  RAISE LOG '[warmup] Pinged seo-ssr, telegram-bot-webhook, pixel-proxy';
END;
$$;

-- ─── Schedule cron job: every 4 minutes ──────────────────────────
-- Supabase free tier allows pg_cron; the job runs in the DB context
SELECT cron.schedule(
  'warmup-edge-functions',   -- job name
  '*/4 * * * *',             -- every 4 minutes
  $$SELECT public.warmup_edge_functions()$$
);

-- ─── Verify ──────────────────────────────────────────────────────
-- You can check job status: SELECT * FROM cron.job;
-- You can check run history: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

COMMENT ON FUNCTION public.warmup_edge_functions IS 'Pings critical edge functions every 4 minutes to prevent cold start latency. Uses pg_net for non-blocking HTTP calls.';

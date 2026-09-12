
-- Add retry tracking columns to indexing_submissions
ALTER TABLE public.indexing_submissions
  ADD COLUMN IF NOT EXISTS retry_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_attempted_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS payload jsonb;

-- Index for the retry worker
CREATE INDEX IF NOT EXISTS idx_indexing_submissions_retry
  ON public.indexing_submissions (next_retry_at)
  WHERE submission_status = 'provider_failed' AND retry_count < 5;

-- Enable cron + net (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule retry worker every 15 minutes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'retry-failed-indexing-every-15min') THEN
    PERFORM cron.schedule(
      'retry-failed-indexing-every-15min',
      '*/15 * * * *',
      $job$
      SELECT net.http_post(
        url := 'https://pphdcfxucfndmwulpfwv.supabase.co/functions/v1/retry-failed-indexing',
        headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwaGRjZnh1Y2ZuZG13dWxwZnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTgwMDcsImV4cCI6MjA3OTc5NDAwN30.u5O_XrdvtjHaZjsAkVZyoYbNQIBKx9xfVxRFuUi2WbA"}'::jsonb,
        body := '{"source":"cron"}'::jsonb
      );
      $job$
    );
  END IF;
END $$;

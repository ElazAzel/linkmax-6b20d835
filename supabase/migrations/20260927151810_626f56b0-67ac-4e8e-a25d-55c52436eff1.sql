-- lovable-cron-fallback-reviewed: re-creating the existing 15-min indexing retry job unchanged in cadence, only adding an auth header
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS private.internal_secrets (
  name text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON private.internal_secrets FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT SELECT ON private.internal_secrets TO service_role;
INSERT INTO private.internal_secrets(name, value)
VALUES ('internal_job_token', encode(extensions.gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

-- Service-role-only lookup used by edge functions
CREATE OR REPLACE FUNCTION public.verify_internal_job_token(p_token text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = private, public AS $$
  SELECT EXISTS (SELECT 1 FROM private.internal_secrets WHERE name = 'internal_job_token' AND value = p_token)
$$;
REVOKE ALL ON FUNCTION public.verify_internal_job_token(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_internal_job_token(text) TO service_role;

CREATE OR REPLACE FUNCTION public.ping_indexnow_on_page_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $function$
DECLARE
  v_url text;
  v_should_ping boolean := false;
  v_token text;
BEGIN
  IF NEW.is_published IS NOT TRUE OR NEW.is_indexable IS NOT TRUE THEN RETURN NEW; END IF;
  IF NEW.slug IS NULL OR length(NEW.slug) = 0 THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    v_should_ping := true;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.is_published IS DISTINCT FROM NEW.is_published)
       OR (OLD.is_indexable IS DISTINCT FROM NEW.is_indexable)
       OR (OLD.slug IS DISTINCT FROM NEW.slug)
       OR (COALESCE(OLD.quality_score, 0) < 25 AND COALESCE(NEW.quality_score, 0) >= 25)
       OR (NEW.last_indexnow_at IS NULL)
       OR (NEW.last_indexnow_at < now() - interval '6 hours') THEN
      v_should_ping := true;
    END IF;
  END IF;
  IF NOT v_should_ping THEN RETURN NEW; END IF;

  v_url := 'https://lnkmx.my/' || NEW.slug;
  SELECT value INTO v_token FROM private.internal_secrets WHERE name = 'internal_job_token';

  PERFORM net.http_post(
    url := 'https://pphdcfxucfndmwulpfwv.supabase.co/functions/v1/notify-indexnow',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-internal-token', coalesce(v_token, '')),
    body := jsonb_build_object(
      'urls', jsonb_build_array(v_url),
      'page_id', NEW.id,
      'action_type', CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END
    ),
    timeout_milliseconds := 5000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'ping_indexnow_on_page_change failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.ping_indexnow_on_page_change() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE v_job_id bigint;
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    SELECT jobid INTO v_job_id FROM cron.job WHERE jobname = 'retry-failed-indexing-every-15min' LIMIT 1;
    IF v_job_id IS NOT NULL THEN PERFORM cron.unschedule(v_job_id); END IF;
    PERFORM cron.schedule(
      'retry-failed-indexing-every-15min',
      '*/15 * * * *',
      $job$
      SELECT net.http_post(
        url := 'https://pphdcfxucfndmwulpfwv.supabase.co/functions/v1/retry-failed-indexing',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-token', (SELECT value FROM private.internal_secrets WHERE name = 'internal_job_token')
        ),
        body := '{"source":"cron"}'::jsonb
      );
      $job$
    );
  END IF;
END
$$;
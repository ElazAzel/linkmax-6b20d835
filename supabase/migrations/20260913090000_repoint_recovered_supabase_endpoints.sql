-- Repoint scheduled Supabase HTTP integrations after project recovery.
-- The publishable key is browser-safe and is used only for authenticated
-- Edge Function gateway requests from pg_net.
DO $$
DECLARE
  v_job_id bigint;
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    SELECT jobid INTO v_job_id
    FROM cron.job
    WHERE jobname = 'retry-failed-indexing-every-15min'
    LIMIT 1;

    IF v_job_id IS NOT NULL THEN
      PERFORM cron.unschedule(v_job_id);
    END IF;

    PERFORM cron.schedule(
      'retry-failed-indexing-every-15min',
      '*/15 * * * *',
      $job$
      SELECT net.http_post(
        url := 'https://hpnycvncipdxmvqfuulf.supabase.co/functions/v1/retry-failed-indexing',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', 'sb_publishable_Oxf_xcPtnMO0M9FfBlXImQ_qPsZOnvV',
          'Authorization', 'Bearer sb_publishable_Oxf_xcPtnMO0M9FfBlXImQ_qPsZOnvV'
        ),
        body := '{"source":"cron"}'::jsonb
      );
      $job$
    );
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.warmup_edge_functions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
DECLARE
  base_url text := 'https://hpnycvncipdxmvqfuulf.supabase.co';
  request_headers jsonb := jsonb_build_object(
    'apikey', 'sb_publishable_Oxf_xcPtnMO0M9FfBlXImQ_qPsZOnvV',
    'Authorization', 'Bearer sb_publishable_Oxf_xcPtnMO0M9FfBlXImQ_qPsZOnvV'
  );
BEGIN
  PERFORM net.http_get(
    url := base_url || '/functions/v1/seo-ssr?warmup=true',
    headers := request_headers
  );
  PERFORM net.http_get(
    url := base_url || '/functions/v1/telegram-bot-webhook?warmup=true',
    headers := request_headers
  );
  PERFORM net.http_get(
    url := base_url || '/functions/v1/pixel-proxy?warmup=true',
    headers := request_headers
  );
END;
$function$;
CREATE OR REPLACE FUNCTION public.ping_indexnow_on_page_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $function$
DECLARE
  v_url text;
  v_should_ping boolean := false;
BEGIN
  IF NEW.is_published IS NOT TRUE OR NEW.is_indexable IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.slug IS NULL OR length(NEW.slug) = 0 THEN
    RETURN NEW;
  END IF;

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

  IF NOT v_should_ping THEN
    RETURN NEW;
  END IF;

  v_url := 'https://lnkmx.my/' || NEW.slug;

  PERFORM net.http_post(
    url := 'https://hpnycvncipdxmvqfuulf.supabase.co/functions/v1/notify-indexnow',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_Oxf_xcPtnMO0M9FfBlXImQ_qPsZOnvV',
      'Authorization', 'Bearer sb_publishable_Oxf_xcPtnMO0M9FfBlXImQ_qPsZOnvV'
    ),
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

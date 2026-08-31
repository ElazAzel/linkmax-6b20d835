
-- Auto-ping IndexNow when a page becomes indexable or its slug/index status changes.
-- Calls the notify-indexnow Edge Function via pg_net (fire-and-forget).

CREATE OR REPLACE FUNCTION public.ping_indexnow_on_page_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_should_ping boolean := false;
BEGIN
  -- Only ping when the page is currently published and indexable
  IF NEW.is_published IS NOT TRUE OR NEW.is_indexable IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.slug IS NULL OR length(NEW.slug) = 0 THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    v_should_ping := true;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Trigger when first becoming indexable/published, slug changes,
    -- or quality crosses the indexable threshold.
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

  -- Fire-and-forget HTTP POST to the Edge Function.
  PERFORM net.http_post(
    url := 'https://pphdcfxucfndmwulpfwv.supabase.co/functions/v1/notify-indexnow',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'urls', jsonb_build_array(v_url),
      'page_id', NEW.id,
      'action_type', CASE WHEN TG_OP = 'INSERT' THEN 'create' ELSE 'update' END
    ),
    timeout_milliseconds := 5000
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block page writes on indexing failures.
  RAISE WARNING 'ping_indexnow_on_page_change failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pages_indexnow_ping_trg ON public.pages;

CREATE TRIGGER pages_indexnow_ping_trg
AFTER INSERT OR UPDATE OF is_published, is_indexable, slug, quality_score
ON public.pages
FOR EACH ROW
EXECUTE FUNCTION public.ping_indexnow_on_page_change();

-- Smart-link lifecycle controls are enforced by the redirect RPC, not only the UI.
ALTER TABLE public.smart_links
  ADD COLUMN IF NOT EXISTS active_from timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_clicks integer;

ALTER TABLE public.smart_links
  DROP CONSTRAINT IF EXISTS smart_links_max_clicks_positive,
  ADD CONSTRAINT smart_links_max_clicks_positive
    CHECK (max_clicks IS NULL OR (max_clicks >= 1 AND max_clicks <= 10000000));

ALTER TABLE public.smart_links
  DROP CONSTRAINT IF EXISTS smart_links_lifecycle_order,
  ADD CONSTRAINT smart_links_lifecycle_order
    CHECK (active_from IS NULL OR expires_at IS NULL OR active_from < expires_at);

CREATE INDEX IF NOT EXISTS smart_links_active_window_idx
  ON public.smart_links (slug, active_from, expires_at)
  WHERE is_active = true;

-- This RPC is called only by the service-role Edge Function. Revoking public
-- execution prevents unauthenticated clients from consuming a link's click cap.
REVOKE EXECUTE ON FUNCTION public.increment_smart_link_click(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_smart_link_click(text) TO service_role;

CREATE OR REPLACE FUNCTION public.increment_smart_link_click(_slug text)
RETURNS TABLE (
  id uuid,
  target_url text,
  user_id uuid,
  page_id uuid,
  downstream_action jsonb,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.smart_links sl
     SET click_count = sl.click_count + 1,
         last_click_at = now()
   WHERE sl.slug = lower(trim(_slug))
     AND sl.is_active = true
     AND (sl.active_from IS NULL OR sl.active_from <= now())
     AND (sl.expires_at IS NULL OR sl.expires_at > now())
     AND (sl.max_clicks IS NULL OR sl.click_count < sl.max_clicks)
   RETURNING
     sl.id,
     sl.target_url,
     sl.user_id,
     sl.page_id,
     sl.downstream_action,
     sl.utm_source,
     sl.utm_medium,
     sl.utm_campaign,
     sl.utm_content,
     sl.utm_term;
END;
$$;

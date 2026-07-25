-- Public browser events must pass through track-analytics-event Edge Function.
CREATE OR REPLACE FUNCTION public.is_allowed_analytics_event_type(p_event_type text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT p_event_type = ANY (ARRAY[
    'view', 'click', 'share', 'session_end', 'heatmap_clicks', 'heatmap_scroll', 'heatmap_rage_clicks',
    'landing_view', 'landing_scroll', 'landing_section_view', 'landing_exit', 'cta_create_click', 'cta_gallery_click', 'cta_login_click', 'cta_pricing_click', 'pricing_toggle', 'signup_start', 'hero_primary_cta_click', 'hero_secondary_cta_click', 'how_it_works_view', 'pricing_view', 'faq_expand', 'alternatives_view', 'alternatives_cta_click', 'niche_landing_view', 'niche_landing_cta_click', 'signup_from_landing', 'signup_from_niche_landing', 'signup_from_alternatives'
  ]::text[])
  OR p_event_type LIKE 'editor:%'
  OR p_event_type LIKE 'auth:%'
  OR p_event_type LIKE 'activation:%';
$$;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics for published pages" ON public.analytics;
DROP POLICY IF EXISTS "Public insert analytics" ON public.analytics;
DROP POLICY IF EXISTS "Allow analytics insert" ON public.analytics;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can insert marketing analytics" ON public.analytics;
DROP POLICY IF EXISTS "Public insert guarded analytics" ON public.analytics;
COMMENT ON TABLE public.analytics IS 'Public event ingestion is restricted to the track-analytics-event Edge Function.';

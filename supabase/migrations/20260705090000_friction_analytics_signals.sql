-- Phase 25: allow privacy-safe friction signals in the existing analytics ingestion path.

CREATE OR REPLACE FUNCTION public.is_allowed_analytics_event_type(p_event_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    p_event_type IS NOT NULL
    AND char_length(p_event_type) BETWEEN 1 AND 80
    AND p_event_type ~ '^[a-z][a-z0-9_:-]*$'
    AND (
      p_event_type = ANY (ARRAY[
        'view',
        'click',
        'share',
        'heatmap_clicks',
        'heatmap_scroll',
        'heatmap_rage_clicks',
        'session_end',
        'landing_view',
        'landing_scroll',
        'landing_section_view',
        'landing_exit',
        'cta_create_click',
        'cta_gallery_click',
        'cta_login_click',
        'cta_pricing_click',
        'pricing_toggle',
        'signup_start',
        'hero_primary_cta_click',
        'hero_secondary_cta_click',
        'how_it_works_view',
        'pricing_view',
        'faq_expand',
        'alternatives_view',
        'alternatives_cta_click',
        'signup_from_landing',
        'signup_from_alternatives',
        'impression',
        'conversion',
        'broadcast',
        'payment_success',
        'booking_created',
        'booking_created_staff'
      ]::text[])
      OR p_event_type LIKE 'activation:%'
      OR p_event_type LIKE 'auth:%'
      OR p_event_type LIKE 'editor:%'
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_allowed_analytics_event_type(text) TO anon, authenticated, service_role;

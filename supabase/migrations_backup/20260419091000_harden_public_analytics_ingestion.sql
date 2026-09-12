-- Guard public analytics ingestion without breaking owner-side activation events.

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

ALTER TABLE public.analytics
  DROP CONSTRAINT IF EXISTS analytics_event_type_check;

ALTER TABLE public.analytics
  ADD CONSTRAINT analytics_event_type_check
  CHECK (public.is_allowed_analytics_event_type(event_type)) NOT VALID;

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics for published pages" ON public.analytics;
DROP POLICY IF EXISTS "Public insert analytics" ON public.analytics;
DROP POLICY IF EXISTS "Allow analytics insert" ON public.analytics;
DROP POLICY IF EXISTS "Enable insert for everyone" ON public.analytics;
DROP POLICY IF EXISTS "Anyone can insert marketing analytics" ON public.analytics;
DROP POLICY IF EXISTS "Service role can insert analytics" ON public.analytics;
DROP POLICY IF EXISTS "Public insert guarded analytics" ON public.analytics;

CREATE POLICY "Public insert guarded analytics"
ON public.analytics
FOR INSERT
TO anon, authenticated
WITH CHECK (
  public.is_allowed_analytics_event_type(event_type)
  AND (
    (
      page_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.pages
        WHERE pages.id = analytics.page_id
          AND (
            pages.is_published = true
            OR pages.user_id = auth.uid()
          )
      )
    )
    OR (
      page_id IS NULL
      AND (
        (
          block_id IS NULL
          AND (
            event_type LIKE 'auth:%'
            OR event_type = ANY (ARRAY[
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
              'signup_from_alternatives'
            ]::text[])
          )
        )
        OR (
          auth.uid() IS NOT NULL
          AND event_type LIKE 'editor:%'
        )
      )
    )
  )
);

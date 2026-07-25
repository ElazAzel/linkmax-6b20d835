-- Keep the database event allow-list aligned with the client tracker.
-- The previous migration created the table but omitted newer monetization,
-- review and retention events, causing PostgREST 400 responses on insert.
CREATE OR REPLACE FUNCTION public.is_allowed_product_event_name(p_event_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_event_name = ANY (ARRAY[
    'signup_completed',
    'onboarding_started',
    'onboarding_step_completed',
    'onboarding_completed',
    'ai_page_generated',
    'block_added',
    'block_edited',
    'page_published',
    'telegram_connected',
    'first_lead_received',
    'lead_viewed',
    'lead_status_changed',
    'booking_created',
    'invoice_created',
    'payment_completed',
    'review_request_created',
    'review_request_used',
    'review_created',
    'review_published',
    'upgrade_clicked',
    'upgrade_completed',
    'billing_payment_failed',
    'billing_recovery_scheduled',
    'billing_recovered',
    'billing_recovery_exhausted',
    'promo_code_applied',
    'dashboard_returned'
  ]::text[]);
$$;


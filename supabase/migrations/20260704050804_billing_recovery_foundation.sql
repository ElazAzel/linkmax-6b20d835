-- Phase 26: Billing recovery foundation.
-- Extends the existing Paddle subscriptions and billing history contracts.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS recovery_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recovery_attempt_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recovery_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS recovery_next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS recovery_last_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS recovery_last_event_at timestamptz,
  ADD COLUMN IF NOT EXISTS recovery_last_failure_code text,
  ADD COLUMN IF NOT EXISTS recovery_last_failure_message text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_recovery_status_check'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_recovery_status_check
      CHECK (recovery_status IN ('none', 'scheduled', 'notified', 'recovered', 'exhausted'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_recovery_attempt_count_check'
  ) THEN
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_recovery_attempt_count_check
      CHECK (recovery_attempt_count BETWEEN 0 AND 3);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_subscriptions_recovery_due
  ON public.subscriptions (recovery_status, recovery_next_action_at)
  WHERE recovery_status IN ('scheduled', 'notified')
    AND recovery_next_action_at IS NOT NULL;

ALTER TABLE public.billing_history
  ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_event_id text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_history_metadata_object_check'
  ) THEN
    ALTER TABLE public.billing_history
      ADD CONSTRAINT billing_history_metadata_object_check
      CHECK (jsonb_typeof(metadata) = 'object');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_billing_history_subscription_id
  ON public.billing_history (subscription_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_history_provider_event
  ON public.billing_history (provider, provider_event_id)
  WHERE provider IS NOT NULL
    AND provider_event_id IS NOT NULL;

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

CREATE OR REPLACE FUNCTION public.is_allowed_webhook_event_type(p_event_type text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_event_type = ANY (ARRAY[
    'lead.created',
    'lead.updated',
    'booking.created',
    'booking.cancelled',
    'event.registration_created',
    'invoice.created',
    'invoice.paid',
    'page.published',
    'form.submitted',
    'review_request.created',
    'review_request.used',
    'review.created',
    'review.published',
    'billing.payment_failed',
    'billing.recovery_scheduled',
    'billing.recovered',
    'billing.recovery_exhausted',
    'promo.applied'
  ]::text[]);
$$;

COMMENT ON COLUMN public.subscriptions.recovery_status IS 'Billing recovery state for failed or past-due subscription renewal flows.';
COMMENT ON COLUMN public.subscriptions.recovery_attempt_count IS 'Number of owner recovery touchpoints recorded for the current failure window.';
COMMENT ON COLUMN public.subscriptions.recovery_next_action_at IS 'Next scheduled owner recovery touchpoint for billing operations.';
COMMENT ON COLUMN public.billing_history.subscription_id IS 'Optional link from billing journal records to Paddle subscriptions.';
COMMENT ON COLUMN public.billing_history.provider_event_id IS 'Idempotency key for provider webhook events recorded in the billing journal.';

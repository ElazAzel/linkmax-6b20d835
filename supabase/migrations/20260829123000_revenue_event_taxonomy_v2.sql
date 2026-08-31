-- Revenue Core v1: server-authoritative revenue event taxonomy and projections.

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
    'dashboard_returned',
    'revenue_kit_started',
    'revenue_kit_step_completed',
    'revenue_kit_applied',
    'bio_link_copied',
    'service_viewed',
    'booking_started',
    'booking_slot_selected',
    'booking_details_submitted',
    'deposit_instructions_viewed',
    'deposit_payment_started',
    'deposit_payment_succeeded',
    'deposit_payment_manually_confirmed',
    'booking_confirmed',
    'reminder_queued',
    'reminder_delivered',
    'customer_attendance_confirmed',
    'booking_rescheduled',
    'booking_cancelled',
    'booking_completed',
    'booking_no_show',
    'booking_payment_recorded',
    'booking_refund_recorded',
    'outcome_dashboard_viewed',
    'next_best_action_clicked'
  ]::text[]);
$$;

CREATE OR REPLACE FUNCTION public.is_authoritative_product_event_name(p_event_name text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_event_name = ANY (ARRAY[
    'booking_created',
    'deposit_payment_succeeded',
    'deposit_payment_manually_confirmed',
    'booking_confirmed',
    'reminder_queued',
    'reminder_delivered',
    'booking_rescheduled',
    'booking_cancelled',
    'booking_completed',
    'booking_no_show',
    'booking_payment_recorded',
    'booking_refund_recorded'
  ]::text[]);
$$;

ALTER TABLE public.product_events
  ADD COLUMN IF NOT EXISTS taxonomy_version smallint NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_offering_id uuid REFERENCES public.service_offerings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS actor_type text NOT NULL DEFAULT 'creator',
  ADD COLUMN IF NOT EXISTS idempotency_key text;

ALTER TABLE public.product_events
  DROP CONSTRAINT IF EXISTS product_events_taxonomy_version_check,
  DROP CONSTRAINT IF EXISTS product_events_actor_type_check;

ALTER TABLE public.product_events
  ADD CONSTRAINT product_events_taxonomy_version_check CHECK (taxonomy_version IN (1, 2)),
  ADD CONSTRAINT product_events_actor_type_check CHECK (
    actor_type IN ('visitor', 'creator', 'system', 'provider')
  );

CREATE INDEX IF NOT EXISTS idx_product_events_booking_time
  ON public.product_events (booking_id, occurred_at DESC)
  WHERE booking_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_events_authoritative_idempotency
  ON public.product_events (event_name, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

DROP POLICY IF EXISTS "Users can insert own product events" ON public.product_events;
CREATE POLICY "Users can insert own product events"
ON public.product_events
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND source = 'client'
  AND actor_type = 'creator'
  AND booking_id IS NULL
  AND service_offering_id IS NULL
  AND idempotency_key IS NULL
  AND NOT public.is_authoritative_product_event_name(event_name)
  AND (
    page_id IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.pages page
      WHERE page.id = product_events.page_id
        AND page.user_id = auth.uid()
    )
  )
);

CREATE OR REPLACE FUNCTION public.emit_revenue_product_event(
  p_booking_id uuid,
  p_event_name text,
  p_actor_type text,
  p_idempotency_key text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_event_id uuid;
  v_actor_type text;
  v_safe_metadata jsonb;
BEGIN
  IF pg_trigger_depth() = 0 AND NOT public.is_revenue_service_role() THEN
    RAISE EXCEPTION 'authoritative_event_emitter_not_allowed' USING ERRCODE = '42501';
  END IF;

  IF NOT public.is_authoritative_product_event_name(p_event_name)
    OR char_length(COALESCE(p_idempotency_key, '')) NOT BETWEEN 8 AND 240
  THEN
    RAISE EXCEPTION 'invalid_authoritative_event' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'booking_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_actor_type := CASE p_actor_type
    WHEN 'owner' THEN 'creator'
    WHEN 'visitor' THEN 'visitor'
    WHEN 'provider' THEN 'provider'
    ELSE 'system'
  END;

  v_safe_metadata := jsonb_strip_nulls(jsonb_build_object(
    'reasonCode', NULLIF(left(COALESCE(p_metadata->>'reasonCode', ''), 120), ''),
    'paymentKind', NULLIF(left(COALESCE(p_metadata->>'paymentKind', ''), 20), ''),
    'processingSource', NULLIF(left(COALESCE(p_metadata->>'processingSource', ''), 30), ''),
    'currency', NULLIF(left(COALESCE(p_metadata->>'currency', ''), 3), ''),
    'amount', CASE
      WHEN COALESCE(p_metadata->>'amount', '') ~ '^\d+(\.\d{1,2})?$'
        THEN p_metadata->>'amount'
      ELSE NULL
    END,
    'visitorId', NULLIF(left(COALESCE(v_booking.attribution->>'visitorId', ''), 200), ''),
    'source', NULLIF(left(COALESCE(v_booking.attribution->>'source', ''), 200), '')
  ));

  INSERT INTO public.product_events (
    user_id,
    page_id,
    event_name,
    source,
    metadata,
    occurred_at,
    taxonomy_version,
    booking_id,
    service_offering_id,
    actor_type,
    idempotency_key
  )
  VALUES (
    v_booking.owner_id,
    v_booking.page_id,
    p_event_name,
    'system',
    v_safe_metadata,
    now(),
    2,
    v_booking.id,
    v_booking.service_offering_id,
    v_actor_type,
    p_idempotency_key
  )
  ON CONFLICT (event_name, idempotency_key) WHERE idempotency_key IS NOT NULL
  DO UPDATE SET idempotency_key = EXCLUDED.idempotency_key
  RETURNING id INTO v_event_id;

  IF p_event_name = 'booking_created' THEN
    INSERT INTO public.creator_activation_state (
      user_id,
      primary_page_id,
      first_booking_created_at
    )
    VALUES (v_booking.owner_id, v_booking.page_id, now())
    ON CONFLICT (user_id) DO UPDATE
    SET primary_page_id = COALESCE(
          public.creator_activation_state.primary_page_id,
          EXCLUDED.primary_page_id
        ),
        first_booking_created_at = COALESCE(
          public.creator_activation_state.first_booking_created_at,
          EXCLUDED.first_booking_created_at
        ),
        updated_at = now();
  ELSIF p_event_name IN (
    'deposit_payment_succeeded',
    'deposit_payment_manually_confirmed',
    'booking_payment_recorded'
  ) THEN
    INSERT INTO public.creator_activation_state (
      user_id,
      primary_page_id,
      first_payment_completed_at
    )
    VALUES (v_booking.owner_id, v_booking.page_id, now())
    ON CONFLICT (user_id) DO UPDATE
    SET primary_page_id = COALESCE(
          public.creator_activation_state.primary_page_id,
          EXCLUDED.primary_page_id
        ),
        first_payment_completed_at = COALESCE(
          public.creator_activation_state.first_payment_completed_at,
          EXCLUDED.first_payment_completed_at
        ),
        updated_at = now();
  END IF;

  RETURN v_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.project_booking_transition_revenue_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_name text;
BEGIN
  v_event_name := CASE
    WHEN NEW.from_status IS NULL THEN 'booking_created'
    WHEN NEW.reason_code = 'customer_rescheduled' THEN 'booking_rescheduled'
    WHEN NEW.to_status = 'confirmed' AND NEW.from_status IS DISTINCT FROM 'confirmed' THEN 'booking_confirmed'
    WHEN NEW.to_status = 'cancelled' THEN 'booking_cancelled'
    WHEN NEW.to_status = 'completed' THEN 'booking_completed'
    WHEN NEW.to_status = 'no_show' THEN 'booking_no_show'
    ELSE NULL
  END;

  IF v_event_name IS NOT NULL THEN
    PERFORM public.emit_revenue_product_event(
      NEW.booking_id,
      v_event_name,
      NEW.actor_type,
      NEW.idempotency_key,
      jsonb_build_object('reasonCode', NEW.reason_code)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER project_booking_transition_revenue_event
AFTER INSERT ON public.booking_status_transitions
FOR EACH ROW
EXECUTE FUNCTION public.project_booking_transition_revenue_event();

CREATE OR REPLACE FUNCTION public.project_booking_payment_revenue_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_name text;
  v_actor_type text;
BEGIN
  IF NEW.status <> 'succeeded' THEN
    RETURN NEW;
  END IF;

  v_event_name := CASE
    WHEN NEW.kind = 'refund' THEN 'booking_refund_recorded'
    WHEN NEW.kind = 'deposit' AND NEW.processing_source = 'platform' THEN 'deposit_payment_succeeded'
    WHEN NEW.kind = 'deposit' THEN 'deposit_payment_manually_confirmed'
    ELSE 'booking_payment_recorded'
  END;
  v_actor_type := CASE WHEN NEW.processing_source = 'platform' THEN 'provider' ELSE 'owner' END;

  PERFORM public.emit_revenue_product_event(
    NEW.booking_id,
    v_event_name,
    v_actor_type,
    NEW.idempotency_key,
    jsonb_build_object(
      'paymentKind', NEW.kind,
      'processingSource', NEW.processing_source,
      'currency', NEW.currency,
      'amount', to_char(NEW.amount, 'FM9999999990.00')
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER project_booking_payment_revenue_event
AFTER INSERT ON public.booking_payments
FOR EACH ROW
EXECUTE FUNCTION public.project_booking_payment_revenue_event();

REVOKE ALL ON FUNCTION public.emit_revenue_product_event(uuid, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.emit_revenue_product_event(uuid, text, text, text, jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.project_booking_transition_revenue_event()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.project_booking_payment_revenue_event()
  FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.emit_revenue_product_event IS
  'Projects allowlisted, PII-free revenue facts from trusted database mutations only.';

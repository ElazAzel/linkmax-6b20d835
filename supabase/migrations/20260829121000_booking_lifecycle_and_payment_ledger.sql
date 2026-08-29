-- Revenue Core v1: authoritative booking lifecycle and immutable payment facts.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS service_offering_id uuid
    REFERENCES public.service_offerings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS booking_timezone text NOT NULL DEFAULT 'Asia/Almaty',
  ADD COLUMN IF NOT EXISTS status_reason text,
  ADD COLUMN IF NOT EXISTS deposit_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS no_show_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_price_amount numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposit_required_amount numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_amount numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS refunded_amount numeric(12, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS client_identity_hash text,
  ADD COLUMN IF NOT EXISTS attribution jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check,
  DROP CONSTRAINT IF EXISTS bookings_payment_status_check,
  DROP CONSTRAINT IF EXISTS bookings_total_price_amount_check,
  DROP CONSTRAINT IF EXISTS bookings_deposit_required_amount_check,
  DROP CONSTRAINT IF EXISTS bookings_paid_amount_check,
  DROP CONSTRAINT IF EXISTS bookings_refunded_amount_check,
  DROP CONSTRAINT IF EXISTS bookings_version_check,
  DROP CONSTRAINT IF EXISTS bookings_service_amounts_check;

UPDATE public.bookings
SET status = 'pending_payment'
WHERE status = 'pending';

UPDATE public.bookings
SET payment_status = CASE payment_status
  WHEN 'paid' THEN 'paid'
  WHEN 'refunded' THEN 'refunded'
  WHEN 'failed' THEN 'failed'
  WHEN 'pending' THEN 'pending'
  ELSE 'pending'
END;

ALTER TABLE public.bookings
  ALTER COLUMN payment_status SET DEFAULT 'pending',
  ADD CONSTRAINT bookings_status_check CHECK (
    status IN ('pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show')
  ),
  ADD CONSTRAINT bookings_payment_status_check CHECK (
    payment_status IN (
      'not_applicable', 'pending', 'partially_paid', 'paid',
      'partially_refunded', 'refunded', 'failed', 'waived'
    )
  ),
  ADD CONSTRAINT bookings_total_price_amount_check CHECK (total_price_amount >= 0),
  ADD CONSTRAINT bookings_deposit_required_amount_check CHECK (deposit_required_amount >= 0),
  ADD CONSTRAINT bookings_paid_amount_check CHECK (paid_amount >= 0),
  ADD CONSTRAINT bookings_refunded_amount_check CHECK (refunded_amount >= 0),
  ADD CONSTRAINT bookings_version_check CHECK (version > 0),
  ADD CONSTRAINT bookings_service_amounts_check CHECK (
    deposit_required_amount <= total_price_amount
  );

CREATE INDEX IF NOT EXISTS idx_bookings_owner_status_slot
  ON public.bookings (owner_id, status, slot_date, slot_time);

CREATE INDEX IF NOT EXISTS idx_bookings_service_offering
  ON public.bookings (service_offering_id, created_at DESC)
  WHERE service_offering_id IS NOT NULL;

CREATE TABLE public.booking_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('deposit', 'balance', 'refund')),
  status text NOT NULL CHECK (status IN ('succeeded', 'failed')),
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'KZT' CHECK (currency ~ '^[A-Z]{3}$'),
  method text NOT NULL CHECK (method IN (
    'kaspi_manual', 'cash', 'manual_card', 'bank_transfer', 'robokassa', 'other'
  )),
  processing_source text NOT NULL CHECK (processing_source IN ('external_manual', 'platform')),
  provider text,
  provider_reference text,
  confirmed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at timestamptz,
  idempotency_key text NOT NULL UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_payments_booking_created
  ON public.booking_payments (booking_id, created_at);

CREATE INDEX idx_booking_payments_owner_created
  ON public.booking_payments (owner_id, created_at DESC);

CREATE TABLE public.booking_status_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('visitor', 'owner', 'system', 'provider')),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason_code text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  idempotency_key text NOT NULL UNIQUE,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_status_transitions_from_status_check CHECK (
    from_status IS NULL
    OR from_status IN ('pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show')
  ),
  CONSTRAINT booking_status_transitions_to_status_check CHECK (
    to_status IN ('pending_payment', 'confirmed', 'completed', 'cancelled', 'no_show')
  )
);

CREATE INDEX idx_booking_status_transitions_booking_time
  ON public.booking_status_transitions (booking_id, occurred_at);

CREATE OR REPLACE FUNCTION public.is_revenue_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT current_user = 'service_role'
    OR COALESCE(current_setting('request.jwt.claim.role', true), '') = 'service_role';
$$;

CREATE OR REPLACE FUNCTION public.can_manage_booking(p_booking_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_revenue_service_role()
    OR EXISTS (
      SELECT 1
      FROM public.bookings booking
      LEFT JOIN public.pages page ON page.id = booking.page_id
      WHERE booking.id = p_booking_id
        AND (
          booking.owner_id = p_user_id
          OR public.is_admin(p_user_id)
          OR (
            page.organization_id IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM public.organization_members member
              WHERE member.org_id = page.organization_id
                AND member.user_id = p_user_id
                AND member.role IN ('owner', 'admin', 'editor')
            )
          )
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.reject_immutable_booking_fact_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  IF (
    NEW.status IS DISTINCT FROM OLD.status
    OR NEW.status_reason IS DISTINCT FROM OLD.status_reason
    OR NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at
    OR NEW.cancelled_at IS DISTINCT FROM OLD.cancelled_at
    OR NEW.completed_at IS DISTINCT FROM OLD.completed_at
    OR NEW.no_show_at IS DISTINCT FROM OLD.no_show_at
    OR NEW.version IS DISTINCT FROM OLD.version
  )
  AND COALESCE(current_setting('revenue_core.transition_write', true), '') <> 'on'
  THEN
    RAISE EXCEPTION 'booking_transition_rpc_required' USING ERRCODE = '42501';
  END IF;

  IF (
    NEW.payment_status IS DISTINCT FROM OLD.payment_status
    OR NEW.paid_amount IS DISTINCT FROM OLD.paid_amount
    OR NEW.refunded_amount IS DISTINCT FROM OLD.refunded_amount
  )
  AND COALESCE(current_setting('revenue_core.payment_projection_write', true), '') <> 'on'
  AND COALESCE(current_setting('revenue_core.transition_write', true), '') <> 'on'
  THEN
    RAISE EXCEPTION 'booking_payment_ledger_required' USING ERRCODE = '42501';
  END IF;

  IF (
    NEW.service_offering_id IS DISTINCT FROM OLD.service_offering_id
    OR NEW.service_snapshot IS DISTINCT FROM OLD.service_snapshot
    OR NEW.booking_timezone IS DISTINCT FROM OLD.booking_timezone
    OR NEW.total_price_amount IS DISTINCT FROM OLD.total_price_amount
    OR NEW.deposit_required_amount IS DISTINCT FROM OLD.deposit_required_amount
    OR NEW.client_identity_hash IS DISTINCT FROM OLD.client_identity_hash
    OR NEW.attribution IS DISTINCT FROM OLD.attribution
    OR NEW.payment_amount IS DISTINCT FROM OLD.payment_amount
    OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
  )
  AND COALESCE(current_setting('revenue_core.fact_correction_write', true), '') <> 'on'
  THEN
    RAISE EXCEPTION 'booking_fact_is_immutable' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_booking_revenue_facts
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.reject_immutable_booking_fact_changes();

CREATE OR REPLACE FUNCTION public.reject_immutable_booking_ledger_rows()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'booking_ledger_rows_are_immutable' USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER protect_booking_payments_immutability
BEFORE UPDATE OR DELETE ON public.booking_payments
FOR EACH ROW
EXECUTE FUNCTION public.reject_immutable_booking_ledger_rows();

CREATE TRIGGER protect_booking_transitions_immutability
BEFORE UPDATE OR DELETE ON public.booking_status_transitions
FOR EACH ROW
EXECUTE FUNCTION public.reject_immutable_booking_ledger_rows();

CREATE OR REPLACE FUNCTION public.refresh_booking_payment_projection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paid numeric(12, 2);
  v_refunded numeric(12, 2);
  v_total numeric(12, 2);
  v_previous_status text;
  v_projected_status text;
BEGIN
  SELECT
    COALESCE(SUM(amount) FILTER (
      WHERE status = 'succeeded' AND kind IN ('deposit', 'balance')
    ), 0),
    COALESCE(SUM(amount) FILTER (
      WHERE status = 'succeeded' AND kind = 'refund'
    ), 0)
  INTO v_paid, v_refunded
  FROM public.booking_payments
  WHERE booking_id = NEW.booking_id;

  SELECT total_price_amount, payment_status
  INTO v_total, v_previous_status
  FROM public.bookings
  WHERE id = NEW.booking_id
  FOR UPDATE;

  v_projected_status := CASE
    WHEN v_paid > 0 AND v_refunded >= v_paid THEN 'refunded'
    WHEN v_refunded > 0 THEN 'partially_refunded'
    WHEN v_total > 0 AND v_paid >= v_total THEN 'paid'
    WHEN v_paid > 0 THEN 'partially_paid'
    WHEN v_previous_status = 'waived' THEN 'waived'
    WHEN v_total = 0 THEN 'not_applicable'
    WHEN NEW.status = 'failed' THEN 'failed'
    ELSE 'pending'
  END;

  PERFORM set_config('revenue_core.payment_projection_write', 'on', true);

  UPDATE public.bookings
  SET paid_amount = v_paid,
      refunded_amount = v_refunded,
      payment_status = v_projected_status,
      updated_at = now()
  WHERE id = NEW.booking_id;

  PERFORM set_config('revenue_core.payment_projection_write', 'off', true);
  RETURN NEW;
END;
$$;

CREATE TRIGGER refresh_booking_payment_projection_after_insert
AFTER INSERT ON public.booking_payments
FOR EACH ROW
EXECUTE FUNCTION public.refresh_booking_payment_projection();

ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking managers can view payment facts"
ON public.booking_payments
FOR SELECT
TO authenticated
USING (public.can_manage_booking(booking_id, auth.uid()));

CREATE POLICY "Booking managers can view transition facts"
ON public.booking_status_transitions
FOR SELECT
TO authenticated
USING (public.can_manage_booking(booking_id, auth.uid()));

DROP POLICY IF EXISTS "Users can update their own bookings (only cancel)" ON public.bookings;

CREATE OR REPLACE FUNCTION public.record_manual_booking_payment(
  p_booking_id uuid,
  p_kind text,
  p_amount numeric,
  p_currency text,
  p_method text,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_booking public.bookings%ROWTYPE;
  v_existing public.booking_payments%ROWTYPE;
  v_payment public.booking_payments%ROWTYPE;
BEGIN
  SELECT *
  INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'booking_not_found', 'retryable', false);
  END IF;

  IF NOT public.can_manage_booking(p_booking_id, v_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_allowed', 'retryable', false);
  END IF;

  SELECT *
  INTO v_existing
  FROM public.booking_payments
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF v_existing.booking_id IS DISTINCT FROM p_booking_id THEN
      RETURN jsonb_build_object('ok', false, 'code', 'idempotency_conflict', 'retryable', false);
    END IF;

    RETURN jsonb_build_object(
      'ok', true,
      'paymentId', v_existing.id,
      'bookingId', v_booking.id,
      'paidAmount', to_char(v_booking.paid_amount, 'FM9999999990.00'),
      'refundedAmount', to_char(v_booking.refunded_amount, 'FM9999999990.00'),
      'paymentStatus', v_booking.payment_status,
      'idempotentReplay', true
    );
  END IF;

  IF p_kind NOT IN ('deposit', 'balance', 'refund')
    OR p_amount IS NULL
    OR p_amount <= 0
    OR p_currency !~ '^[A-Z]{3}$'
    OR p_method NOT IN ('kaspi_manual', 'cash', 'manual_card', 'bank_transfer', 'other')
    OR char_length(COALESCE(p_idempotency_key, '')) NOT BETWEEN 8 AND 200
  THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_input', 'retryable', false);
  END IF;

  IF p_kind = 'refund' AND p_amount > (v_booking.paid_amount - v_booking.refunded_amount) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'refund_exceeds_paid_amount', 'retryable', false);
  END IF;

  INSERT INTO public.booking_payments (
    booking_id,
    owner_id,
    kind,
    status,
    amount,
    currency,
    method,
    processing_source,
    confirmed_by,
    confirmed_at,
    idempotency_key
  )
  VALUES (
    v_booking.id,
    v_booking.owner_id,
    p_kind,
    'succeeded',
    p_amount,
    p_currency,
    p_method,
    'external_manual',
    v_user_id,
    now(),
    p_idempotency_key
  )
  RETURNING * INTO v_payment;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'ok', true,
    'paymentId', v_payment.id,
    'bookingId', v_booking.id,
    'paidAmount', to_char(v_booking.paid_amount, 'FM9999999990.00'),
    'refundedAmount', to_char(v_booking.refunded_amount, 'FM9999999990.00'),
    'paymentStatus', v_booking.payment_status,
    'idempotentReplay', false
  );
EXCEPTION
  WHEN unique_violation THEN
    SELECT * INTO v_existing
    FROM public.booking_payments
    WHERE idempotency_key = p_idempotency_key;

    IF v_existing.booking_id = p_booking_id THEN
      RETURN jsonb_build_object(
        'ok', true,
        'paymentId', v_existing.id,
        'bookingId', p_booking_id,
        'idempotentReplay', true
      );
    END IF;

    RETURN jsonb_build_object('ok', false, 'code', 'idempotency_conflict', 'retryable', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.transition_booking(
  p_booking_id uuid,
  p_to_status text,
  p_expected_version integer,
  p_reason_code text,
  p_idempotency_key text,
  p_payment_amount numeric DEFAULT NULL,
  p_payment_method text DEFAULT NULL,
  p_payment_idempotency_key text DEFAULT NULL,
  p_waive_payment boolean DEFAULT false,
  p_privileged_correction boolean DEFAULT false,
  p_actor_type text DEFAULT 'owner'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_booking public.bookings%ROWTYPE;
  v_existing public.booking_status_transitions%ROWTYPE;
  v_allowed boolean := false;
  v_new_version integer;
  v_payment_result jsonb;
  v_inserted_id uuid;
  v_slot_start timestamptz;
BEGIN
  SELECT *
  INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'booking_not_found', 'retryable', false);
  END IF;

  IF NOT public.can_manage_booking(p_booking_id, v_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_allowed', 'retryable', false);
  END IF;

  IF p_actor_type NOT IN ('owner', 'system', 'provider')
    OR (p_actor_type IN ('system', 'provider') AND NOT public.is_revenue_service_role())
  THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_actor', 'retryable', false);
  END IF;

  SELECT *
  INTO v_existing
  FROM public.booking_status_transitions
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF v_existing.booking_id IS DISTINCT FROM p_booking_id THEN
      RETURN jsonb_build_object('ok', false, 'code', 'idempotency_conflict', 'retryable', false);
    END IF;

    RETURN jsonb_build_object(
      'ok', true,
      'bookingId', v_existing.booking_id,
      'status', v_existing.to_status,
      'version', (v_existing.metadata->>'resultVersion')::integer,
      'idempotentReplay', true
    );
  END IF;

  IF p_expected_version IS DISTINCT FROM v_booking.version THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'version_conflict',
      'retryable', true,
      'currentVersion', v_booking.version
    );
  END IF;

  IF char_length(COALESCE(p_reason_code, '')) NOT BETWEEN 1 AND 120
    OR char_length(COALESCE(p_idempotency_key, '')) NOT BETWEEN 8 AND 200
  THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_input', 'retryable', false);
  END IF;

  v_allowed := CASE v_booking.status
    WHEN 'pending_payment' THEN p_to_status IN ('confirmed', 'cancelled')
    WHEN 'confirmed' THEN p_to_status IN ('confirmed', 'completed', 'cancelled', 'no_show')
    WHEN 'completed' THEN p_to_status = 'confirmed' AND p_privileged_correction
    WHEN 'no_show' THEN p_to_status = 'confirmed' AND p_privileged_correction
    ELSE false
  END;

  IF NOT v_allowed THEN
    RETURN jsonb_build_object('ok', false, 'code', 'transition_not_allowed', 'retryable', false);
  END IF;

  IF v_booking.status IN ('completed', 'no_show')
    AND char_length(btrim(COALESCE(p_reason_code, ''))) < 8
  THEN
    RETURN jsonb_build_object('ok', false, 'code', 'correction_reason_required', 'retryable', false);
  END IF;

  IF v_booking.status = 'pending_payment' AND p_to_status = 'confirmed' THEN
    IF COALESCE(p_payment_amount, 0) > 0 THEN
      IF p_payment_method IS NULL OR p_payment_idempotency_key IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'code', 'invalid_input', 'retryable', false);
      END IF;

      v_payment_result := public.record_manual_booking_payment(
        p_booking_id,
        'deposit',
        p_payment_amount,
        'KZT',
        p_payment_method,
        p_payment_idempotency_key
      );

      IF NOT COALESCE((v_payment_result->>'ok')::boolean, false) THEN
        RETURN v_payment_result;
      END IF;

      SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id;
    END IF;

    IF p_waive_payment THEN
      PERFORM set_config('revenue_core.transition_write', 'on', true);
      UPDATE public.bookings
      SET payment_status = 'waived'
      WHERE id = p_booking_id;
      PERFORM set_config('revenue_core.transition_write', 'off', true);
      v_booking.payment_status := 'waived';
    ELSIF v_booking.paid_amount < v_booking.deposit_required_amount THEN
      RETURN jsonb_build_object('ok', false, 'code', 'payment_required', 'retryable', false);
    END IF;
  END IF;

  IF v_booking.status = 'confirmed' AND p_to_status IN ('completed', 'no_show') THEN
    BEGIN
      v_slot_start := (v_booking.slot_date + v_booking.slot_time) AT TIME ZONE v_booking.booking_timezone;
    EXCEPTION
      WHEN invalid_parameter_value THEN
        RETURN jsonb_build_object('ok', false, 'code', 'invalid_booking_timezone', 'retryable', false);
    END;

    IF now() < v_slot_start THEN
      RETURN jsonb_build_object('ok', false, 'code', 'slot_not_started', 'retryable', false);
    END IF;
  END IF;

  IF v_booking.status = 'confirmed' AND p_to_status = 'completed' THEN
    IF p_payment_amount IS NULL OR p_payment_amount < 0 THEN
      RETURN jsonb_build_object('ok', false, 'code', 'collected_amount_required', 'retryable', false);
    END IF;

    IF p_payment_amount > 0 THEN
      IF p_payment_method IS NULL OR p_payment_idempotency_key IS NULL THEN
        RETURN jsonb_build_object('ok', false, 'code', 'invalid_input', 'retryable', false);
      END IF;

      v_payment_result := public.record_manual_booking_payment(
        p_booking_id,
        'balance',
        p_payment_amount,
        'KZT',
        p_payment_method,
        p_payment_idempotency_key
      );

      IF NOT COALESCE((v_payment_result->>'ok')::boolean, false) THEN
        RETURN v_payment_result;
      END IF;
    END IF;
  END IF;

  v_new_version := v_booking.version + 1;

  INSERT INTO public.booking_status_transitions (
    booking_id,
    from_status,
    to_status,
    actor_type,
    actor_user_id,
    reason_code,
    metadata,
    idempotency_key
  )
  VALUES (
    v_booking.id,
    v_booking.status,
    p_to_status,
    p_actor_type,
    CASE WHEN p_actor_type = 'owner' THEN v_user_id ELSE NULL END,
    btrim(p_reason_code),
    jsonb_build_object('resultVersion', v_new_version),
    p_idempotency_key
  )
  RETURNING id INTO v_inserted_id;

  PERFORM set_config('revenue_core.transition_write', 'on', true);

  UPDATE public.bookings
  SET status = p_to_status,
      status_reason = btrim(p_reason_code),
      version = v_new_version,
      confirmed_at = CASE
        WHEN p_to_status = 'confirmed' THEN COALESCE(confirmed_at, now())
        ELSE confirmed_at
      END,
      cancelled_at = CASE WHEN p_to_status = 'cancelled' THEN now() ELSE cancelled_at END,
      completed_at = CASE WHEN p_to_status = 'completed' THEN now() ELSE completed_at END,
      no_show_at = CASE WHEN p_to_status = 'no_show' THEN now() ELSE no_show_at END,
      updated_at = now()
  WHERE id = p_booking_id;

  PERFORM set_config('revenue_core.transition_write', 'off', true);

  RETURN jsonb_build_object(
    'ok', true,
    'bookingId', p_booking_id,
    'status', p_to_status,
    'version', v_new_version,
    'transitionId', v_inserted_id,
    'idempotentReplay', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_platform_booking_payment(
  p_booking_id uuid,
  p_amount numeric,
  p_currency text,
  p_provider text,
  p_provider_reference text,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_existing public.booking_payments%ROWTYPE;
  v_payment_id uuid;
  v_transition_result jsonb;
BEGIN
  IF NOT public.is_revenue_service_role() THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_allowed', 'retryable', false);
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'booking_not_found', 'retryable', false);
  END IF;

  SELECT * INTO v_existing
  FROM public.booking_payments
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF v_existing.booking_id IS DISTINCT FROM p_booking_id THEN
      RETURN jsonb_build_object('ok', false, 'code', 'idempotency_conflict', 'retryable', false);
    END IF;

    RETURN jsonb_build_object(
      'ok', true,
      'bookingId', p_booking_id,
      'paymentId', v_existing.id,
      'idempotentReplay', true
    );
  END IF;

  IF p_amount IS NULL
    OR p_amount <= 0
    OR p_currency !~ '^[A-Z]{3}$'
    OR p_provider <> 'robokassa'
    OR char_length(COALESCE(p_provider_reference, '')) NOT BETWEEN 1 AND 200
    OR char_length(COALESCE(p_idempotency_key, '')) NOT BETWEEN 8 AND 200
  THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_input', 'retryable', false);
  END IF;

  INSERT INTO public.booking_payments (
    booking_id,
    owner_id,
    kind,
    status,
    amount,
    currency,
    method,
    processing_source,
    provider,
    provider_reference,
    confirmed_at,
    idempotency_key
  )
  VALUES (
    v_booking.id,
    v_booking.owner_id,
    CASE WHEN v_booking.paid_amount < v_booking.deposit_required_amount THEN 'deposit' ELSE 'balance' END,
    'succeeded',
    p_amount,
    p_currency,
    'robokassa',
    'platform',
    p_provider,
    p_provider_reference,
    now(),
    p_idempotency_key
  )
  RETURNING id INTO v_payment_id;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id;

  IF v_booking.status = 'pending_payment'
    AND v_booking.paid_amount >= v_booking.deposit_required_amount
  THEN
    v_transition_result := public.transition_booking(
      p_booking_id,
      'confirmed',
      v_booking.version,
      'provider_payment_succeeded',
      'provider-confirm:' || p_idempotency_key,
      NULL,
      NULL,
      NULL,
      false,
      false,
      'provider'
    );

    IF NOT COALESCE((v_transition_result->>'ok')::boolean, false) THEN
      RAISE EXCEPTION 'provider_booking_transition_failed';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'bookingId', p_booking_id,
    'paymentId', v_payment_id,
    'idempotentReplay', false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_complete_past_bookings(p_owner_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'automatic_booking_completion_disabled' USING ERRCODE = 'P0001';
END;
$$;

REVOKE ALL ON public.booking_payments FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.booking_status_transitions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.booking_payments TO authenticated;
GRANT SELECT ON public.booking_status_transitions TO authenticated;
GRANT ALL ON public.booking_payments TO service_role;
GRANT ALL ON public.booking_status_transitions TO service_role;

REVOKE ALL ON FUNCTION public.can_manage_booking(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_manual_booking_payment(uuid, text, numeric, text, text, text)
  FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.transition_booking(
  uuid, text, integer, text, text, numeric, text, text, boolean, boolean, text
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.auto_complete_past_bookings(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_platform_booking_payment(uuid, numeric, text, text, text, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.can_manage_booking(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_manual_booking_payment(uuid, text, numeric, text, text, text)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.transition_booking(
  uuid, text, integer, text, text, numeric, text, text, boolean, boolean, text
) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.auto_complete_past_bookings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_platform_booking_payment(uuid, numeric, text, text, text, text)
  TO service_role;

COMMENT ON TABLE public.booking_payments IS
  'Immutable succeeded/failed payment and refund facts; manual external money never creates wallet transactions.';
COMMENT ON TABLE public.booking_status_transitions IS
  'Immutable audit trail for all authoritative booking lifecycle transitions.';
COMMENT ON FUNCTION public.transition_booking IS
  'Optimistic, idempotent booking state machine; clients cannot update booking status directly.';
COMMENT ON FUNCTION public.record_manual_booking_payment IS
  'Records an authenticated external manual payment fact without touching the LinkMAX wallet.';

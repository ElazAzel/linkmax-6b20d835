-- Token-scoped booking self-service with optimistic concurrency and no raw row access.

CREATE OR REPLACE FUNCTION public.get_booking_by_access_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access public.booking_access_tokens%ROWTYPE;
  v_booking public.bookings%ROWTYPE;
  v_owner_page_path text;
  v_allowed_actions text[];
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'token_invalid', 'retryable', false);
  END IF;

  SELECT * INTO v_access
  FROM public.booking_access_tokens
  WHERE token_hash = public.hash_booking_access_token(p_token)
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'token_invalid', 'retryable', false);
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = v_access.booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'booking_not_found', 'retryable', false);
  END IF;

  SELECT CASE WHEN page.is_published THEN '/' || page.slug ELSE NULL END
  INTO v_owner_page_path
  FROM public.pages page
  WHERE page.id = v_booking.page_id;

  IF v_access.expires_at <= now() THEN
    RETURN jsonb_strip_nulls(jsonb_build_object(
      'ok', false,
      'code', 'token_expired',
      'retryable', false,
      'ownerPagePath', v_owner_page_path
    ));
  END IF;

  SELECT COALESCE(array_agg(scope ORDER BY scope), ARRAY[]::text[])
  INTO v_allowed_actions
  FROM unnest(v_access.scopes) AS scope
  WHERE scope <> 'read'
    AND (
      (scope IN ('cancel', 'reschedule') AND v_booking.status IN ('pending_payment', 'confirmed'))
      OR (scope = 'confirm' AND v_booking.status = 'confirmed')
    );

  RETURN jsonb_build_object(
    'ok', true,
    'booking', jsonb_strip_nulls(jsonb_build_object(
      'id', v_booking.id,
      'serviceName', v_booking.service_snapshot->>'name',
      'slotDate', v_booking.slot_date,
      'slotTime', v_booking.slot_time,
      'slotEndTime', v_booking.slot_end_time,
      'timezone', v_booking.booking_timezone,
      'status', v_booking.status,
      'version', v_booking.version,
      'paymentStatus', v_booking.payment_status,
      'depositRequiredAmount', to_char(v_booking.deposit_required_amount, 'FM9999999990.00'),
      'paidAmount', to_char(v_booking.paid_amount, 'FM9999999990.00'),
      'currency', COALESCE(v_booking.service_snapshot->>'currency', 'KZT'),
      'allowedActions', to_jsonb(v_allowed_actions),
      'ownerPagePath', v_owner_page_path
    ))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_booking_management_availability(
  p_token text,
  p_from_date date,
  p_to_date date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access public.booking_access_tokens%ROWTYPE;
  v_booking public.bookings%ROWTYPE;
  v_slots jsonb;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'token_invalid', 'retryable', false);
  END IF;

  SELECT * INTO v_access
  FROM public.booking_access_tokens
  WHERE token_hash = public.hash_booking_access_token(p_token)
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'token_invalid', 'retryable', false);
  END IF;

  IF v_access.expires_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'code', 'token_expired', 'retryable', false);
  END IF;

  IF NOT ('reschedule' = ANY(v_access.scopes)) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'action_not_allowed', 'retryable', false);
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = v_access.booking_id;

  IF NOT FOUND OR v_booking.status NOT IN ('pending_payment', 'confirmed') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'action_not_allowed', 'retryable', false);
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'date', slot.slot_date,
    'time', slot.slot_time,
    'endTime', slot.slot_end_time,
    'available', slot.available
  ) ORDER BY slot.slot_date, slot.slot_time), '[]'::jsonb)
  INTO v_slots
  FROM public.get_public_availability(
    v_booking.page_id,
    v_booking.block_id,
    p_from_date,
    p_to_date,
    v_booking.staff_id
  ) slot;

  RETURN jsonb_build_object('ok', true, 'slots', v_slots);
END;
$$;

DROP FUNCTION IF EXISTS public.manage_booking_by_access_token(text, text, text, date, time, time);

CREATE FUNCTION public.manage_booking_by_access_token(
  p_token text,
  p_action text,
  p_expected_version integer,
  p_idempotency_key text,
  p_slot_date date DEFAULT NULL,
  p_slot_time time DEFAULT NULL,
  p_slot_end_time time DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_access public.booking_access_tokens%ROWTYPE;
  v_booking public.bookings%ROWTYPE;
  v_existing public.booking_status_transitions%ROWTYPE;
  v_new_version integer;
  v_reason text;
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$'
    OR p_expected_version IS NULL OR p_expected_version < 1
    OR char_length(COALESCE(p_idempotency_key, '')) NOT BETWEEN 8 AND 200
  THEN
    RETURN jsonb_build_object('ok', false, 'code', 'token_invalid', 'retryable', false);
  END IF;

  SELECT * INTO v_access
  FROM public.booking_access_tokens
  WHERE token_hash = public.hash_booking_access_token(p_token)
    AND revoked_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'token_invalid', 'retryable', false);
  END IF;

  IF v_access.expires_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'code', 'token_expired', 'retryable', false);
  END IF;

  IF NOT (p_action = ANY(v_access.scopes)) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'action_not_allowed', 'retryable', false);
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = v_access.booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'booking_not_found', 'retryable', false);
  END IF;

  SELECT * INTO v_existing
  FROM public.booking_status_transitions
  WHERE idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF v_existing.booking_id IS DISTINCT FROM v_booking.id THEN
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

  IF v_booking.version <> p_expected_version THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'version_conflict',
      'retryable', true,
      'currentVersion', v_booking.version
    );
  END IF;

  v_new_version := v_booking.version + 1;

  IF p_action = 'cancel' THEN
    IF v_booking.status NOT IN ('pending_payment', 'confirmed') THEN
      RETURN jsonb_build_object('ok', false, 'code', 'transition_not_allowed', 'retryable', false);
    END IF;
    v_reason := 'customer_cancelled';
  ELSIF p_action = 'confirm' THEN
    IF v_booking.status <> 'confirmed' THEN
      RETURN jsonb_build_object('ok', false, 'code', 'transition_not_allowed', 'retryable', false);
    END IF;
    v_reason := 'customer_attendance_confirmed';
  ELSIF p_action = 'reschedule' THEN
    IF v_booking.status NOT IN ('pending_payment', 'confirmed')
      OR p_slot_date IS NULL
      OR p_slot_time IS NULL
      OR NOT public.is_public_booking_slot_allowed(
        v_booking.page_id,
        v_booking.block_id,
        p_slot_date,
        p_slot_time,
        v_booking.staff_id
      )
    THEN
      RETURN jsonb_build_object('ok', false, 'code', 'slot_unavailable', 'retryable', false);
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(
      concat_ws(':', v_booking.page_id::text, v_booking.block_id, COALESCE(v_booking.staff_id::text, 'solo'), p_slot_date::text, p_slot_time::text),
      0
    ));

    IF EXISTS (
      SELECT 1
      FROM public.bookings occupied
      WHERE occupied.id <> v_booking.id
        AND occupied.page_id = v_booking.page_id
        AND occupied.block_id = v_booking.block_id
        AND occupied.staff_id IS NOT DISTINCT FROM v_booking.staff_id
        AND occupied.slot_date = p_slot_date
        AND occupied.slot_time = p_slot_time
        AND occupied.status <> 'cancelled'
    ) THEN
      RETURN jsonb_build_object('ok', false, 'code', 'slot_unavailable', 'retryable', false);
    END IF;

    PERFORM set_config('revenue_core.fact_correction_write', 'on', true);
    UPDATE public.bookings
    SET slot_date = p_slot_date,
        slot_time = p_slot_time,
        slot_end_time = COALESCE(
          p_slot_end_time,
          (p_slot_time + make_interval(
            mins => COALESCE((v_booking.service_snapshot->>'durationMinutes')::integer, 60)
          ))::time
        )
    WHERE id = v_booking.id;
    PERFORM set_config('revenue_core.fact_correction_write', 'off', true);
    v_reason := 'customer_rescheduled';
  ELSE
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_input', 'retryable', false);
  END IF;

  INSERT INTO public.booking_status_transitions (
    booking_id, from_status, to_status, actor_type, reason_code, metadata, idempotency_key
  ) VALUES (
    v_booking.id,
    v_booking.status,
    CASE WHEN p_action = 'cancel' THEN 'cancelled' ELSE v_booking.status END,
    'visitor',
    v_reason,
    jsonb_build_object('resultVersion', v_new_version),
    p_idempotency_key
  );

  PERFORM set_config('revenue_core.transition_write', 'on', true);
  UPDATE public.bookings
  SET status = CASE WHEN p_action = 'cancel' THEN 'cancelled' ELSE status END,
      status_reason = v_reason,
      cancelled_at = CASE WHEN p_action = 'cancel' THEN now() ELSE cancelled_at END,
      version = v_new_version,
      updated_at = now()
  WHERE id = v_booking.id;
  PERFORM set_config('revenue_core.transition_write', 'off', true);

  RETURN jsonb_build_object(
    'ok', true,
    'bookingId', v_booking.id,
    'status', CASE WHEN p_action = 'cancel' THEN 'cancelled' ELSE v_booking.status END,
    'version', v_new_version,
    'idempotentReplay', false
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'code', 'slot_unavailable', 'retryable', false);
END;
$$;

REVOKE ALL ON FUNCTION public.get_booking_by_access_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_booking_management_availability(text, date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.manage_booking_by_access_token(text, text, integer, text, date, time, time) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_booking_by_access_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_management_availability(text, date, date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.manage_booking_by_access_token(text, text, integer, text, date, time, time)
  TO anon, authenticated;

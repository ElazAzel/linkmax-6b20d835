-- Revenue Core v1: safe owner-facing booking detail without access tokens or provider payloads.

CREATE OR REPLACE FUNCTION public.get_booking_owner_detail(p_booking_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings%ROWTYPE;
  v_currency text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.can_manage_booking(p_booking_id, auth.uid()) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_allowed');
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings booking
  WHERE booking.id = p_booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_allowed');
  END IF;

  v_currency := COALESCE(NULLIF(v_booking.service_snapshot->>'currency', ''), 'KZT');

  RETURN jsonb_build_object(
    'ok', true,
    'bookingId', v_booking.id,
    'pageId', v_booking.page_id,
    'version', v_booking.version,
    'status', v_booking.status,
    'statusReason', v_booking.status_reason,
    'localStart', to_char(v_booking.slot_date + v_booking.slot_time, 'YYYY-MM-DD"T"HH24:MI:SS'),
    'timezone', v_booking.booking_timezone,
    'slotStarted', CASE
      WHEN EXISTS (
        SELECT 1 FROM pg_timezone_names timezone_name
        WHERE timezone_name.name = v_booking.booking_timezone
      ) THEN ((v_booking.slot_date + v_booking.slot_time) AT TIME ZONE v_booking.booking_timezone) <= now()
      ELSE false
    END,
    'serviceName', COALESCE(
      NULLIF(v_booking.service_snapshot #>> '{name,ru}', ''),
      NULLIF(v_booking.service_snapshot #>> '{name,kk}', ''),
      NULLIF(v_booking.service_snapshot #>> '{name,en}', ''),
      NULLIF(v_booking.service_snapshot->>'name', ''),
      'Без названия'
    ),
    'serviceSnapshot', v_booking.service_snapshot,
    'client', jsonb_build_object(
      'name', v_booking.client_name,
      'phone', v_booking.client_phone,
      'email', v_booking.client_email,
      'notes', v_booking.client_notes
    ),
    'payment', jsonb_build_object(
      'status', v_booking.payment_status,
      'totalAmount', to_char(v_booking.total_price_amount, 'FM999999999999990.00'),
      'depositRequiredAmount', to_char(v_booking.deposit_required_amount, 'FM999999999999990.00'),
      'paidAmount', to_char(v_booking.paid_amount, 'FM999999999999990.00'),
      'refundedAmount', to_char(v_booking.refunded_amount, 'FM999999999999990.00'),
      'currency', v_currency,
      'facts', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'kind', payment.kind,
          'status', payment.status,
          'amount', to_char(payment.amount, 'FM999999999999990.00'),
          'currency', payment.currency,
          'method', payment.method,
          'processingSource', payment.processing_source,
          'confirmedAt', payment.confirmed_at,
          'createdAt', payment.created_at
        ) ORDER BY payment.created_at)
        FROM public.booking_payments payment
        WHERE payment.booking_id = v_booking.id
      ), '[]'::jsonb)
    ),
    'attribution', jsonb_build_object(
      'source', COALESCE(NULLIF(v_booking.attribution->>'source', ''), 'unknown'),
      'medium', NULLIF(v_booking.attribution->>'medium', ''),
      'campaign', NULLIF(v_booking.attribution->>'campaign', ''),
      'referrerHost', NULLIF(v_booking.attribution->>'referrerHost', '')
    ),
    'transitions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'fromStatus', transition.from_status,
        'toStatus', transition.to_status,
        'actorType', transition.actor_type,
        'reasonCode', transition.reason_code,
        'occurredAt', transition.occurred_at
      ) ORDER BY transition.occurred_at)
      FROM public.booking_status_transitions transition
      WHERE transition.booking_id = v_booking.id
    ), '[]'::jsonb),
    'notifications', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'eventKind', delivery.event_kind,
        'recipientRole', delivery.recipient_role,
        'channel', delivery.channel,
        'templateKey', delivery.template_key,
        'errorCode', delivery.error_code,
        'occurredAt', delivery.occurred_at
      ) ORDER BY delivery.occurred_at)
      FROM public.notification_delivery_events delivery
      WHERE delivery.booking_id = v_booking.id
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_booking_owner_detail(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_booking_owner_detail(uuid) TO authenticated;

COMMENT ON FUNCTION public.get_booking_owner_detail IS
  'Returns authorized booking, ledger, transition and delivery facts without tokens or provider payloads.';

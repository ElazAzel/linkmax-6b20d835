-- Revenue Core v1: one authorization-aware outcome summary for the creator dashboard.

CREATE OR REPLACE FUNCTION public.get_revenue_outcome_summary(
  p_page_id uuid,
  p_from date,
  p_to date
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_page public.pages%ROWTYPE;
  v_timezone text := 'Asia/Almaty';
  v_currency text := 'KZT';
  v_start_at timestamptz;
  v_end_at timestamptz;
  v_now_local timestamp;
  v_outcome jsonb;
  v_operations jsonb;
  v_readiness jsonb;
  v_funnel jsonb;
  v_by_source jsonb;
BEGIN
  IF v_user_id IS NULL OR p_page_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_allowed');
  END IF;

  IF p_from IS NULL OR p_to IS NULL OR p_from > p_to OR p_to - p_from > 366 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_period');
  END IF;

  SELECT page.*
  INTO v_page
  FROM public.pages page
  WHERE page.id = p_page_id
    AND (
      page.user_id = v_user_id
      OR public.is_admin(v_user_id)
      OR EXISTS (
        SELECT 1
        FROM public.organization_members member
        WHERE member.org_id = page.organization_id
          AND member.user_id = v_user_id
          AND member.role IN ('owner', 'admin', 'editor')
      )
    );

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_allowed');
  END IF;

  SELECT COALESCE(
    (
      SELECT draft.draft #>> '{availability,timezone}'
      FROM public.revenue_kit_drafts draft
      WHERE draft.page_id = p_page_id
      ORDER BY draft.updated_at DESC
      LIMIT 1
    ),
    (
      SELECT booking.booking_timezone
      FROM public.bookings booking
      WHERE booking.page_id = p_page_id
      ORDER BY booking.created_at DESC
      LIMIT 1
    ),
    'Asia/Almaty'
  )
  INTO v_timezone;

  IF NOT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_timezone) THEN
    v_timezone := 'Asia/Almaty';
  END IF;

  SELECT COALESCE(
    (
      SELECT offering.currency
      FROM public.service_offerings offering
      WHERE offering.page_id = p_page_id AND offering.is_active
      ORDER BY offering.display_order, offering.created_at
      LIMIT 1
    ),
    'KZT'
  )
  INTO v_currency;

  v_start_at := p_from::timestamp AT TIME ZONE v_timezone;
  v_end_at := (p_to + 1)::timestamp AT TIME ZONE v_timezone;
  v_now_local := now() AT TIME ZONE v_timezone;

  SELECT jsonb_build_object(
    'paidCompletedCount', count(*) FILTER (
      WHERE booking.status = 'completed'
        AND booking.paid_amount > booking.refunded_amount
    ),
    'freeCompletedCount', count(*) FILTER (
      WHERE booking.status = 'completed'
        AND booking.total_price_amount = 0
    ),
    'noShowCount', count(*) FILTER (WHERE booking.status = 'no_show'),
    'pendingPaymentCount', count(*) FILTER (WHERE booking.status = 'pending_payment'),
    'bookingCount', count(*),
    'collectedAmount', to_char(COALESCE(sum(booking.paid_amount) FILTER (
      WHERE COALESCE(booking.service_snapshot->>'currency', v_currency) = v_currency
    ), 0), 'FM999999999999990.00'),
    'refundedAmount', to_char(COALESCE(sum(booking.refunded_amount) FILTER (
      WHERE COALESCE(booking.service_snapshot->>'currency', v_currency) = v_currency
    ), 0), 'FM999999999999990.00'),
    'netCollectedAmount', to_char(COALESCE(sum(
      GREATEST(booking.paid_amount - booking.refunded_amount, 0)
    ) FILTER (
      WHERE COALESCE(booking.service_snapshot->>'currency', v_currency) = v_currency
    ), 0), 'FM999999999999990.00'),
    'pendingPaymentAmount', to_char(COALESCE(sum(
      GREATEST(booking.deposit_required_amount - booking.paid_amount, 0)
    ) FILTER (
      WHERE booking.status = 'pending_payment'
        AND COALESCE(booking.service_snapshot->>'currency', v_currency) = v_currency
    ), 0), 'FM999999999999990.00')
  )
  INTO v_outcome
  FROM public.bookings booking
  WHERE booking.page_id = p_page_id
    AND booking.slot_date BETWEEN p_from AND p_to;

  WITH operation_bookings AS (
    SELECT
      booking.id,
      booking.version,
      booking.status,
      booking.slot_date,
      booking.slot_time,
      booking.booking_timezone,
      booking.service_snapshot,
      booking.total_price_amount,
      booking.deposit_required_amount,
      booking.paid_amount,
      booking.refunded_amount,
      COALESCE(NULLIF(booking.attribution->>'source', ''), 'unknown') AS attribution_source,
      (booking.slot_date + booking.slot_time) AS local_start
    FROM public.bookings booking
    WHERE booking.page_id = p_page_id
      AND booking.status IN ('pending_payment', 'confirmed')
  ),
  shaped AS (
    SELECT *, jsonb_build_object(
      'bookingId', id,
      'version', version,
      'status', status,
      'localStart', to_char(local_start, 'YYYY-MM-DD"T"HH24:MI:SS'),
      'timezone', booking_timezone,
      'serviceName', COALESCE(
        NULLIF(service_snapshot #>> '{name,ru}', ''),
        NULLIF(service_snapshot->>'name', ''),
        'Без названия'
      ),
      'totalAmount', to_char(total_price_amount, 'FM999999999999990.00'),
      'depositRequiredAmount', to_char(deposit_required_amount, 'FM999999999999990.00'),
      'paidAmount', to_char(paid_amount, 'FM999999999999990.00'),
      'refundedAmount', to_char(refunded_amount, 'FM999999999999990.00'),
      'currency', COALESCE(NULLIF(service_snapshot->>'currency', ''), v_currency),
      'attributionSource', attribution_source
    ) AS item
    FROM operation_bookings
  )
  SELECT jsonb_build_object(
    'pendingPayments', COALESCE((
      SELECT jsonb_agg(item ORDER BY local_start) FROM (
        SELECT item, local_start
        FROM shaped
        WHERE status = 'pending_payment'
        ORDER BY local_start
        LIMIT 20
      ) limited
    ), '[]'::jsonb),
    'pastAppointments', COALESCE((
      SELECT jsonb_agg(item ORDER BY local_start) FROM (
        SELECT item, local_start
        FROM shaped
        WHERE status = 'confirmed' AND local_start < v_now_local
        ORDER BY local_start DESC
        LIMIT 20
      ) limited
    ), '[]'::jsonb),
    'upcomingUnacknowledged', COALESCE((
      SELECT jsonb_agg(item ORDER BY local_start) FROM (
        SELECT shaped.item, shaped.local_start
        FROM shaped
        WHERE shaped.status = 'confirmed'
          AND shaped.local_start >= v_now_local
          AND shaped.local_start < v_now_local + interval '24 hours'
          AND NOT EXISTS (
            SELECT 1
            FROM public.product_events event
            WHERE event.booking_id = shaped.id
              AND event.event_name = 'customer_attendance_confirmed'
          )
        ORDER BY shaped.local_start
        LIMIT 20
      ) limited
    ), '[]'::jsonb)
  )
  INTO v_operations;

  SELECT jsonb_build_object(
    'hasKit', EXISTS (
      SELECT 1 FROM public.revenue_kit_drafts draft WHERE draft.page_id = p_page_id
    ) OR EXISTS (
      SELECT 1 FROM public.service_offerings offering
      WHERE offering.page_id = p_page_id AND offering.source_kit_id IS NOT NULL
    ),
    'isPublished', v_page.is_published,
    'activeServiceCount', count(*) FILTER (WHERE offering.is_active),
    'hasFutureAvailability', EXISTS (
      SELECT 1
      FROM public.booking_slots slot
      WHERE slot.page_id = p_page_id
        AND slot.is_available
        AND (slot.specific_date IS NULL OR slot.specific_date >= (now() AT TIME ZONE v_timezone)::date)
    ),
    'depositSelected', COALESCE(bool_or(
      offering.is_active AND offering.deposit_mode <> 'none'
    ), false),
    'hasValidPaymentInstructions', COALESCE(bool_and(
      NOT offering.is_active
      OR offering.deposit_mode = 'none'
      OR NULLIF(btrim(COALESCE(offering.payment_instructions_i18n->>'ru', '')), '') IS NOT NULL
      OR NULLIF(btrim(COALESCE(offering.payment_instructions_i18n->>'kk', '')), '') IS NOT NULL
      OR NULLIF(btrim(COALESCE(offering.payment_instructions_i18n->>'en', '')), '') IS NOT NULL
    ), true),
    'hasMixedCurrencies', count(DISTINCT offering.currency) FILTER (WHERE offering.is_active) > 1,
    'attributedExternalVisitCount', (
      SELECT count(*)
      FROM public.product_events event
      WHERE event.page_id = p_page_id
        AND event.event_name = 'service_viewed'
        AND event.occurred_at >= v_start_at
        AND event.occurred_at < v_end_at
        AND COALESCE(NULLIF(event.metadata->>'source', ''), 'unknown') NOT IN ('unknown', 'direct')
    )
  )
  INTO v_readiness
  FROM public.service_offerings offering
  WHERE offering.page_id = p_page_id;

  SELECT jsonb_build_object(
    'serviceViewed', count(*) FILTER (WHERE event.event_name = 'service_viewed'),
    'bookingStarted', count(*) FILTER (WHERE event.event_name = 'booking_started'),
    'bookingCreated', (
      SELECT count(*) FROM public.bookings booking
      WHERE booking.page_id = p_page_id
        AND booking.created_at >= v_start_at AND booking.created_at < v_end_at
    ),
    'bookingPaid', (
      SELECT count(*) FROM public.bookings booking
      WHERE booking.page_id = p_page_id
        AND booking.created_at >= v_start_at AND booking.created_at < v_end_at
        AND booking.paid_amount > booking.refunded_amount
    ),
    'bookingCompleted', (
      SELECT count(*) FROM public.bookings booking
      WHERE booking.page_id = p_page_id
        AND booking.slot_date BETWEEN p_from AND p_to
        AND booking.status = 'completed'
    )
  )
  INTO v_funnel
  FROM public.product_events event
  WHERE event.page_id = p_page_id
    AND event.occurred_at >= v_start_at
    AND event.occurred_at < v_end_at
    AND event.event_name IN ('service_viewed', 'booking_started');

  WITH sources AS (
    SELECT COALESCE(NULLIF(booking.attribution->>'source', ''), 'unknown') AS source
    FROM public.bookings booking
    WHERE booking.page_id = p_page_id
      AND booking.created_at >= v_start_at AND booking.created_at < v_end_at
    UNION
    SELECT COALESCE(NULLIF(event.metadata->>'source', ''), 'unknown') AS source
    FROM public.product_events event
    WHERE event.page_id = p_page_id
      AND event.occurred_at >= v_start_at AND event.occurred_at < v_end_at
      AND event.event_name IN ('service_viewed', 'booking_started')
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'source', sources.source,
    'serviceViewed', (
      SELECT count(*) FROM public.product_events event
      WHERE event.page_id = p_page_id
        AND event.event_name = 'service_viewed'
        AND event.occurred_at >= v_start_at AND event.occurred_at < v_end_at
        AND COALESCE(NULLIF(event.metadata->>'source', ''), 'unknown') = sources.source
    ),
    'bookingStarted', (
      SELECT count(*) FROM public.product_events event
      WHERE event.page_id = p_page_id
        AND event.event_name = 'booking_started'
        AND event.occurred_at >= v_start_at AND event.occurred_at < v_end_at
        AND COALESCE(NULLIF(event.metadata->>'source', ''), 'unknown') = sources.source
    ),
    'bookingCreated', (
      SELECT count(*) FROM public.bookings booking
      WHERE booking.page_id = p_page_id
        AND booking.created_at >= v_start_at AND booking.created_at < v_end_at
        AND COALESCE(NULLIF(booking.attribution->>'source', ''), 'unknown') = sources.source
    ),
    'bookingPaid', (
      SELECT count(*) FROM public.bookings booking
      WHERE booking.page_id = p_page_id
        AND booking.created_at >= v_start_at AND booking.created_at < v_end_at
        AND booking.paid_amount > booking.refunded_amount
        AND COALESCE(NULLIF(booking.attribution->>'source', ''), 'unknown') = sources.source
    ),
    'bookingCompleted', (
      SELECT count(*) FROM public.bookings booking
      WHERE booking.page_id = p_page_id
        AND booking.slot_date BETWEEN p_from AND p_to
        AND booking.status = 'completed'
        AND COALESCE(NULLIF(booking.attribution->>'source', ''), 'unknown') = sources.source
    ),
    'netCollectedAmount', to_char(COALESCE((
      SELECT sum(GREATEST(booking.paid_amount - booking.refunded_amount, 0))
      FROM public.bookings booking
      WHERE booking.page_id = p_page_id
        AND booking.slot_date BETWEEN p_from AND p_to
        AND COALESCE(NULLIF(booking.attribution->>'source', ''), 'unknown') = sources.source
        AND COALESCE(booking.service_snapshot->>'currency', v_currency) = v_currency
    ), 0), 'FM999999999999990.00'),
    'currency', v_currency
  ) ORDER BY sources.source), '[]'::jsonb)
  INTO v_by_source
  FROM sources;

  RETURN jsonb_build_object(
    'ok', true,
    'pageId', p_page_id,
    'period', jsonb_build_object('from', p_from, 'to', p_to, 'timezone', v_timezone),
    'currency', v_currency,
    'outcome', v_outcome,
    'operations', v_operations,
    'readiness', v_readiness,
    'funnel', v_funnel,
    'bySource', v_by_source,
    'metadata', jsonb_build_object(
      'generatedAt', now(),
      'provisionalCompletionDays', 7,
      'provisionalFrom', GREATEST(p_from, p_to - 6),
      'moneySource', 'booking_payment_ledger_projection'
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_revenue_outcome_summary(uuid, date, date)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_revenue_outcome_summary(uuid, date, date)
  TO authenticated;

COMMENT ON FUNCTION public.get_revenue_outcome_summary IS
  'Returns page-local, ledger-backed booking outcomes and operations after creator authorization.';

-- Revenue Core v1: public-safe availability, creation, and token-scoped management.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS creation_idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_creation_idempotency
  ON public.bookings (creation_idempotency_key)
  WHERE creation_idempotency_key IS NOT NULL;

DROP INDEX IF EXISTS public.bookings_no_double_booking;
DROP INDEX IF EXISTS public.idx_bookings_no_double_booking;
DROP INDEX IF EXISTS public.idx_bookings_uniqueness_guard;

CREATE UNIQUE INDEX idx_bookings_unique_staff_slot
  ON public.bookings (
    page_id,
    block_id,
    COALESCE(staff_id, '00000000-0000-0000-0000-000000000000'::uuid),
    slot_date,
    slot_time
  )
  WHERE status <> 'cancelled';

CREATE TABLE public.booking_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  scopes text[] NOT NULL DEFAULT ARRAY['read', 'confirm', 'cancel', 'reschedule'],
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_access_tokens_hash_check CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  CONSTRAINT booking_access_tokens_scopes_check CHECK (
    scopes <@ ARRAY['read', 'confirm', 'cancel', 'reschedule']::text[]
  )
);

CREATE INDEX idx_booking_access_tokens_booking
  ON public.booking_access_tokens (booking_id, expires_at DESC);

ALTER TABLE public.booking_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.sanitize_booking_attribution(p_attribution jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT jsonb_strip_nulls(jsonb_build_object(
    'visitorId', NULLIF(left(btrim(COALESCE(p_attribution->>'visitorId', '')), 200), ''),
    'sessionId', NULLIF(left(btrim(COALESCE(p_attribution->>'sessionId', '')), 200), ''),
    'source', NULLIF(left(btrim(COALESCE(p_attribution->>'source', '')), 200), ''),
    'medium', NULLIF(left(btrim(COALESCE(p_attribution->>'medium', '')), 200), ''),
    'campaign', NULLIF(left(btrim(COALESCE(p_attribution->>'campaign', '')), 200), ''),
    'content', NULLIF(left(btrim(COALESCE(p_attribution->>'content', '')), 200), ''),
    'referrerHost', NULLIF(left(btrim(COALESCE(p_attribution->>'referrerHost', '')), 200), ''),
    'landingPath', NULLIF(left(btrim(COALESCE(p_attribution->>'landingPath', '')), 200), ''),
    'smartLinkId', NULLIF(left(btrim(COALESCE(p_attribution->>'smartLinkId', '')), 200), '')
  ));
$$;

CREATE OR REPLACE FUNCTION public.hash_booking_access_token(p_token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT encode(digest(p_token, 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.is_public_booking_slot_allowed(
  p_page_id uuid,
  p_block_id text,
  p_slot_date date,
  p_slot_time time,
  p_staff_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content jsonb;
  v_organization_id uuid;
  v_max_days integer;
  v_start_hour integer;
  v_end_hour integer;
  v_duration integer;
  v_minute_of_day integer;
  v_has_json_slots boolean;
  v_has_stored_slots boolean;
BEGIN
  SELECT block.content, page.organization_id
  INTO v_content, v_organization_id
  FROM public.blocks block
  JOIN public.pages page ON page.id = block.page_id
  WHERE page.id = p_page_id
    AND page.is_published = true
    AND block.id::text = p_block_id
    AND block.type = 'booking';

  IF NOT FOUND OR p_slot_date < CURRENT_DATE THEN
    RETURN false;
  END IF;

  v_max_days := LEAST(GREATEST(COALESCE((v_content->>'maxBookingDays')::integer, 30), 1), 365);
  IF p_slot_date > CURRENT_DATE + v_max_days THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(COALESCE(v_content->'disabledWeekdays', '[]'::jsonb)) disabled(day)
    WHERE disabled.day ~ '^[0-6]$'
      AND disabled.day::integer = EXTRACT(DOW FROM p_slot_date)::integer
  ) THEN
    RETURN false;
  END IF;

  IF p_staff_id IS NOT NULL AND NOT EXISTS (
    SELECT 1
    FROM public.zone_staff staff
    WHERE staff.id = p_staff_id
      AND staff.zone_id = v_organization_id
      AND staff.is_active = true
  ) THEN
    RETURN false;
  END IF;

  v_has_json_slots := jsonb_typeof(v_content->'slots') = 'array'
    AND jsonb_array_length(v_content->'slots') > 0;

  IF v_has_json_slots THEN
    RETURN EXISTS (
      SELECT 1
      FROM jsonb_array_elements(v_content->'slots') slot
      WHERE slot->>'startTime' ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
        AND (slot->>'startTime')::time = p_slot_time
    );
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.booking_slots slot
    WHERE slot.page_id = p_page_id
      AND slot.block_id = p_block_id
      AND slot.is_available = true
      AND (slot.staff_id IS NOT DISTINCT FROM p_staff_id)
      AND (
        slot.specific_date = p_slot_date
        OR (slot.specific_date IS NULL AND slot.day_of_week = EXTRACT(DOW FROM p_slot_date)::integer)
      )
  ) INTO v_has_stored_slots;

  IF v_has_stored_slots THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.booking_slots slot
      WHERE slot.page_id = p_page_id
        AND slot.block_id = p_block_id
        AND slot.is_available = true
        AND (slot.staff_id IS NOT DISTINCT FROM p_staff_id)
        AND slot.start_time = p_slot_time
        AND (
          slot.specific_date = p_slot_date
          OR (slot.specific_date IS NULL AND slot.day_of_week = EXTRACT(DOW FROM p_slot_date)::integer)
        )
    );
  END IF;

  v_start_hour := LEAST(GREATEST(COALESCE((v_content->>'workingHoursStart')::integer, 9), 0), 23);
  v_end_hour := LEAST(GREATEST(COALESCE((v_content->>'workingHoursEnd')::integer, 18), 1), 24);
  v_duration := LEAST(GREATEST(COALESCE((v_content->>'slotDuration')::integer, 60), 5), 720);
  v_minute_of_day := EXTRACT(HOUR FROM p_slot_time)::integer * 60
    + EXTRACT(MINUTE FROM p_slot_time)::integer;

  RETURN v_end_hour > v_start_hour
    AND v_minute_of_day >= v_start_hour * 60
    AND v_minute_of_day + v_duration <= v_end_hour * 60
    AND (v_minute_of_day - v_start_hour * 60) % v_duration = 0;
EXCEPTION
  WHEN invalid_text_representation OR numeric_value_out_of_range THEN
    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_booking_context(p_page_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT jsonb_build_object(
      'ok', true,
      'page', jsonb_build_object(
        'id', page.id,
        'slug', page.slug,
        'title', page.title
      ),
      'services', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'id', offering.id,
          'name', COALESCE(
            NULLIF(btrim(offering.name_i18n->>'ru'), ''),
            NULLIF(btrim(offering.name_i18n->>'kk'), '')
          ),
          'description', COALESCE(offering.description_i18n->>'ru', offering.description_i18n->>'kk'),
          'durationMinutes', offering.duration_minutes,
          'priceAmount', to_char(offering.price_amount, 'FM9999999990.00'),
          'currency', offering.currency,
          'depositMode', offering.deposit_mode,
          'depositValue', to_char(offering.deposit_value, 'FM9999999990.00')
        ) ORDER BY offering.display_order, offering.created_at)
        FROM public.service_offerings offering
        WHERE offering.page_id = page.id
          AND offering.is_active = true
      ), '[]'::jsonb)
    )
    FROM public.pages page
    WHERE page.id = p_page_id
      AND page.is_published = true
  ), jsonb_build_object('ok', false, 'code', 'page_not_public'));
$$;

CREATE OR REPLACE FUNCTION public.get_public_availability(
  p_page_id uuid,
  p_block_id text,
  p_from_date date,
  p_to_date date,
  p_staff_id uuid DEFAULT NULL
)
RETURNS TABLE (
  slot_date date,
  slot_time time,
  slot_end_time time,
  available boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH requested_dates AS (
    SELECT day::date AS slot_date
    FROM generate_series(
      p_from_date,
      LEAST(p_to_date, p_from_date + 60),
      interval '1 day'
    ) day
    WHERE p_from_date <= p_to_date
  ),
  stored_candidates AS (
    SELECT
      requested.slot_date,
      template.start_time AS slot_time,
      template.end_time AS slot_end_time
    FROM requested_dates requested
    JOIN public.booking_slots template
      ON template.page_id = p_page_id
     AND template.block_id = p_block_id
     AND template.is_available = true
     AND template.staff_id IS NOT DISTINCT FROM p_staff_id
     AND (
       template.specific_date = requested.slot_date
       OR (
         template.specific_date IS NULL
         AND template.day_of_week = EXTRACT(DOW FROM requested.slot_date)::integer
       )
     )
    WHERE EXISTS (
      SELECT 1
      FROM public.pages page
      WHERE page.id = p_page_id
        AND page.is_published = true
    )
  ),
  occupied AS (
    SELECT
      booking.slot_date,
      booking.slot_time,
      booking.slot_end_time
    FROM public.bookings booking
    JOIN public.pages page ON page.id = booking.page_id
    WHERE booking.page_id = p_page_id
      AND booking.block_id = p_block_id
      AND booking.slot_date BETWEEN p_from_date AND LEAST(p_to_date, p_from_date + 60)
      AND booking.staff_id IS NOT DISTINCT FROM p_staff_id
      AND booking.status <> 'cancelled'
      AND page.is_published = true
  )
  SELECT
    candidate.slot_date,
    candidate.slot_time,
    candidate.slot_end_time,
    NOT EXISTS (
      SELECT 1
      FROM occupied booking
      WHERE booking.slot_date = candidate.slot_date
        AND booking.slot_time = candidate.slot_time
    ) AS available
  FROM stored_candidates candidate

  UNION ALL

  SELECT
    booking.slot_date,
    booking.slot_time,
    booking.slot_end_time,
    false AS available
  FROM occupied booking
  WHERE NOT EXISTS (
    SELECT 1
    FROM stored_candidates candidate
    WHERE candidate.slot_date = booking.slot_date
      AND candidate.slot_time = booking.slot_time
  )
  ORDER BY 1, 2;
$$;

CREATE OR REPLACE FUNCTION public.reject_booking_creation_key_or_schedule_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.creation_idempotency_key IS DISTINCT FROM OLD.creation_idempotency_key THEN
    RAISE EXCEPTION 'booking_creation_key_is_immutable' USING ERRCODE = '42501';
  END IF;

  IF (
    NEW.slot_date IS DISTINCT FROM OLD.slot_date
    OR NEW.slot_time IS DISTINCT FROM OLD.slot_time
    OR NEW.slot_end_time IS DISTINCT FROM OLD.slot_end_time
    OR NEW.staff_id IS DISTINCT FROM OLD.staff_id
  )
  AND COALESCE(current_setting('revenue_core.fact_correction_write', true), '') <> 'on'
  THEN
    RAISE EXCEPTION 'booking_reschedule_rpc_required' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_booking_creation_key_and_schedule
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.reject_booking_creation_key_or_schedule_change();

CREATE OR REPLACE FUNCTION public.create_public_booking(
  p_page_id uuid,
  p_block_id text,
  p_service_offering_id uuid,
  p_slot_date date,
  p_slot_time time,
  p_staff_id uuid,
  p_client_name text,
  p_client_phone text,
  p_client_email text,
  p_client_notes text,
  p_booking_timezone text,
  p_attribution jsonb,
  p_idempotency_key text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page public.pages%ROWTYPE;
  v_block record;
  v_offering public.service_offerings%ROWTYPE;
  v_existing public.bookings%ROWTYPE;
  v_booking_id uuid;
  v_user_id uuid := auth.uid();
  v_service_name text;
  v_duration integer;
  v_price numeric(12, 2);
  v_currency text;
  v_deposit_mode text;
  v_deposit_value numeric(12, 2);
  v_deposit_required numeric(12, 2);
  v_status text;
  v_payment_status text;
  v_slot_end_time time;
  v_timezone text;
  v_token text;
  v_identity_source text;
  v_identity_secret text;
  v_identity_hash text;
  v_snapshot jsonb;
BEGIN
  IF char_length(btrim(COALESCE(p_client_name, ''))) NOT BETWEEN 1 AND 200
    OR char_length(COALESCE(p_client_phone, '')) > 40
    OR char_length(COALESCE(p_client_email, '')) > 254
    OR char_length(COALESCE(p_client_notes, '')) > 1000
    OR char_length(COALESCE(p_idempotency_key, '')) NOT BETWEEN 8 AND 200
  THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_input', 'retryable', false);
  END IF;

  SELECT * INTO v_page
  FROM public.pages
  WHERE id = p_page_id
    AND is_published = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'page_not_public', 'retryable', false);
  END IF;

  SELECT block.id, block.title, block.content
  INTO v_block
  FROM public.blocks block
  WHERE block.page_id = p_page_id
    AND block.id::text = p_block_id
    AND block.type = 'booking';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'service_unavailable', 'retryable', false);
  END IF;

  SELECT * INTO v_existing
  FROM public.bookings
  WHERE creation_idempotency_key = p_idempotency_key;

  IF FOUND THEN
    IF v_existing.page_id IS DISTINCT FROM p_page_id THEN
      RETURN jsonb_build_object('ok', false, 'code', 'idempotency_conflict', 'retryable', false);
    END IF;

    RETURN jsonb_build_object(
      'ok', true,
      'bookingId', v_existing.id,
      'status', v_existing.status,
      'version', v_existing.version,
      'accessToken', NULL,
      'idempotentReplay', true
    );
  END IF;

  IF NOT public.is_public_booking_slot_allowed(
    p_page_id,
    p_block_id,
    p_slot_date,
    p_slot_time,
    p_staff_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'slot_unavailable', 'retryable', false);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(
    concat_ws(':', p_page_id::text, p_block_id, COALESCE(p_staff_id::text, 'solo'), p_slot_date::text, p_slot_time::text),
    0
  ));

  IF EXISTS (
    SELECT 1
    FROM public.bookings booking
    WHERE booking.page_id = p_page_id
      AND booking.block_id = p_block_id
      AND booking.staff_id IS NOT DISTINCT FROM p_staff_id
      AND booking.slot_date = p_slot_date
      AND booking.slot_time = p_slot_time
      AND booking.status <> 'cancelled'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'slot_unavailable', 'retryable', false);
  END IF;

  IF p_service_offering_id IS NOT NULL THEN
    SELECT * INTO v_offering
    FROM public.service_offerings
    WHERE id = p_service_offering_id
      AND page_id = p_page_id
      AND is_active = true;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'code', 'service_unavailable', 'retryable', false);
    END IF;

    v_service_name := COALESCE(
      NULLIF(btrim(v_offering.name_i18n->>'ru'), ''),
      NULLIF(btrim(v_offering.name_i18n->>'kk'), '')
    );
    v_duration := v_offering.duration_minutes;
    v_price := v_offering.price_amount;
    v_currency := v_offering.currency;
    v_deposit_mode := v_offering.deposit_mode;
    v_deposit_value := v_offering.deposit_value;
    v_deposit_required := CASE v_offering.deposit_mode
      WHEN 'fixed' THEN v_offering.deposit_value
      WHEN 'percent' THEN round(v_offering.price_amount * v_offering.deposit_value / 100, 2)
      ELSE 0
    END;
  ELSE
    v_service_name := COALESCE(NULLIF(btrim(v_block.title), ''), 'Appointment');
    v_duration := LEAST(GREATEST(COALESCE((v_block.content->>'slotDuration')::integer, 60), 5), 720);
    v_currency := COALESCE(NULLIF(v_block.content->>'prepaymentCurrency', ''), 'KZT');
    v_deposit_required := CASE
      WHEN COALESCE((v_block.content->>'requirePrepayment')::boolean, false)
        AND COALESCE(v_block.content->>'prepaymentAmount', '') ~ '^\d+(\.\d{1,2})?$'
      THEN GREATEST((v_block.content->>'prepaymentAmount')::numeric(12, 2), 0)
      ELSE 0
    END;
    v_price := v_deposit_required;
    v_deposit_mode := CASE WHEN v_deposit_required > 0 THEN 'fixed' ELSE 'none' END;
    v_deposit_value := v_deposit_required;
  END IF;

  v_slot_end_time := (p_slot_time + make_interval(mins => v_duration))::time;
  v_timezone := CASE
    WHEN EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = p_booking_timezone)
      THEN p_booking_timezone
    WHEN EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = v_block.content->>'timezone')
      THEN v_block.content->>'timezone'
    ELSE 'Asia/Almaty'
  END;
  v_status := CASE WHEN v_deposit_required > 0 THEN 'pending_payment' ELSE 'confirmed' END;
  v_payment_status := CASE
    WHEN v_price = 0 THEN 'not_applicable'
    ELSE 'pending'
  END;

  v_snapshot := jsonb_build_object(
    'serviceOfferingId', p_service_offering_id,
    'name', v_service_name,
    'durationMinutes', v_duration,
    'priceAmount', to_char(v_price, 'FM9999999990.00'),
    'currency', v_currency,
    'depositMode', v_deposit_mode,
    'depositRequiredAmount', to_char(v_deposit_required, 'FM9999999990.00'),
    'cancellationWindowHours', COALESCE(v_offering.cancellation_window_hours, 24)
  );

  v_identity_source := lower(NULLIF(btrim(COALESCE(p_client_email, '')), ''));
  IF v_identity_source IS NULL THEN
    v_identity_source := NULLIF(regexp_replace(COALESCE(p_client_phone, ''), '[^0-9]+', '', 'g'), '');
  END IF;
  v_identity_secret := NULLIF(current_setting('app.settings.identity_hash_secret', true), '');
  v_identity_hash := CASE
    WHEN v_identity_source IS NOT NULL AND v_identity_secret IS NOT NULL
      THEN encode(hmac(v_identity_source, v_identity_secret, 'sha256'), 'hex')
    ELSE NULL
  END;

  INSERT INTO public.bookings (
    page_id,
    block_id,
    user_id,
    owner_id,
    staff_id,
    slot_date,
    slot_time,
    slot_end_time,
    client_name,
    client_phone,
    client_email,
    client_notes,
    status,
    service_offering_id,
    service_snapshot,
    booking_timezone,
    deposit_due_at,
    confirmed_at,
    total_price_amount,
    deposit_required_amount,
    payment_status,
    client_identity_hash,
    attribution,
    creation_idempotency_key
  )
  VALUES (
    p_page_id,
    p_block_id,
    v_user_id,
    v_page.user_id,
    p_staff_id,
    p_slot_date,
    p_slot_time,
    v_slot_end_time,
    btrim(p_client_name),
    NULLIF(btrim(COALESCE(p_client_phone, '')), ''),
    lower(NULLIF(btrim(COALESCE(p_client_email, '')), '')),
    NULLIF(btrim(COALESCE(p_client_notes, '')), ''),
    v_status,
    p_service_offering_id,
    v_snapshot,
    v_timezone,
    CASE WHEN v_deposit_required > 0 THEN now() + interval '24 hours' ELSE NULL END,
    CASE WHEN v_status = 'confirmed' THEN now() ELSE NULL END,
    v_price,
    v_deposit_required,
    v_payment_status,
    v_identity_hash,
    public.sanitize_booking_attribution(COALESCE(p_attribution, '{}'::jsonb)),
    p_idempotency_key
  )
  RETURNING id INTO v_booking_id;

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
    v_booking_id,
    NULL,
    v_status,
    'visitor',
    v_user_id,
    'booking_created',
    jsonb_build_object('resultVersion', 1),
    'create:' || p_idempotency_key
  );

  v_token := encode(gen_random_bytes(32), 'hex');

  INSERT INTO public.booking_access_tokens (
    booking_id,
    token_hash,
    expires_at
  )
  VALUES (
    v_booking_id,
    public.hash_booking_access_token(v_token),
    GREATEST(
      now() + interval '7 days',
      ((p_slot_date + p_slot_time) AT TIME ZONE v_timezone) + interval '30 days'
    )
  );

  RETURN jsonb_build_object(
    'ok', true,
    'bookingId', v_booking_id,
    'status', v_status,
    'version', 1,
    'paymentStatus', v_payment_status,
    'depositRequiredAmount', to_char(v_deposit_required, 'FM9999999990.00'),
    'currency', v_currency,
    'accessToken', v_token,
    'idempotentReplay', false
  );
EXCEPTION
  WHEN unique_violation THEN
    SELECT * INTO v_existing
    FROM public.bookings
    WHERE creation_idempotency_key = p_idempotency_key;

    IF FOUND AND v_existing.page_id IS NOT DISTINCT FROM p_page_id THEN
      RETURN jsonb_build_object(
        'ok', true,
        'bookingId', v_existing.id,
        'status', v_existing.status,
        'version', v_existing.version,
        'accessToken', NULL,
        'idempotentReplay', true
      );
    END IF;

    RETURN jsonb_build_object('ok', false, 'code', 'slot_unavailable', 'retryable', false);
END;
$$;

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
BEGIN
  IF p_token IS NULL OR p_token !~ '^[0-9a-f]{64}$' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'token_invalid');
  END IF;

  SELECT * INTO v_access
  FROM public.booking_access_tokens
  WHERE token_hash = public.hash_booking_access_token(p_token)
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'token_invalid');
  END IF;

  IF v_access.expires_at <= now() THEN
    RETURN jsonb_build_object('ok', false, 'code', 'token_expired');
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = v_access.booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'booking_not_found');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'booking', jsonb_build_object(
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
      'allowedActions', to_jsonb(v_access.scopes)
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.manage_booking_by_access_token(
  p_token text,
  p_action text,
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
    RETURN jsonb_build_object(
      'ok', true,
      'bookingId', v_existing.booking_id,
      'status', v_existing.to_status,
      'version', (v_existing.metadata->>'resultVersion')::integer,
      'idempotentReplay', true
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
    booking_id,
    from_status,
    to_status,
    actor_type,
    reason_code,
    metadata,
    idempotency_key
  )
  VALUES (
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

DROP POLICY IF EXISTS "Anyone can view bookings for public pages" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can create bookings on published pages" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON public.bookings;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.bookings FROM anon;
REVOKE INSERT ON public.bookings FROM authenticated;
GRANT SELECT, UPDATE, DELETE ON public.bookings TO authenticated;

REVOKE ALL ON public.booking_access_tokens FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.booking_access_tokens TO service_role;

REVOKE ALL ON FUNCTION public.is_public_booking_slot_allowed(uuid, text, date, time, uuid)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sanitize_booking_attribution(jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.hash_booking_access_token(text) FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.get_public_booking_context(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_availability(uuid, text, date, date, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_public_booking(
  uuid, text, uuid, date, time, uuid, text, text, text, text, text, jsonb, text
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_booking_by_access_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.manage_booking_by_access_token(text, text, text, date, time, time)
  FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_public_booking_context(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_availability(uuid, text, date, date, uuid)
  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_booking(
  uuid, text, uuid, date, time, uuid, text, text, text, text, text, jsonb, text
) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_by_access_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.manage_booking_by_access_token(text, text, text, date, time, time)
  TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_availability IS
  'Returns only slot_date, slot_time, slot_end_time and available; raw booking rows remain private.';
COMMENT ON FUNCTION public.create_public_booking IS
  'Creates an idempotent booking from server-derived owner, service, price, deposit, snapshot and safe attribution facts.';
COMMENT ON TABLE public.booking_access_tokens IS
  'Stores only SHA-256 access-token hashes; raw customer management tokens are returned once.';

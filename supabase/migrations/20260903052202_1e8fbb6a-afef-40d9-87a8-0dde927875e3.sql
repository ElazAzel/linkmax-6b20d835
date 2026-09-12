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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_content jsonb;
  v_max_days integer;
  v_start_hour integer;
  v_end_hour integer;
  v_duration integer;
  v_from date;
  v_to date;
  v_day date;
  v_has_stored boolean;
  v_has_json boolean;
  v_minute integer;
BEGIN
  SELECT COALESCE(block.content, '{}'::jsonb)
  INTO v_content
  FROM public.blocks block
  JOIN public.pages page ON page.id = block.page_id
  WHERE page.id = p_page_id
    AND page.is_published = true
    AND block.id::text = p_block_id
    AND block.type = 'booking';

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_max_days := LEAST(GREATEST(COALESCE((v_content->>'maxBookingDays')::integer, 30), 1), 365);
  v_start_hour := LEAST(GREATEST(COALESCE((v_content->>'workingHoursStart')::integer, 9), 0), 23);
  v_end_hour := LEAST(GREATEST(COALESCE((v_content->>'workingHoursEnd')::integer, 18), 1), 24);
  v_duration := LEAST(GREATEST(COALESCE((v_content->>'slotDuration')::integer, 60), 5), 720);

  v_from := GREATEST(p_from_date, CURRENT_DATE);
  v_to := LEAST(p_to_date, p_from_date + 60, CURRENT_DATE + v_max_days);

  IF v_from > v_to THEN
    RETURN;
  END IF;

  v_has_json := jsonb_typeof(v_content->'slots') = 'array'
    AND jsonb_array_length(v_content->'slots') > 0;

  FOR v_day IN SELECT day::date FROM generate_series(v_from, v_to, interval '1 day') day LOOP
    CONTINUE WHEN EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(COALESCE(v_content->'disabledWeekdays', '[]'::jsonb)) disabled(day)
      WHERE disabled.day ~ '^[0-6]$'
        AND disabled.day::integer = EXTRACT(DOW FROM v_day)::integer
    );

    SELECT EXISTS (
      SELECT 1
      FROM public.booking_slots slot
      WHERE slot.page_id = p_page_id
        AND slot.block_id = p_block_id
        AND slot.is_available = true
        AND slot.staff_id IS NOT DISTINCT FROM p_staff_id
        AND (
          slot.specific_date = v_day
          OR (slot.specific_date IS NULL AND slot.day_of_week = EXTRACT(DOW FROM v_day)::integer)
        )
    ) INTO v_has_stored;

    IF v_has_stored THEN
      RETURN QUERY
      SELECT
        v_day,
        slot.start_time,
        slot.end_time,
        NOT EXISTS (
          SELECT 1 FROM public.bookings booking
          WHERE booking.page_id = p_page_id
            AND booking.block_id = p_block_id
            AND booking.staff_id IS NOT DISTINCT FROM p_staff_id
            AND booking.status <> 'cancelled'
            AND booking.slot_date = v_day
            AND booking.slot_time = slot.start_time
        )
      FROM public.booking_slots slot
      WHERE slot.page_id = p_page_id
        AND slot.block_id = p_block_id
        AND slot.is_available = true
        AND slot.staff_id IS NOT DISTINCT FROM p_staff_id
        AND (
          slot.specific_date = v_day
          OR (slot.specific_date IS NULL AND slot.day_of_week = EXTRACT(DOW FROM v_day)::integer)
        );
    ELSIF v_has_json THEN
      RETURN QUERY
      SELECT
        v_day,
        (slot->>'startTime')::time,
        NULLIF(slot->>'endTime', '')::time,
        NOT EXISTS (
          SELECT 1 FROM public.bookings booking
          WHERE booking.page_id = p_page_id
            AND booking.block_id = p_block_id
            AND booking.staff_id IS NOT DISTINCT FROM p_staff_id
            AND booking.status <> 'cancelled'
            AND booking.slot_date = v_day
            AND booking.slot_time = (slot->>'startTime')::time
        )
      FROM jsonb_array_elements(v_content->'slots') slot
      WHERE slot->>'startTime' ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
        AND (
          slot->>'endTime' IS NULL
          OR slot->>'endTime' = ''
          OR slot->>'endTime' ~ '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$'
        );
    ELSIF v_end_hour > v_start_hour THEN
      v_minute := v_start_hour * 60;
      WHILE v_minute + v_duration <= v_end_hour * 60 LOOP
        RETURN QUERY
        SELECT
          v_day,
          (make_interval(mins => v_minute))::time,
          (make_interval(mins => v_minute + v_duration))::time,
          NOT EXISTS (
            SELECT 1 FROM public.bookings booking
            WHERE booking.page_id = p_page_id
              AND booking.block_id = p_block_id
              AND booking.staff_id IS NOT DISTINCT FROM p_staff_id
              AND booking.status <> 'cancelled'
              AND booking.slot_date = v_day
              AND booking.slot_time = (make_interval(mins => v_minute))::time
          );
        v_minute := v_minute + v_duration;
      END LOOP;
    END IF;
  END LOOP;
EXCEPTION
  WHEN invalid_text_representation OR numeric_value_out_of_range THEN
    RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_availability(uuid, text, date, date, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_availability(uuid, text, date, date, uuid)
  TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_public_availability IS
  'Public slot availability: stored booking_slots per date, else inline block content slots[], else workingHours expansion.';
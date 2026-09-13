-- Apply the generated working-hours availability fix after the original
-- booking hardening migration so existing environments receive the change.

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
  block_config AS (
    SELECT
      block.content,
      LEAST(GREATEST(COALESCE((block.content->>'workingHoursStart')::integer, 9), 0), 23) AS start_hour,
      LEAST(GREATEST(COALESCE((block.content->>'workingHoursEnd')::integer, 18), 1), 24) AS end_hour,
      LEAST(GREATEST(COALESCE((block.content->>'slotDuration')::integer, 60), 5), 720) AS duration
    FROM public.blocks block
    JOIN public.pages page ON page.id = block.page_id
    WHERE block.page_id = p_page_id
      AND block.id::text = p_block_id
      AND block.type = 'booking'
      AND page.is_published = true
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
  generated_candidates AS (
    SELECT
      requested.slot_date,
      generated.slot_time::time AS slot_time,
      (generated.slot_time + make_interval(mins => config.duration))::time AS slot_end_time
    FROM requested_dates requested
    CROSS JOIN block_config config
    CROSS JOIN LATERAL generate_series(
      requested.slot_date::timestamp + make_interval(hours => config.start_hour),
      requested.slot_date::timestamp + make_interval(hours => config.end_hour)
        - make_interval(mins => config.duration),
      make_interval(mins => config.duration)
    ) AS generated(slot_time)
    WHERE config.end_hour > config.start_hour
      AND NOT EXISTS (
        SELECT 1
        FROM jsonb_array_elements_text(COALESCE(config.content->'disabledWeekdays', '[]'::jsonb)) disabled(day)
        WHERE disabled.day ~ '^[0-6]$'
          AND disabled.day::integer = EXTRACT(DOW FROM requested.slot_date)::integer
      )
      AND NOT EXISTS (
        SELECT 1
        FROM stored_candidates stored
        WHERE stored.slot_date = requested.slot_date
      )
  ),
  candidates AS (
    SELECT slot_date, slot_time, slot_end_time FROM stored_candidates
    UNION ALL
    SELECT slot_date, slot_time, slot_end_time FROM generated_candidates
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
  FROM candidates candidate

  UNION ALL

  SELECT
    booking.slot_date,
    booking.slot_time,
    booking.slot_end_time,
    false AS available
  FROM occupied booking
  WHERE NOT EXISTS (
    SELECT 1
    FROM candidates candidate
    WHERE candidate.slot_date = booking.slot_date
      AND candidate.slot_time = booking.slot_time
  )
  ORDER BY 1, 2;
$$;

COMMENT ON FUNCTION public.get_public_availability IS
  'Returns only slot_date, slot_time, slot_end_time and available; raw booking rows remain private.';

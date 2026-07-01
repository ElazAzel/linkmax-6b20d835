
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS followup_sent_at timestamptz;

CREATE OR REPLACE FUNCTION public.auto_complete_past_bookings(p_owner_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_count integer;
BEGIN
  WITH updated AS (
    UPDATE public.bookings
    SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE owner_id = p_owner_id
      AND status = 'confirmed'
      AND slot_date < CURRENT_DATE
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM updated;
  RETURN v_count;
END;
$$;

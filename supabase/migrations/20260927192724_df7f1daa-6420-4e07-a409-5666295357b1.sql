-- 1. Event staff check-in link -------------------------------------------------

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS checkin_token text;

CREATE OR REPLACE FUNCTION public.gen_event_checkin_token()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT replace(replace(replace(encode(gen_random_bytes(24), 'base64'), '/', ''), '+', ''), '=', '');
$$;

UPDATE public.events
SET checkin_token = public.gen_event_checkin_token()
WHERE checkin_token IS NULL;

ALTER TABLE public.events
  ALTER COLUMN checkin_token SET DEFAULT public.gen_event_checkin_token();

ALTER TABLE public.events
  ALTER COLUMN checkin_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS events_checkin_token_key
  ON public.events (checkin_token);

-- Read-only context for a staff member holding the link.
CREATE OR REPLACE FUNCTION public.get_event_checkin_context(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_total integer;
  v_checked integer;
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_token');
  END IF;

  SELECT * INTO v_event
  FROM public.events
  WHERE checkin_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_token');
  END IF;

  SELECT count(*)::int INTO v_total
  FROM public.event_registrations r
  WHERE r.event_id = v_event.id
    AND r.status = 'confirmed';

  SELECT count(*)::int INTO v_checked
  FROM public.event_tickets t
  JOIN public.event_registrations r ON r.id = t.registration_id
  WHERE r.event_id = v_event.id
    AND t.status = 'used';

  RETURN jsonb_build_object(
    'ok', true,
    'event', jsonb_build_object(
      'id', v_event.id,
      'title_i18n_json', v_event.title_i18n_json,
      'start_at', v_event.start_at,
      'timezone', v_event.timezone,
      'location_value', v_event.location_value,
      'status', v_event.status
    ),
    'stats', jsonb_build_object(
      'total', v_total,
      'checkedIn', v_checked
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_event_checkin_context(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_event_checkin_context(text) TO anon, authenticated, service_role;

-- Check in a ticket using the staff link.
CREATE OR REPLACE FUNCTION public.checkin_event_ticket_by_token(
  p_token text,
  p_ticket_code text
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_ticket public.event_tickets%ROWTYPE;
  v_reg public.event_registrations%ROWTYPE;
  v_code text;
  v_checked integer;
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_token');
  END IF;

  v_code := upper(btrim(coalesce(p_ticket_code, '')));
  IF length(v_code) < 4 OR length(v_code) > 64 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_ticket');
  END IF;

  SELECT * INTO v_event
  FROM public.events
  WHERE checkin_token = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'invalid_token');
  END IF;

  SELECT t.* INTO v_ticket
  FROM public.event_tickets t
  JOIN public.event_registrations r ON r.id = t.registration_id
  WHERE upper(t.ticket_code) = v_code
    AND r.event_id = v_event.id
  FOR UPDATE OF t;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'not_found');
  END IF;

  SELECT * INTO v_reg
  FROM public.event_registrations
  WHERE id = v_ticket.registration_id;

  IF v_ticket.status = 'used' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'already_used',
      'attendeeName', v_reg.attendee_name,
      'checkedInAt', v_ticket.checked_in_at
    );
  END IF;

  IF v_ticket.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'cancelled',
      'attendeeName', v_reg.attendee_name
    );
  END IF;

  UPDATE public.event_tickets
  SET status = 'used',
      checked_in_at = now()
  WHERE id = v_ticket.id;

  SELECT count(*)::int INTO v_checked
  FROM public.event_tickets t
  JOIN public.event_registrations r ON r.id = t.registration_id
  WHERE r.event_id = v_event.id
    AND t.status = 'used';

  RETURN jsonb_build_object(
    'ok', true,
    'attendeeName', v_reg.attendee_name,
    'checkedIn', v_checked
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.checkin_event_ticket_by_token(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.checkin_event_ticket_by_token(text, text) TO anon, authenticated, service_role;

-- Owner-only: read or rotate the staff link.
CREATE OR REPLACE FUNCTION public.get_event_checkin_token(p_event_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.checkin_token
  FROM public.events e
  WHERE e.id = p_event_id
    AND e.owner_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_event_checkin_token(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_event_checkin_token(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.rotate_event_checkin_token(p_event_id uuid)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  UPDATE public.events
  SET checkin_token = public.gen_event_checkin_token(),
      updated_at = now()
  WHERE id = p_event_id
    AND owner_id = auth.uid()
  RETURNING checkin_token INTO v_token;

  IF v_token IS NULL THEN
    RAISE EXCEPTION 'not_allowed' USING ERRCODE = '42501';
  END IF;

  RETURN v_token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.rotate_event_checkin_token(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.rotate_event_checkin_token(uuid) TO authenticated, service_role;

-- 2. Admin tier management RPC -------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_set_user_tier(
  p_target_user_id uuid,
  p_tier text,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid_tiers text[] := ARRAY['free', 'starter', 'pro', 'business'];
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  IF p_tier IS NULL OR NOT (p_tier = ANY(v_valid_tiers)) THEN
    RAISE EXCEPTION 'invalid_tier' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = p_target_user_id) THEN
    RAISE EXCEPTION 'user_not_found' USING ERRCODE = '02000';
  END IF;

  UPDATE public.user_profiles
  SET premium_tier = p_tier,
      is_premium = (p_tier IN ('starter', 'pro', 'business')),
      premium_expires_at = CASE WHEN p_tier = 'free' THEN NULL ELSE p_expires_at END,
      updated_at = now()
  WHERE id = p_target_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_tier(uuid, text, timestamptz) FROM public;
GRANT EXECUTE ON FUNCTION public.admin_set_user_tier(uuid, text, timestamptz) TO authenticated, service_role;
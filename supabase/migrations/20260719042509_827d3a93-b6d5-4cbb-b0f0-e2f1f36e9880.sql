
CREATE OR REPLACE FUNCTION public.confirm_free_event_registration(p_registration_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_is_paid boolean;
  v_require_approval boolean;
  v_status text;
  v_event_status text;
  v_page_published boolean;
BEGIN
  SELECT er.event_id, er.status, e.is_paid,
         COALESCE((e.settings_json->>'requireApproval')::boolean, false),
         e.status, p.is_published
    INTO v_event_id, v_status, v_is_paid, v_require_approval, v_event_status, v_page_published
  FROM public.event_registrations er
  JOIN public.events e ON e.id = er.event_id
  JOIN public.pages p ON p.id = er.page_id
  WHERE er.id = p_registration_id;

  IF v_event_id IS NULL THEN
    RETURN 'not_found';
  END IF;
  IF v_status <> 'pending' THEN
    RETURN v_status;
  END IF;
  IF NOT COALESCE(v_page_published, false) OR COALESCE(v_event_status,'') <> 'published' THEN
    RETURN 'unavailable';
  END IF;
  IF v_is_paid OR v_require_approval THEN
    RETURN v_status;
  END IF;

  UPDATE public.event_registrations
     SET status = 'confirmed', updated_at = now()
   WHERE id = p_registration_id;

  RETURN 'confirmed';
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_free_event_registration(uuid) TO anon, authenticated;


CREATE OR REPLACE FUNCTION public.register_for_event(
  p_event_id uuid,
  p_block_id text,
  p_page_id uuid,
  p_attendee_name text,
  p_attendee_email text,
  p_attendee_phone text,
  p_answers jsonb,
  p_utm jsonb
)
RETURNS TABLE(registration_id uuid, ticket_code text, status text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_owner uuid;
  v_is_paid boolean;
  v_require_approval boolean;
  v_reg_id uuid;
  v_status text;
  v_ticket text;
  v_user_id uuid := auth.uid();
BEGIN
  -- Load and validate event + page publish
  SELECT e.* INTO v_event FROM public.events e WHERE e.id = p_event_id;
  IF v_event.id IS NULL THEN
    RAISE EXCEPTION 'event_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.pages p WHERE p.id = p_page_id AND p.is_published = true
  ) THEN
    RAISE EXCEPTION 'page_not_published' USING ERRCODE = 'P0001';
  END IF;

  v_owner := v_event.owner_id;
  v_is_paid := COALESCE(v_event.is_paid, false);
  v_require_approval := COALESCE((v_event.settings_json->>'requireApproval')::boolean, false);

  -- Duplicate email guard
  IF EXISTS (
    SELECT 1 FROM public.event_registrations
    WHERE event_id = p_event_id
      AND lower(attendee_email) = lower(p_attendee_email)
  ) THEN
    RAISE EXCEPTION 'duplicate_registration' USING ERRCODE = '23505';
  END IF;

  v_status := CASE
    WHEN v_is_paid THEN 'pending'
    WHEN v_require_approval THEN 'pending'
    ELSE 'confirmed'
  END;

  INSERT INTO public.event_registrations(
    event_id, block_id, page_id, owner_id, user_id,
    attendee_name, attendee_email, attendee_phone,
    answers_json, status, payment_status, utm_json
  ) VALUES (
    p_event_id, p_block_id, p_page_id, v_owner, v_user_id,
    p_attendee_name, p_attendee_email, p_attendee_phone,
    COALESCE(p_answers, '{}'::jsonb), v_status,
    CASE WHEN v_is_paid THEN 'pending' ELSE 'none' END,
    COALESCE(p_utm, '{}'::jsonb)
  )
  RETURNING id INTO v_reg_id;

  -- Fetch ticket if created by trigger
  SELECT t.ticket_code INTO v_ticket
  FROM public.event_tickets t
  WHERE t.registration_id = v_reg_id
  LIMIT 1;

  RETURN QUERY SELECT v_reg_id, v_ticket, v_status;
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_for_event(uuid, text, uuid, text, text, text, jsonb, jsonb) TO anon, authenticated;

-- MCP: create page RPC (safe user-scoped page creation)
CREATE OR REPLACE FUNCTION public.mcp_create_user_page(
  p_slug text,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL
)
RETURNS TABLE(id uuid, slug text, title text, is_published boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_slug text;
  v_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501';
  END IF;

  v_slug := lower(regexp_replace(COALESCE(NULLIF(p_slug,''), 'page-' || substr(gen_random_uuid()::text, 1, 8)), '[^a-z0-9-]+', '-', 'g'));

  IF EXISTS (SELECT 1 FROM public.pages WHERE slug = v_slug) THEN
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 6);
  END IF;

  INSERT INTO public.pages(user_id, slug, title, description)
  VALUES (v_user, v_slug, COALESCE(p_title, 'My LinkMAX Page'), p_description)
  RETURNING pages.id INTO v_id;

  RETURN QUERY SELECT v_id, v_slug, COALESCE(p_title, 'My LinkMAX Page'), false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mcp_create_user_page(text, text, text) TO authenticated;

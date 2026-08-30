
-- =====================================================================
-- Hardening: hide team invite_code and zone calendar_feed_token
-- from broad SELECT, expose only via SECURITY DEFINER RPCs to owners.
-- =====================================================================

-- ---------- 1. teams.invite_code ----------

-- Revoke direct column SELECT from anon/authenticated roles.
-- service_role keeps full access (used by edge functions and migrations).
REVOKE SELECT (invite_code) ON public.teams FROM anon, authenticated;

-- Grant SELECT only on the safe public columns explicitly to keep
-- existing UI queries working (id, name, slug, etc.).
GRANT SELECT (
  id, owner_id, name, slug, description, avatar_url,
  niche, is_public, created_at, updated_at
) ON public.teams TO anon, authenticated;

-- Secure RPC: only team owner or platform admin can read invite_code.
CREATE OR REPLACE FUNCTION public.get_team_invite_code(p_team_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_owner   uuid;
  v_code    text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT owner_id, invite_code
    INTO v_owner, v_code
    FROM public.teams
   WHERE id = p_team_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'team_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_owner <> v_user_id
     AND NOT public.has_role(v_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_team_invite_code(uuid)
  TO authenticated, service_role;

-- Secure RPC: rotate (or create) team invite_code. Owner/admin only.
CREATE OR REPLACE FUNCTION public.rotate_team_invite_code(p_team_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_owner   uuid;
  v_code    text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  SELECT owner_id INTO v_owner FROM public.teams WHERE id = p_team_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'team_not_found' USING ERRCODE = 'P0002';
  END IF;

  IF v_owner <> v_user_id
     AND NOT public.has_role(v_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  v_code := 'team-' || lower(
    encode(gen_random_bytes(8), 'hex')
  );

  UPDATE public.teams SET invite_code = v_code WHERE id = p_team_id;

  RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rotate_team_invite_code(uuid)
  TO authenticated, service_role;

-- ---------- 2. zones.calendar_feed_token ----------

-- Hide calendar_feed_token from regular row reads. service_role
-- (calendar-feed edge function) keeps access.
REVOKE SELECT (calendar_feed_token) ON public.zones FROM anon, authenticated;

-- Re-grant SELECT on safe zone columns so existing UI queries keep working.
DO $$
DECLARE
  v_cols text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ')
    INTO v_cols
    FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name   = 'zones'
     AND column_name <> 'calendar_feed_token';

  EXECUTE format(
    'GRANT SELECT (%s) ON public.zones TO anon, authenticated',
    v_cols
  );
END $$;

-- Secure RPC: only zone owner or zone admin (or platform admin) can read token.
CREATE OR REPLACE FUNCTION public.get_zone_calendar_feed_token(p_zone_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_token   text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_zone_admin(p_zone_id, v_user_id)
     AND NOT public.has_role(v_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  SELECT calendar_feed_token INTO v_token
    FROM public.zones
   WHERE id = p_zone_id;

  RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_zone_calendar_feed_token(uuid)
  TO authenticated, service_role;

-- Secure RPC: regenerate calendar feed token. Owner/admin only.
CREATE OR REPLACE FUNCTION public.regenerate_zone_calendar_feed_token(p_zone_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_token   text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000';
  END IF;

  IF NOT public.is_zone_admin(p_zone_id, v_user_id)
     AND NOT public.has_role(v_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  v_token := encode(gen_random_bytes(24), 'hex');

  UPDATE public.zones
     SET calendar_feed_token = v_token
   WHERE id = p_zone_id;

  RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.regenerate_zone_calendar_feed_token(uuid)
  TO authenticated, service_role;

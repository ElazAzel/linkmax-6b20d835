
CREATE OR REPLACE FUNCTION public.get_team_by_invite_code(p_code text)
RETURNS TABLE(id uuid, name text, slug text, description text, avatar_url text, niche text, is_public boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.name, t.slug, t.description, t.avatar_url, t.niche, t.is_public
  FROM public.teams t
  JOIN public.team_secrets ts ON ts.team_id = t.id
  WHERE ts.invite_code = p_code;
$$;

CREATE OR REPLACE FUNCTION public.get_zone_calendar_feed_token(p_zone_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
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
    FROM public.zone_secrets
   WHERE zone_id = p_zone_id;

  RETURN v_token;
END;
$$;

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

  v_code := 'team-' || lower(encode(gen_random_bytes(8), 'hex'));

  INSERT INTO public.team_secrets (team_id, invite_code)
  VALUES (p_team_id, v_code)
  ON CONFLICT (team_id) DO UPDATE SET invite_code = EXCLUDED.invite_code, updated_at = now();

  RETURN v_code;
END;
$$;

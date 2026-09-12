
-- 1. teams.invite_code: revoke column-level access, expose via SECURITY DEFINER RPC
REVOKE SELECT (invite_code) ON public.teams FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_team_invite_code(_team_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT invite_code
  FROM public.teams
  WHERE id = _team_id
    AND owner_id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_team_invite_code(uuid) TO authenticated;

-- 2. zones.calendar_feed_token: revoke column-level access, expose via SECURITY DEFINER RPC
REVOKE SELECT (calendar_feed_token) ON public.zones FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_zone_calendar_token(_zone_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT calendar_feed_token
  FROM public.zones
  WHERE id = _zone_id
    AND public.is_zone_admin(_zone_id, auth.uid())
$$;

GRANT EXECUTE ON FUNCTION public.get_zone_calendar_token(uuid) TO authenticated;

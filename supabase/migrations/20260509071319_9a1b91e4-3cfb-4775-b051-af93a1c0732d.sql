
-- TEAMS
REVOKE SELECT (invite_code) ON public.teams FROM anon, authenticated;

DROP FUNCTION IF EXISTS public.get_team_invite_code(uuid);

CREATE FUNCTION public.get_team_invite_code(_team_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.invite_code
  FROM public.teams t
  WHERE t.id = _team_id
    AND (
      t.owner_id = auth.uid()
      OR public.is_team_member(t.id, auth.uid())
    );
$$;

REVOKE EXECUTE ON FUNCTION public.get_team_invite_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_team_invite_code(uuid) TO authenticated;

-- ZONE_INVITES
DROP POLICY IF EXISTS "Zone admins manage invites" ON public.zone_invites;

CREATE POLICY "Zone admins can insert invites"
  ON public.zone_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_zone_admin(zone_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Zone admins can update their invites"
  ON public.zone_invites
  FOR UPDATE
  TO authenticated
  USING (
    public.is_zone_admin(zone_id, auth.uid())
    AND created_by = auth.uid()
  )
  WITH CHECK (
    public.is_zone_admin(zone_id, auth.uid())
    AND created_by = auth.uid()
  );

CREATE POLICY "Zone admins can delete their invites"
  ON public.zone_invites
  FOR DELETE
  TO authenticated
  USING (
    public.is_zone_admin(zone_id, auth.uid())
    AND created_by = auth.uid()
  );

-- BOOKINGS
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;

CREATE POLICY "Anyone can create bookings on published pages"
  ON public.bookings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.pages p
      WHERE p.id = bookings.page_id
        AND p.is_published = true
        AND p.user_id = bookings.owner_id
    )
    AND (
      bookings.user_id IS NULL
      OR bookings.user_id = auth.uid()
    )
  );

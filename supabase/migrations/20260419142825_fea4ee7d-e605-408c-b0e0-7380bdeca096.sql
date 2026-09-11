-- Fix 1: Tighten zone_invites SELECT policy so zone admins only see invites they created
-- (prevents email enumeration by other zone admins)
DROP POLICY IF EXISTS "Zone admins can view invites" ON public.zone_invites;
CREATE POLICY "Zone admins can view invites they created"
  ON public.zone_invites
  FOR SELECT
  TO authenticated
  USING (is_zone_admin(zone_id, auth.uid()) AND created_by = auth.uid());

-- Fix 2: Realtime topic policies must be managed by the project owner because
-- `realtime.messages` is a managed table owned outside the app migration role.
-- Keep this migration limited to application-owned relations during replay.

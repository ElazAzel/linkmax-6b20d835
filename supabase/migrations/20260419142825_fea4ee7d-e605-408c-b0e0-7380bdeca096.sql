-- Fix 1: Tighten zone_invites SELECT policy so zone admins only see invites they created
-- (prevents email enumeration by other zone admins)
DROP POLICY IF EXISTS "Zone admins can view invites" ON public.zone_invites;
CREATE POLICY "Zone admins can view invites they created"
  ON public.zone_invites
  FOR SELECT
  TO authenticated
  USING (is_zone_admin(zone_id, auth.uid()) AND created_by = auth.uid());

-- Realtime topic policies are managed by Supabase. The project role cannot
-- alter realtime.messages, so this historical migration intentionally leaves
-- the managed table unchanged.

-- Fix 1: Tighten zone_invites SELECT policy so zone admins only see invites they created
-- (prevents email enumeration by other zone admins)
DROP POLICY IF EXISTS "Zone admins can view invites" ON public.zone_invites;
CREATE POLICY "Zone admins can view invites they created"
  ON public.zone_invites
  FOR SELECT
  TO authenticated
  USING (is_zone_admin(zone_id, auth.uid()) AND created_by = auth.uid());

-- Fix 2: Add RLS policies on realtime.messages so users can only subscribe to
-- channels for zones they belong to.
-- The realtime topic convention used by the app is 'zone:<zone_id>:...'.
-- We allow subscriptions when the topic begins with 'zone:<zone_id>' and the
-- authenticated user is an active member of that zone.

ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Zone members can subscribe to zone realtime topics" ON realtime.messages;
CREATE POLICY "Zone members can subscribe to zone realtime topics"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if the topic matches a zone the user is a member of
    EXISTS (
      SELECT 1
      FROM public.zone_members zm
      WHERE zm.user_id = auth.uid()
        AND zm.status = 'active'
        AND (
          realtime.topic() = 'zone:' || zm.zone_id::text
          OR realtime.topic() LIKE 'zone:' || zm.zone_id::text || ':%'
        )
    )
    -- Also allow non-zone topics (general realtime, e.g. user-scoped channels)
    OR realtime.topic() NOT LIKE 'zone:%'
  );

DROP POLICY IF EXISTS "Zone members can broadcast to zone realtime topics" ON realtime.messages;
CREATE POLICY "Zone members can broadcast to zone realtime topics"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.zone_members zm
      WHERE zm.user_id = auth.uid()
        AND zm.status = 'active'
        AND (
          realtime.topic() = 'zone:' || zm.zone_id::text
          OR realtime.topic() LIKE 'zone:' || zm.zone_id::text || ':%'
        )
    )
    OR realtime.topic() NOT LIKE 'zone:%'
  );
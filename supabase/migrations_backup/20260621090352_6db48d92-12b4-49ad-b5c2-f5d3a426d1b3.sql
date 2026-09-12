-- Drop any permissive / broken realtime.messages policies
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'realtime' AND tablename = 'messages'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON realtime.messages', pol.policyname);
  END LOOP;
END $$;

-- Strict SELECT: only zone members can subscribe to their zone's topic.
CREATE POLICY "zone_members_select_zone_topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'zone:%'
  AND public.is_zone_member(
    (substring(realtime.topic() FROM 'zone:([0-9a-f-]{36})'))::uuid,
    auth.uid()
  )
);

-- Strict INSERT (broadcast): only zone members can publish to their zone's topic.
CREATE POLICY "zone_members_insert_zone_topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'zone:%'
  AND public.is_zone_member(
    (substring(realtime.topic() FROM 'zone:([0-9a-f-]{36})'))::uuid,
    auth.uid()
  )
);
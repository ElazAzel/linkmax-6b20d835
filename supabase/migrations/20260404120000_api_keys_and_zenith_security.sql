-- Phase 40: Platform Zenith & Security Hardening

-- 1. Restrict bookings INSERT policy to authenticated users to prevent PII abuse
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Authenticated users can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM pages 
    WHERE pages.id = page_id 
    AND pages.is_published = true
  )
);

-- 2. Define the topic-check helper for environments where Realtime policies
-- are managed by the project owner. The managed `realtime.messages` table is
-- not owned by the application migration role, so its RLS cannot be changed
-- during a local or hosted migration replay.
CREATE OR REPLACE FUNCTION public.check_realtime_topic_access(topic text)
RETURNS boolean AS $$
DECLARE
    extracted_zone_id uuid;
BEGIN
    IF topic LIKE 'zone-messages-%' THEN
        BEGIN
            extracted_zone_id := substr(topic, 15)::uuid;
            RETURN public.is_zone_member(extracted_zone_id, auth.uid());
        EXCEPTION WHEN OTHERS THEN
            RETURN false;
        END;
    END IF;
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Prepare api_keys table for Developer Portal
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hint VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own api keys" ON public.api_keys;
CREATE POLICY "Users view own api keys" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
-- Insert and updates will be managed via service_role to maintain security boundaries

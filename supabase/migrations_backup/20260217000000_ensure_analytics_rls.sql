-- Fix/Ensure RLS policy for analytics table allows public insert
-- This resolves 401 Unauthorized errors for anonymous visitors tracking events

-- 1. Drop existing policy to ensure clean state
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;

-- 2. Re-create policy allowing insert for any role (anon + authenticated)
CREATE POLICY "Anyone can insert analytics"
  ON public.analytics
  FOR INSERT
  TO public
  WITH CHECK (true);

-- 3. Ensure RLS is enabled (just in case)
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

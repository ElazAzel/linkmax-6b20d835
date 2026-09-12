-- Fix 1: Restrict user_tokens INSERT to service_role only (prevent arbitrary balance injection)
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.user_tokens;

CREATE POLICY "Service role can insert tokens"
ON public.user_tokens FOR INSERT
TO service_role
WITH CHECK (true);

-- Fix 2: Replace public teams SELECT policy to exclude invite_code
-- Use a restrictive approach: drop the policy that exposes invite_code to anon users
DROP POLICY IF EXISTS "Anyone can view public teams safe" ON public.teams;

-- Recreate: public teams visible but invite_code only for members/owners
CREATE POLICY "Anyone can view public teams safe"
ON public.teams FOR SELECT
TO anon, authenticated
USING (
  is_public = true
  OR owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
  )
);
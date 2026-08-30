-- Allow authenticated users to search for other users' public profiles
CREATE POLICY "Users can search other profiles"
ON public.user_profiles
FOR SELECT
USING (true);

-- Drop the restrictive old policy (we'll keep insert/update restricted)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
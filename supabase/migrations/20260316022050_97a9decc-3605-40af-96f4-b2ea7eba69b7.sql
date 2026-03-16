
-- 1. user_profiles: Add WITH CHECK to prevent updating sensitive columns
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND is_premium IS NOT DISTINCT FROM (SELECT up.is_premium FROM public.user_profiles up WHERE up.id = auth.uid())
    AND premium_tier IS NOT DISTINCT FROM (SELECT up.premium_tier FROM public.user_profiles up WHERE up.id = auth.uid())
    AND premium_expires_at IS NOT DISTINCT FROM (SELECT up.premium_expires_at FROM public.user_profiles up WHERE up.id = auth.uid())
    AND is_verified IS NOT DISTINCT FROM (SELECT up.is_verified FROM public.user_profiles up WHERE up.id = auth.uid())
    AND verification_status IS NOT DISTINCT FROM (SELECT up.verification_status FROM public.user_profiles up WHERE up.id = auth.uid())
    AND trial_ends_at IS NOT DISTINCT FROM (SELECT up.trial_ends_at FROM public.user_profiles up WHERE up.id = auth.uid())
  );

-- 2. challenge_progress: Remove direct UPDATE policy, keep only SELECT/INSERT
DROP POLICY IF EXISTS "Users can update own progress" ON public.challenge_progress;

-- 3. user_achievements: Remove direct INSERT policy
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;

-- 4. daily_quests_completed: Remove direct INSERT policy
DROP POLICY IF EXISTS "Users can insert own quests" ON public.daily_quests_completed;


-- 1. challenge_progress: tighten INSERT to prevent claiming reward on insert
DROP POLICY IF EXISTS "Users can insert own progress" ON public.challenge_progress;
CREATE POLICY "Users can insert own progress"
ON public.challenge_progress
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND current_count = 0
  AND is_completed = false
  AND reward_claimed = false
  AND completed_at IS NULL
);

-- 2. daily_token_limits: remove client INSERT; only service_role can insert
DROP POLICY IF EXISTS "Users can insert their own limits" ON public.daily_token_limits;
-- (service_role bypasses RLS; no INSERT policy for authenticated users)

-- 3. premium_gifts: recipient UPDATE can only toggle is_claimed/claimed_at
DROP POLICY IF EXISTS "Recipients can update to claim" ON public.premium_gifts;
CREATE POLICY "Recipients can update to claim"
ON public.premium_gifts
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (
  auth.uid() = recipient_id
  AND recipient_id = (SELECT pg.recipient_id FROM public.premium_gifts pg WHERE pg.id = premium_gifts.id)
  AND sender_id     = (SELECT pg.sender_id     FROM public.premium_gifts pg WHERE pg.id = premium_gifts.id)
  AND days_gifted   = (SELECT pg.days_gifted   FROM public.premium_gifts pg WHERE pg.id = premium_gifts.id)
  AND message IS NOT DISTINCT FROM (SELECT pg.message FROM public.premium_gifts pg WHERE pg.id = premium_gifts.id)
);

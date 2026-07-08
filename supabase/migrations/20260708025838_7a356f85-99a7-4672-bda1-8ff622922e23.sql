
-- Fix: premium_gifts privilege escalation (days_gifted uncapped + self-gift)
DROP POLICY IF EXISTS "Users can create gifts" ON public.premium_gifts;

CREATE POLICY "Users can create gifts"
ON public.premium_gifts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND recipient_id IS NOT NULL
  AND recipient_id <> sender_id
  AND days_gifted IS NOT NULL
  AND days_gifted > 0
  AND days_gifted <= 30
);

-- Tighten claim policy: recipient can only mark as claimed, not alter days/sender
DROP POLICY IF EXISTS "Recipients can update to claim" ON public.premium_gifts;

CREATE POLICY "Recipients can update to claim"
ON public.premium_gifts
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (
  auth.uid() = recipient_id
  AND recipient_id = recipient_id
);

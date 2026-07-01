-- Add server-side enforcement for premium block creation
-- Only premium users (or users in trial) can create blocks marked as premium

CREATE POLICY "Only premium users can create premium blocks"
ON public.blocks FOR INSERT
WITH CHECK (
  -- Allow non-premium blocks always
  (is_premium IS NULL OR is_premium = false) 
  OR 
  -- For premium blocks, verify user has premium status
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND (
      is_premium = true 
      OR (trial_ends_at IS NOT NULL AND trial_ends_at > now())
    )
  )
);

-- Also add policy for updates to prevent upgrading blocks to premium
CREATE POLICY "Only premium users can update blocks to premium"
ON public.blocks FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM pages 
    WHERE pages.id = blocks.page_id 
    AND pages.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Allow if not changing to premium
  (is_premium IS NULL OR is_premium = false)
  OR
  -- For premium blocks, verify user has premium status
  EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE id = auth.uid() 
    AND (
      is_premium = true 
      OR (trial_ends_at IS NOT NULL AND trial_ends_at > now())
    )
  )
);
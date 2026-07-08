DROP POLICY IF EXISTS "Users can manage blocks on own pages" ON public.blocks;

CREATE POLICY "Users can view own blocks"
ON public.blocks FOR SELECT
USING (EXISTS (SELECT 1 FROM public.pages WHERE pages.id = blocks.page_id AND pages.user_id = auth.uid()));

CREATE POLICY "Users can delete own blocks"
ON public.blocks FOR DELETE
USING (EXISTS (SELECT 1 FROM public.pages WHERE pages.id = blocks.page_id AND pages.user_id = auth.uid()));

CREATE POLICY "Users can insert own blocks"
ON public.blocks FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.pages WHERE pages.id = blocks.page_id AND pages.user_id = auth.uid())
  AND (
    is_premium IS NULL OR is_premium = false OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND (user_profiles.is_premium = true
             OR (user_profiles.trial_ends_at IS NOT NULL AND user_profiles.trial_ends_at > now()))
    )
  )
);

CREATE POLICY "Users can update own blocks"
ON public.blocks FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.pages WHERE pages.id = blocks.page_id AND pages.user_id = auth.uid()))
WITH CHECK (
  EXISTS (SELECT 1 FROM public.pages WHERE pages.id = blocks.page_id AND pages.user_id = auth.uid())
  AND (
    is_premium IS NULL OR is_premium = false OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
        AND (user_profiles.is_premium = true
             OR (user_profiles.trial_ends_at IS NOT NULL AND user_profiles.trial_ends_at > now()))
    )
  )
);
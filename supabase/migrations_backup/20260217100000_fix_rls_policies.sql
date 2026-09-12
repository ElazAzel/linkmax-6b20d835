-- Fix RLS policies for user_tokens and analytics to resolve 401/406 errors

-- 1. User Tokens Security
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own token balance
DROP POLICY IF EXISTS "Users can view own token balance" ON public.user_tokens;
CREATE POLICY "Users can view own token balance"
ON public.user_tokens FOR SELECT
USING (auth.uid() = user_id);

-- 2. Analytics Security
-- Allow page owners to view analytics for their pages
DROP POLICY IF EXISTS "Page owners can view analytics" ON public.analytics;
CREATE POLICY "Page owners can view analytics"
ON public.analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pages
    WHERE pages.id = analytics.page_id
    AND pages.user_id = auth.uid()
  )
);

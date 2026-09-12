-- Fix analytics table RLS - only allow server-side inserts via service role
-- Remove the permissive "Anyone can insert analytics" policy
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics;

-- Create secure policy: only service role (edge functions) can insert analytics
CREATE POLICY "Service role can insert analytics"
ON public.analytics
FOR INSERT
TO service_role
WITH CHECK (true);

-- Users can view their own analytics (for premium dashboard)
CREATE POLICY "Users can view analytics for their pages"
ON public.analytics
FOR SELECT
TO authenticated
USING (
  page_id IN (
    SELECT id FROM public.pages WHERE user_id = auth.uid()
  )
);

-- Fix rate_limits table - ensure only service role can manage
-- Remove any overly permissive policies
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Create explicit service-role-only policy
CREATE POLICY "Service role only can manage rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Explicitly deny public and authenticated access
CREATE POLICY "Deny public access to rate limits"
ON public.rate_limits
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);
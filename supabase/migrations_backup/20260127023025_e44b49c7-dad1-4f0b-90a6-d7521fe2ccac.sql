-- P1 Security Fix: Restrict page_snapshots to published pages only
DROP POLICY IF EXISTS "Anyone can view page snapshots" ON public.page_snapshots;

-- Create secure policy: only snapshots of published pages can be viewed publicly
CREATE POLICY "Anyone can view snapshots of published pages" 
ON public.page_snapshots FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM pages 
    WHERE pages.id = page_snapshots.page_id 
    AND pages.is_published = true
  )
  OR EXISTS (
    SELECT 1 FROM pages 
    WHERE pages.id = page_snapshots.page_id 
    AND pages.user_id = auth.uid()
  )
);

-- P1: Ensure password_reset_tokens and rate_limits are truly service-role only
-- These should deny access via anon/authenticated and only work via service role
-- The current 'true' policy with ALL command is risky - let's make it explicit

DROP POLICY IF EXISTS "Service role only for password_reset_tokens" ON public.password_reset_tokens;
-- No public access at all - only service role can access via bypassing RLS
CREATE POLICY "Deny all public access to password_reset_tokens" 
ON public.password_reset_tokens FOR ALL 
USING (false);

DROP POLICY IF EXISTS "Service role only can manage rate limits" ON public.rate_limits;  
-- Rate limits should only be managed by service role
CREATE POLICY "Deny all public access to rate_limits" 
ON public.rate_limits FOR ALL 
USING (false);
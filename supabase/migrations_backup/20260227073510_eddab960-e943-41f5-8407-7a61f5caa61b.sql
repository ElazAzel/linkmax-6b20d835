
-- ==============================================
-- FIX 1: page_snapshots — restrict to owners only
-- Historical snapshots should NOT be publicly readable
-- ==============================================
DROP POLICY IF EXISTS "Anyone can view snapshots of published pages" ON public.page_snapshots;

CREATE POLICY "Owners can view their page snapshots"
ON public.page_snapshots FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pages
    WHERE pages.id = page_snapshots.page_id
      AND pages.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- ==============================================
-- FIX 2: teams — fix overly permissive invite_code policy
-- "invite_code IS NOT NULL" exposes ALL teams with codes
-- ==============================================
DROP POLICY IF EXISTS "Anyone can view team by invite code" ON public.teams;
-- No replacement needed: teams are already visible via "Anyone can view public teams" 
-- Invite code lookup should happen through a SECURITY DEFINER function

CREATE OR REPLACE FUNCTION public.get_team_by_invite_code(p_code text)
RETURNS TABLE(id uuid, name text, slug text, description text, avatar_url text, niche text, is_public boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT t.id, t.name, t.slug, t.description, t.avatar_url, t.niche, t.is_public
  FROM public.teams t
  WHERE t.invite_code = p_code;
$$;

-- ==============================================
-- FIX 3: analytics — ensure anon users can insert for tracking
-- Current policy is correct but may not apply to anon role
-- ==============================================
DROP POLICY IF EXISTS "Anyone can insert analytics for published pages" ON public.analytics;

CREATE POLICY "Anyone can insert analytics for published pages"
ON public.analytics FOR INSERT
TO anon, authenticated
WITH CHECK (
  page_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.pages
    WHERE pages.id = analytics.page_id
      AND pages.is_published = true
  )
);

-- ==============================================
-- FIX 4: Deduplicate analytics SELECT policies
-- There are 3 duplicate "users can view own analytics" policies
-- ==============================================
DROP POLICY IF EXISTS "Users can view analytics for own pages" ON public.analytics;
DROP POLICY IF EXISTS "Users can view analytics for their pages" ON public.analytics;
-- Keep only "Page owners view their analytics" which already includes admin check


-- Fix SECURITY DEFINER view issue: recreate as SECURITY INVOKER
DROP VIEW IF EXISTS public.public_teams;

CREATE VIEW public.public_teams
WITH (security_invoker = true)
AS
SELECT 
  id, name, slug, description, avatar_url, niche, 
  is_public, owner_id, created_at, updated_at,
  CASE 
    WHEN owner_id = auth.uid() THEN invite_code
    WHEN EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()) THEN invite_code
    ELSE NULL
  END AS invite_code
FROM public.teams;

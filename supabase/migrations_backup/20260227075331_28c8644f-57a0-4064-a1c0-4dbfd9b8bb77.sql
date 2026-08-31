
-- Fix infinite recursion in teams/team_members RLS policies
-- The problem: teams SELECT checks team_members, team_members SELECT checks teams

-- 1. Create helper functions to break the recursion
CREATE OR REPLACE FUNCTION public.is_team_member(p_team_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_team_public(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = p_team_id AND is_public = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_team_owner(p_team_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT owner_id FROM public.teams WHERE id = p_team_id;
$$;

-- 2. Drop recursive policies on teams
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Anyone can view public teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can view all teams" ON public.teams;

-- 3. Recreate teams SELECT policies using helper functions (no cross-table queries)
CREATE POLICY "Anyone can view public teams"
ON public.teams FOR SELECT
USING (is_public = true OR owner_id = auth.uid());

CREATE POLICY "Team members can view their private teams"
ON public.teams FOR SELECT
TO authenticated
USING (public.is_team_member(id, auth.uid()));

CREATE POLICY "Admins can view all teams"
ON public.teams FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Drop recursive policies on team_members
DROP POLICY IF EXISTS "Anyone can view team members of public teams" ON public.team_members;
DROP POLICY IF EXISTS "Admins can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can manage members" ON public.team_members;

-- 5. Recreate team_members policies using helper functions
CREATE POLICY "View team members of accessible teams"
ON public.team_members FOR SELECT
TO authenticated
USING (
  public.is_team_public(team_id)
  OR public.is_team_member(team_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Team owners can manage members"
ON public.team_members FOR ALL
TO authenticated
USING (public.get_team_owner(team_id) = auth.uid())
WITH CHECK (public.get_team_owner(team_id) = auth.uid());

CREATE POLICY "Admins can manage all team members"
ON public.team_members FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

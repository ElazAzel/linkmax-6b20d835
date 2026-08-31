
-- Allow team members to view teams they belong to
CREATE POLICY "Team members can view their teams"
ON public.teams FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
  )
);

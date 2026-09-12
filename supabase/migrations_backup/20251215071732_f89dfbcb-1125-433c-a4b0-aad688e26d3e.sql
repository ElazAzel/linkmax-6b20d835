-- Add invite_code column to teams for invitation links
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS invite_code text UNIQUE DEFAULT NULL;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_teams_invite_code ON public.teams(invite_code);

-- Comment for documentation
COMMENT ON COLUMN public.teams.invite_code IS 'Unique code for team invitation links';

-- Allow anyone to view team by invite_code for joining
CREATE POLICY "Anyone can view team by invite code" 
ON public.teams 
FOR SELECT 
USING (invite_code IS NOT NULL);
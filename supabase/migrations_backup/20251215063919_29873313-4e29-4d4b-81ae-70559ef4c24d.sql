-- Enum for collaboration status
CREATE TYPE public.collab_status AS ENUM ('pending', 'accepted', 'rejected');

-- Collaborations table - for page merging
CREATE TABLE public.collaborations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_page_id uuid NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  target_page_id uuid REFERENCES public.pages(id) ON DELETE SET NULL,
  status collab_status NOT NULL DEFAULT 'pending',
  message text,
  collab_slug text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(requester_id, target_id)
);

-- Teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  slug text UNIQUE NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  niche text DEFAULT 'other',
  is_public boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Team members
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Shoutouts table - recommendations between users
CREATE TABLE public.shoutouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  is_featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

-- Enable RLS
ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shoutouts ENABLE ROW LEVEL SECURITY;

-- Collaborations policies
CREATE POLICY "Users can view own collaborations" ON public.collaborations
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Users can create collaboration requests" ON public.collaborations
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update collaborations they're part of" ON public.collaborations
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Users can delete own collaboration requests" ON public.collaborations
  FOR DELETE USING (auth.uid() = requester_id);

-- Teams policies
CREATE POLICY "Anyone can view public teams" ON public.teams
  FOR SELECT USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update teams" ON public.teams
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete teams" ON public.teams
  FOR DELETE USING (auth.uid() = owner_id);

-- Team members policies
CREATE POLICY "Anyone can view team members of public teams" ON public.team_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND (is_public = true OR owner_id = auth.uid()))
    OR auth.uid() = user_id
  );

CREATE POLICY "Team owners can manage members" ON public.team_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can leave teams" ON public.team_members
  FOR DELETE USING (auth.uid() = user_id);

-- Shoutouts policies
CREATE POLICY "Anyone can view shoutouts" ON public.shoutouts
  FOR SELECT USING (true);

CREATE POLICY "Users can create shoutouts" ON public.shoutouts
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete own shoutouts" ON public.shoutouts
  FOR DELETE USING (auth.uid() = from_user_id);

-- Indexes for performance
CREATE INDEX idx_collaborations_requester ON public.collaborations(requester_id);
CREATE INDEX idx_collaborations_target ON public.collaborations(target_id);
CREATE INDEX idx_collaborations_status ON public.collaborations(status);
CREATE INDEX idx_teams_owner ON public.teams(owner_id);
CREATE INDEX idx_teams_slug ON public.teams(slug);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_shoutouts_from ON public.shoutouts(from_user_id);
CREATE INDEX idx_shoutouts_to ON public.shoutouts(to_user_id);
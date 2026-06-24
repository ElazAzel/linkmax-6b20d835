BEGIN;

-- ============================================================================
-- 005_social_and_collaborations.sql — Social, teams, collaborations, secrets
-- Merged from: 20251215063919, 20251215071127, 20251215071732, 20251215165404,
--              20251215175007, 20260526193227, 20260529071830, 20260604041138,
--              20260612023522, 20260613064712, 20260613064752
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collab_status') THEN
    CREATE TYPE public.collab_status AS ENUM ('pending', 'accepted', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'org_role') THEN
    CREATE TYPE public.org_role AS ENUM ('owner', 'admin', 'editor', 'viewer');
  END IF;
END $$;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- 2a. friendships
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 2b. collaborations
CREATE TABLE IF NOT EXISTS public.collaborations (
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

ALTER TABLE public.collaborations ADD COLUMN IF NOT EXISTS block_settings jsonb DEFAULT '{"requester_blocks": [], "target_blocks": [], "show_all": true}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_collaborations_requester ON public.collaborations(requester_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_target ON public.collaborations(target_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_status ON public.collaborations(status);

ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;

-- 2c. teams
CREATE TABLE IF NOT EXISTS public.teams (
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

CREATE INDEX IF NOT EXISTS idx_teams_owner ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON public.teams(slug);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- 2d. team_members
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 2e. shoutouts
CREATE TABLE IF NOT EXISTS public.shoutouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text,
  is_featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_shoutouts_from ON public.shoutouts(from_user_id);
CREATE INDEX IF NOT EXISTS idx_shoutouts_to ON public.shoutouts(to_user_id);

ALTER TABLE public.shoutouts ENABLE ROW LEVEL SECURITY;

-- 2f. friend_activities
CREATE TABLE IF NOT EXISTS public.friend_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  activity_type text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_friend_activities_user ON public.friend_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friend_activities_type ON public.friend_activities(activity_type);

ALTER TABLE public.friend_activities ENABLE ROW LEVEL SECURITY;

-- 2g. team_secrets
CREATE TABLE IF NOT EXISTS public.team_secrets (
  team_id uuid PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  invite_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.team_secrets FROM anon, authenticated;
GRANT ALL ON public.team_secrets TO service_role;
ALTER TABLE public.team_secrets ENABLE ROW LEVEL SECURITY;

-- 2h. zone_secrets
CREATE TABLE IF NOT EXISTS public.zone_secrets (
  zone_id uuid PRIMARY KEY REFERENCES public.zones(id) ON DELETE CASCADE,
  calendar_feed_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.zone_secrets FROM anon, authenticated;
GRANT ALL ON public.zone_secrets TO service_role;
ALTER TABLE public.zone_secrets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. RLS POLICIES
-- ============================================================================

-- friendships
DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can create friend requests" ON public.friendships;
DROP POLICY IF EXISTS "Users can update friendships they're part of" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their friendships" ON public.friendships;

CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friendships they're part of"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- collaborations
DROP POLICY IF EXISTS "Users can view own collaborations" ON public.collaborations;
DROP POLICY IF EXISTS "Users can create collaboration requests" ON public.collaborations;
DROP POLICY IF EXISTS "Users can update collaborations they're part of" ON public.collaborations;
DROP POLICY IF EXISTS "Users can delete own collaboration requests" ON public.collaborations;

CREATE POLICY "Users can view own collaborations"
  ON public.collaborations FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Users can create collaboration requests"
  ON public.collaborations FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update collaborations they're part of"
  ON public.collaborations FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = target_id);

CREATE POLICY "Users can delete own collaboration requests"
  ON public.collaborations FOR DELETE
  USING (auth.uid() = requester_id);

-- teams
DROP POLICY IF EXISTS "Anyone can view public teams" ON public.teams;
DROP POLICY IF EXISTS "Anyone can view team by invite code" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Owners can update teams" ON public.teams;
DROP POLICY IF EXISTS "Owners can delete teams" ON public.teams;

CREATE POLICY "Anyone can view public teams"
  ON public.teams FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "Users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update teams"
  ON public.teams FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete teams"
  ON public.teams FOR DELETE
  USING (auth.uid() = owner_id);

-- team_members
DROP POLICY IF EXISTS "Anyone can view team members of public teams" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can manage members" ON public.team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON public.team_members;

CREATE POLICY "Anyone can view team members of public teams"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND (is_public = true OR owner_id = auth.uid()))
    OR auth.uid() = user_id
  );

CREATE POLICY "Team owners can manage members"
  ON public.team_members FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.teams WHERE id = team_id AND owner_id = auth.uid())
  );

CREATE POLICY "Users can leave teams"
  ON public.team_members FOR DELETE
  USING (auth.uid() = user_id);

-- shoutouts
DROP POLICY IF EXISTS "Anyone can view shoutouts" ON public.shoutouts;
DROP POLICY IF EXISTS "Users can create shoutouts" ON public.shoutouts;
DROP POLICY IF EXISTS "Users can delete own shoutouts" ON public.shoutouts;

CREATE POLICY "Anyone can view shoutouts"
  ON public.shoutouts FOR SELECT
  USING (true);

CREATE POLICY "Users can create shoutouts"
  ON public.shoutouts FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can delete own shoutouts"
  ON public.shoutouts FOR DELETE
  USING (auth.uid() = from_user_id);

-- friend_activities
DROP POLICY IF EXISTS "Users can view friends activities" ON public.friend_activities;
DROP POLICY IF EXISTS "Users can create own activities" ON public.friend_activities;

CREATE POLICY "Users can view friends activities"
  ON public.friend_activities FOR SELECT
  USING (
    user_id IN (
      SELECT friend_id FROM public.friendships WHERE user_id = auth.uid() AND status = 'accepted'
      UNION
      SELECT user_id FROM public.friendships WHERE friend_id = auth.uid() AND status = 'accepted'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can create own activities"
  ON public.friend_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 4. TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS update_friendships_updated_at ON public.friendships;
CREATE TRIGGER update_friendships_updated_at
  BEFORE UPDATE ON public.friendships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. COLUMN-LEVEL REVOKES FOR SENSITIVE COLUMNS
-- ============================================================================

REVOKE SELECT (invite_code) ON public.teams FROM anon, authenticated;
REVOKE SELECT (calendar_feed_token) ON public.zones FROM anon, authenticated;

GRANT SELECT ON public.zones TO anon, authenticated;
GRANT SELECT ON public.teams TO anon, authenticated;

-- ============================================================================
-- 6. RPCs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_team_invite_code(_team_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_code  text;
BEGIN
  SELECT owner_id INTO v_owner FROM public.teams WHERE id = _team_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'team_not_found'; END IF;
  IF v_owner <> auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT invite_code INTO v_code FROM public.team_secrets WHERE team_id = _team_id;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_zone_calendar_token(_zone_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  IF NOT public.is_zone_admin(_zone_id, auth.uid()) THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT calendar_feed_token INTO v_token FROM public.zone_secrets WHERE zone_id = _zone_id;
  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_team_by_invite_code(p_code text)
RETURNS TABLE(id uuid, name text, slug text, description text, avatar_url text, niche text, is_public boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.id, t.name, t.slug, t.description, t.avatar_url, t.niche, t.is_public
  FROM public.teams t
  JOIN public.team_secrets ts ON ts.team_id = t.id
  WHERE ts.invite_code = p_code;
$$;

CREATE OR REPLACE FUNCTION public.rotate_team_invite_code(p_team_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_owner   uuid;
  v_code    text;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '28000'; END IF;
  SELECT owner_id INTO v_owner FROM public.teams WHERE id = p_team_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'team_not_found' USING ERRCODE = 'P0002'; END IF;
  IF v_owner <> v_user_id AND NOT public.has_role(v_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  v_code := 'team-' || lower(encode(gen_random_bytes(8), 'hex'));
  INSERT INTO public.team_secrets (team_id, invite_code)
  VALUES (p_team_id, v_code)
  ON CONFLICT (team_id) DO UPDATE SET invite_code = EXCLUDED.invite_code, updated_at = now();
  RETURN v_code;
END;
$$;

REVOKE ALL ON FUNCTION public.get_team_invite_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_team_invite_code(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_zone_calendar_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_zone_calendar_token(uuid) TO authenticated;

-- ============================================================================
-- 7. TRIGGERS FOR SECRET AUTO-SEEDING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.tg_init_team_secret()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.team_secrets (team_id, invite_code)
  VALUES (NEW.id, 'team-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  ON CONFLICT (team_id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS init_team_secret ON public.teams;
CREATE TRIGGER init_team_secret AFTER INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.tg_init_team_secret();

CREATE OR REPLACE FUNCTION public.tg_init_zone_secret()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.zone_secrets (zone_id, calendar_feed_token)
  VALUES (NEW.id, encode(gen_random_bytes(24), 'hex'))
  ON CONFLICT (zone_id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS init_zone_secret ON public.zones;
CREATE TRIGGER init_zone_secret AFTER INSERT ON public.zones
FOR EACH ROW EXECUTE FUNCTION public.tg_init_zone_secret();

-- ============================================================================
-- 8. PUBLIC TEAMS VIEW
-- ============================================================================

DROP VIEW IF EXISTS public.public_teams;
CREATE VIEW public.public_teams
WITH (security_invoker = true)
AS
SELECT
  t.id, t.name, t.slug, t.description, t.avatar_url, t.niche, t.is_public,
  t.owner_id, t.created_at, t.updated_at,
  CASE
    WHEN t.owner_id = auth.uid() THEN ts.invite_code
    WHEN EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = t.id AND tm.user_id = auth.uid()) THEN ts.invite_code
    ELSE NULL
  END AS invite_code
FROM public.teams t
LEFT JOIN public.team_secrets ts ON ts.team_id = t.id;

GRANT SELECT ON public.public_teams TO anon, authenticated;

COMMIT;


-- Restore previous table-level SELECT so existing select('*') queries work again.
GRANT SELECT ON public.zones TO anon, authenticated;
GRANT SELECT ON public.teams TO anon, authenticated;

-- ---------- team_secrets ----------
CREATE TABLE IF NOT EXISTS public.team_secrets (
  team_id uuid PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  invite_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.team_secrets (team_id, invite_code)
SELECT id, invite_code FROM public.teams WHERE invite_code IS NOT NULL
ON CONFLICT (team_id) DO NOTHING;

REVOKE ALL ON public.team_secrets FROM anon, authenticated;
GRANT ALL ON public.team_secrets TO service_role;
ALTER TABLE public.team_secrets ENABLE ROW LEVEL SECURITY;

-- ---------- zone_secrets ----------
CREATE TABLE IF NOT EXISTS public.zone_secrets (
  zone_id uuid PRIMARY KEY REFERENCES public.zones(id) ON DELETE CASCADE,
  calendar_feed_token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.zone_secrets (zone_id, calendar_feed_token)
SELECT id, calendar_feed_token FROM public.zones WHERE calendar_feed_token IS NOT NULL
ON CONFLICT (zone_id) DO NOTHING;

REVOKE ALL ON public.zone_secrets FROM anon, authenticated;
GRANT ALL ON public.zone_secrets TO service_role;
ALTER TABLE public.zone_secrets ENABLE ROW LEVEL SECURITY;

-- ---------- Recreate the public_teams view sourcing invite_code from team_secrets ----------
DROP VIEW IF EXISTS public.public_teams;
CREATE VIEW public.public_teams
WITH (security_invoker = true)
AS
SELECT
  t.id,
  t.name,
  t.slug,
  t.description,
  t.avatar_url,
  t.niche,
  t.is_public,
  t.owner_id,
  t.created_at,
  t.updated_at,
  CASE
    WHEN t.owner_id = auth.uid() THEN ts.invite_code
    WHEN EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = t.id AND tm.user_id = auth.uid()
    ) THEN ts.invite_code
    ELSE NULL
  END AS invite_code
FROM public.teams t
LEFT JOIN public.team_secrets ts ON ts.team_id = t.id;

GRANT SELECT ON public.public_teams TO anon, authenticated;

-- ---------- RPCs now read from secrets tables ----------
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

REVOKE ALL ON FUNCTION public.get_team_invite_code(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_team_invite_code(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.get_zone_calendar_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_zone_calendar_token(uuid) TO authenticated;

-- ---------- Triggers to seed the secrets tables on insert ----------
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

-- ---------- Finally drop the sensitive columns from the public tables ----------
ALTER TABLE public.teams DROP COLUMN IF EXISTS invite_code;
ALTER TABLE public.zones DROP COLUMN IF EXISTS calendar_feed_token;


-- Restrict column-level access to sensitive secrets on teams and zones.
-- Previous migration tried REVOKE on columns but the table-level GRANT still
-- gives anon/authenticated access to every column. Switch to column-level
-- grants so anon/authenticated can NEVER read invite_code or calendar_feed_token
-- directly; access remains available via get_team_invite_code / get_zone_calendar_token RPCs.

-- ============== teams ==============
REVOKE SELECT ON public.teams FROM anon, authenticated;

GRANT SELECT (id, name, description, avatar_url, slug, owner_id, niche, is_public, created_at, updated_at)
  ON public.teams TO anon, authenticated;

-- ============== zones ==============
REVOKE SELECT ON public.zones FROM anon, authenticated;

GRANT SELECT (id, name, slug, logo_url, owner_user_id, plan_code, plan_cycle, plan_status, current_period_start, current_period_end, grace_period_end, created_at, updated_at)
  ON public.zones TO anon, authenticated;

-- service_role retains full access (already granted), used by RPCs and edge functions.

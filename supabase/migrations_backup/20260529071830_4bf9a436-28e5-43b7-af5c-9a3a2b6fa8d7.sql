-- Prevent anonymous/authenticated users from reading teams.invite_code directly.
-- Owners/admins still use get_team_invite_code() RPC and public_teams view masks this column.
REVOKE SELECT (invite_code) ON public.teams FROM PUBLIC;
REVOKE SELECT (invite_code) ON public.teams FROM anon;
REVOKE SELECT (invite_code) ON public.teams FROM authenticated;
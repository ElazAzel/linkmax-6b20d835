-- Security hardening: hide teams.invite_code from anon/authenticated; column already has RPC accessors.
REVOKE SELECT (invite_code) ON public.teams FROM anon;
REVOKE SELECT (invite_code) ON public.teams FROM authenticated;

-- Restrict sites.user_id from anonymous reads (data minimization).
REVOKE SELECT (user_id) ON public.sites FROM anon;
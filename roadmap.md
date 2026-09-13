# Roadmap

## Open (blocked: hosted database paused — no credits, resume disabled for the agent)
- [ ] Deploy edge functions `track-analytics-event` and `robokassa` (was returning 404/401).
- [ ] Grant lifetime Pro to admin@lnkmx.my (`afc67c7e-660a-4cbe-ae00-517b752e30d3`): `user_profiles.is_premium=true`, `premium_tier='pro'`, `premium_expires_at=NULL`, active subscription until 2099.
- [ ] Apply migration `admin_set_user_tier` RPC to live DB (SQL ready, retried 2026-09-12, pooler unavailable).
- [ ] Update `.env` with staging Supabase `SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` once user provides them (agent cannot create a Supabase project or mint keys).


## Done
- [x] Created feature flag tables (`feature_flags`, `feature_flag_rules`, `feature_flag_audit_log`) with grants, RLS and seed flags.
- [x] Fixed `upsert_user_page` so saving no longer collides with `pages_slug_key`.
- [x] Fixed `publishPage` to work when a user has multiple pages (was 406).
- [x] Set `verify_jwt = false` for the `robokassa` function (auth validated in code).
- [x] Prepared `admin_set_user_tier` RPC and updated `UserTierManager.tsx` to use it (bypasses the trigger guard after admin check).

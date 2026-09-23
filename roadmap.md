# Roadmap

## Open (blocked: hosted database paused — no credits, resume disabled for the agent)
- [ ] Deploy edge functions `track-analytics-event` and `robokassa` (was returning 404/401).
- [ ] Grant lifetime Pro to admin@lnkmx.my (`afc67c7e-660a-4cbe-ae00-517b752e30d3`): `user_profiles.is_premium=true`, `premium_tier='pro'`, `premium_expires_at=NULL`, active subscription until 2099.
- [ ] Apply migration `admin_set_user_tier` RPC to live DB (SQL ready, retried 2026-09-12, pooler unavailable).
- [ ] Update `.env` with staging Supabase `SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` once user provides them (agent cannot create a Supabase project or mint keys).
- [x] Оптимизация проекта (2026-09-20): аудит показал, что тяжёлые библиотеки (exceljs, jspdf, recharts, zxing) уже изолированы в ленивых чанках. Убран `vendor-react` из manualChunks (правило Runtime Stability — предотвращает race conditions), Turnstile-скрипт капчи переведён с глобальной загрузки на ленивую (~100 kB на каждый заход). Опционально на будущее: трим неиспользуемых ключей в ru.json (428 KB — самый тяжёлый языковой пакет).
- [ ] Apply security migration for findings `analytics_anon_insert_flood` + `template_likes_public_user_ids`: drop anon/authenticated INSERT on `public.analytics` (ingestion only via `track-analytics-event` service-role function), keep `template_likes` SELECT to own rows for authenticated users, revoke anon SELECT, add `get_template_like_count(uuid)` RPC. SQL prepared 2026-09-15, blocked by paused DB.


- [ ] Аудит платформы (запрошено 2026-09-23).

## Done
- [x] Created feature flag tables (`feature_flags`, `feature_flag_rules`, `feature_flag_audit_log`) with grants, RLS and seed flags.
- [x] Fixed `upsert_user_page` so saving no longer collides with `pages_slug_key`.
- [x] Fixed `publishPage` to work when a user has multiple pages (was 406).
- [x] Set `verify_jwt = false` for the `robokassa` function (auth validated in code).
- [x] Prepared `admin_set_user_tier` RPC and updated `UserTierManager.tsx` to use it (bypasses the trigger guard after admin check).

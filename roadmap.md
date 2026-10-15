# Roadmap

## Open
- [x] Deploy edge functions `track-analytics-event` and `robokassa` (was returning 404/401).
- [x] Lifetime Pro for admin@lnkmx.my (`afc67c7e-660a-4cbe-ae00-517b752e30d3`) applied 2026-09-27 (`profiles.is_premium=true`, `premium_tier='pro'`, `premium_expires_at=NULL`).
- [x] `admin_set_user_tier` RPC applied to live DB 2026-09-27 (admin check via `user_roles`, cannot demote self).
- [x] Outcome Home crash fixed 2026-09-27 by disabling flags `outcome_home`, `revenue_core`, `beauty_revenue_kit`, `booking_self_service` (their tables are not in the DB).
- [x] Staff check-in link for events 2026-09-27: `events.checkin_token`, RPCs `get_event_checkin_context` / `checkin_event_ticket_by_token` / `get_event_checkin_token` / `rotate_event_checkin_token`, public route `/events/checkin/:token`, dialog in EventDetailScreen. Verified in browser.
- [x] Niche landings redesign 2026-09-27: NicheLanding.tsx rebuilt (light brand palette, phone mockup, comparison table with Taplink/Linktree, sticky mobile CTA); replaced the dark gradient hero.
- [x] Dashboard declutter 2026-09-27: removed Tokens / Achievements / Friends entries from Account settings (gamification stays out of the main flow).
- [ ] React dev warning `Function components cannot be given refs` comes from preview instrumentation, not app code (no `ref` is passed to providers, no `cloneElement` in `src/`). Dev-only, not present in production builds.
- [ ] Update `.env` with staging Supabase `SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` once user provides them (agent cannot create a Supabase project or mint keys).
- [x] Оптимизация проекта (2026-09-20): аудит показал, что тяжёлые библиотеки (exceljs, jspdf, recharts, zxing) уже изолированы в ленивых чанках. Убран `vendor-react` из manualChunks (правило Runtime Stability — предотвращает race conditions), Turnstile-скрипт капчи переведён с глобальной загрузки на ленивую (~100 kB на каждый заход). Опционально на будущее: трим неиспользуемых ключей в ru.json (428 KB — самый тяжёлый языковой пакет).
- [x] Apply security migration for findings `analytics_anon_insert_flood` + `template_likes_public_user_ids`: drop anon/authenticated INSERT on `public.analytics` (ingestion only via `track-analytics-event` service-role function), keep `template_likes` SELECT to own rows for authenticated users, revoke anon SELECT, add `get_template_like_count(uuid)` RPC. SQL prepared 2026-09-15, blocked by paused DB.


- [x] Аудит платформы (2026-09-23): сайт стабилен; открыто 1 предупреждение (template_likes, миграция готова), 7 справочных правил и уязвимости в инструментах мобильной сборки. Не поставленная задача: обновить @capacitor/cli и @lovable.dev/mcp-js.

- [ ] Защитить функцию повторной отправки в поисковики секретом (нужно обновить плановую задачу в базе — ждёт возобновления базы).

## Done
- [x] Created feature flag tables (`feature_flags`, `feature_flag_rules`, `feature_flag_audit_log`) with grants, RLS and seed flags.
- [x] Fixed `upsert_user_page` so saving no longer collides with `pages_slug_key`.
- [x] Fixed `publishPage` to work when a user has multiple pages (was 406).
- [x] Set `verify_jwt = false` for the `robokassa` function (auth validated in code).
- [x] Prepared `admin_set_user_tier` RPC and updated `UserTierManager.tsx` to use it (bypasses the trigger guard after admin check).

## Micro-Business OS (план 2026-10-07)
- [x] Шаг 1: аудит, docs/CURRENT_ARCHITECTURE, DOMAIN_MODEL, DECISIONS, MIGRATION_PLAN
- [x] Шаг 2a: таблица contacts, склейка по телефону/почте, привязка заявок
- [x] Шаг 2b: привязка записей, регистраций, покупок к клиенту
- [x] Шаг 3: история клиента в карточке заявки
- [ ] Шаг 4: CRM Lite (стадии, заметки, задачи)

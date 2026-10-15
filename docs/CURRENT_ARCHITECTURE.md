# Current Architecture (snapshot 2026-10-07)

- Frontend: React 18, TypeScript, Vite, Tailwind/Radix, TanStack Query, Zustand, i18next (16 locale files, maintained: ru, en, kk, uz).
- Backend: Lovable Cloud (Postgres + RLS, Auth, Storage), 68 edge functions.
- Edge: Cloudflare Worker for bot SSR and sitemap. Mobile: Capacitor (Android/iOS), Telegram Mini App (`src/telegram`).
- MCP server (`src/lib/mcp`, OAuth 2.1, 8 tools) — base for future AI tools.
- Tests: Vitest (unit, ~630), Playwright (e2e), SQL tests in `supabase/tests`.

## Data volume (live)
| Table | Rows |
|---|---|
| pages | 60 |
| blocks | 517 |
| leads | 554 |
| analytics | 24 354 |
| bookings | 3 |
| event_registrations | 2 |
| events | 1 |
| zone_contacts | 1 |
| digital_purchases, orders, offers | 0 |

## Access rules
- `pages`: authenticated has column-level SELECT without webhook secrets; owner reads full row via `get_my_full_page[_by_id]`.
- Wallet credit only via `record_wallet_income` (service_role, idempotent by internal_ref).
- Business Zones guarded by `is_zone_member` / `is_zone_admin`.

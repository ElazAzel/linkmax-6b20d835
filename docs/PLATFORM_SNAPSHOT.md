# LinkMAX Platform Snapshot

**Verified against repository:** 2026-07-25
**Application version:** 3.1.0
**Runtime baseline:** Node.js 22

## Purpose

This is the current technical snapshot for implementation and operations. It summarizes repository facts and active gaps; it is not a product promise or a substitute for runtime monitoring.

## System Shape

| Layer | Current implementation |
|---|---|
| Web client | React 18, TypeScript, Vite 6, Tailwind, Radix UI. |
| Routing | React Router browser router in `src/main.tsx`; public pages, auth, dashboard, business zones, admin, legal, and SEO routes. |
| Client state | TanStack Query, Zustand, React Hook Form, i18next. |
| Backend | Supabase Auth, PostgreSQL, Storage, RLS, migrations, RPCs, and 63 Edge Function directories. |
| Delivery | GitHub Actions, Supabase CLI deployment, Cloudflare Worker deployment. |
| Mobile | Capacitor Android/iOS projects synchronized from the Vite build. |
| Observability | Sentry client integration where configured; Supabase and provider logs for backend delivery. |

## Product Domains Present in the Codebase

- Public link pages and block-based editor.
- Email/password and OAuth authentication through Supabase Auth.
- Dashboard and Business Zone workflows for pages, leads, contacts, tasks, deals, products, events, calendar, invoices, automation, analytics, and settings.
- Booking, events, files, commerce/payment-related flows, teams, smart links, templates, and admin routes.
- Multi-language UI resources and public SEO/SSR support through Cloudflare Worker and Edge Functions.

Presence of a route or module does not guarantee production configuration. Provider credentials, OAuth setup, payment enablement, and deployment secrets remain environment-specific.

## Repository Contracts

| Contract | Location |
|---|---|
| Frontend commands | `package.json` |
| Node version | `.nvmrc` and workflow YAML |
| Browser routes | `src/main.tsx` |
| Database history | `supabase/migrations/` (292 migration files at this snapshot) |
| Edge Functions | `supabase/functions/` |
| CI/CD | `.github/workflows/` |
| Local config | `.env.example`, `vite.config.ts`, `playwright.config.ts` |
| Security operating baseline | `docs/security/SECURITY.md` |

## Current Delivery Health

- CI uses Node 22 throughout after the 2026-07-25 alignment.
- The quality gate includes lint, i18n checks, strict TypeScript, dependency/layer checks, and baselines.
- The configured i18n literal baseline currently needs reconciliation with current UI changes before the quality workflow can be considered green.
- Supabase deployment requires `SUPABASE_ACCESS_TOKEN`; Cloudflare deployment requires `CLOUDFLARE_API_TOKEN`. Missing secrets block their respective workflows.
- Production dependency audit still contains non-critical findings that require major-version upgrade plans; do not claim a clean audit until those migrations are completed and tested.
- Documentation is now split between current operating documents and historical audits. See `docs/DOCUMENTATION_GOVERNANCE.md`.

## Active Risks and Priorities

1. Restore a green CI baseline without weakening quality thresholds.
2. Complete GitHub secret and environment setup for Supabase and Cloudflare deployment.
3. Add durable authorization/RLS test coverage for high-risk workflows.
4. Reduce dependency audit findings with staged upgrades and regression coverage.
5. Continue i18n, lint, and unused-code debt reduction without increasing baselines.
6. Maintain current runbooks and agent skills whenever implementation contracts change.

The ordered execution plan is [POST_AUDIT_EXECUTION_PLAN_2026-07.md](roadmap/POST_AUDIT_EXECUTION_PLAN_2026-07.md).

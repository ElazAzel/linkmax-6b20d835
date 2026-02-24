# FULL PLATFORM AUDIT — February 24, 2026

## Executive Summary

Comprehensive functional audit covering all platform subsystems: registration, editor, builder, analytics, CRM, Telegram bot, i18n, integrations, and public-facing pages. The platform is in a **healthy state** with strong architectural foundations and no critical blockers.

**Platform Health Score: 8.5/10** (down from 9.0 due to test debt and legacy imports)

---

## Phase 1: Technical Verification

### TypeScript
- **Status**: ✅ PASSED
- `npm run typecheck` → **0 errors**

### Build
- **Status**: ✅ PASSED
- `npm run build` → **Success** (2m 31s)
- **Warning**: 4 chunks > 500 kB: `lucide-react` (721 kB), `index` (671 kB), `vendor-export` (1.5 MB), `vendor-sentry` (454 kB)
- **Recommendation**: Tree-shake lucide-react icons; lazy-load export module

### i18n
- **Status**: ✅ PASSED
- `npm run i18n:status` → **4124 keys, 0 missing** for EN/KK/UZ
- Full coverage across RU/EN/KK/UZ

### Unit Tests (Vitest)
- **Status**: ⚠️ 206 passed / 14 failed (8 test files)

| Failed Test | Root Cause | Severity |
|-------------|-----------|----------|
| `Gallery.test.tsx` (2 tests) | Imports `next/link` from legacy `src/components/screens/Gallery.tsx` — not resolved by vitest | Major |
| `useLeads.test.tsx` (1 test) | Mock for `createLead` mutation doesn't return expected data | Minor |
| `PublicPage.test.tsx` (3 tests) | Missing mock for `usePublicPageByDomain` export | Minor |
| `BlocksRendering.test.tsx` (6 tests) | `TurnstileWidget.tsx` accesses `window` in JSDOM after teardown | Minor |
| Vitest worker timeout (2 errors) | Long-running tests on complex component trees | Minor |

### Static Analysis
| Metric | Count | Notes |
|--------|-------|-------|
| `@ts-ignore` | 3 files | `select.tsx`, `geo-schemas.repro.test.ts`, `BlockRenderer.tsx` |
| `@ts-expect-error` | 0 | Good — all migrated |
| `console.log` in src | 5 files | `main.tsx`, `logger.ts`, `config.ts`, `validation.ts`, `PWAUpdatePrompt.tsx` |
| `next/link` legacy imports | 10 files | Shim exists but vitest can't resolve it |

---

## Phase 2: Browser Testing (Dev Server)

### Landing Page (`/`)
| Check | Result |
|-------|--------|
| Page loads | ✅ PASS |
| Title: `lnkmx - мини-сайт и заявки из одной ссылки` | ✅ PASS |
| Meta description present | ✅ PASS |
| Hero section with CTA | ✅ PASS |
| Language switcher (🇷🇺 Русский) | ✅ PASS |
| Pricing section visible (Pro: 3,045 ₸/мес) | ✅ PASS |
| Footer with links | ✅ PASS |
| CTA → navigates to `/auth` | ✅ PASS |
| Cookie consent banner | ✅ PASS |

### Auth Page (`/auth`)
| Check | Result |
|-------|--------|
| Email + Password fields | ✅ PASS |
| Google SSO button | ✅ PASS |
| Apple SSO button | ✅ PASS |
| Login / Signup tabs | ✅ PASS |
| Empty form validation | ✅ PASS (browser native) |
| "Забыли пароль?" link | ✅ PASS |
| Russian localization | ✅ PASS |

### Gallery (`/gallery`)
| Check | Result |
|-------|--------|
| Page loads (55 pages, 120 likes, 2313 views) | ✅ PASS |
| Category filters (Все, Красота, Фитнес, etc.) | ✅ PASS |
| Search bar | ✅ PASS |
| Gallery/Рейтинг tabs | ✅ PASS |

### Pricing (`/pricing`)
| Check | Result |
|-------|--------|
| Plans displayed (Free / Pro) | ✅ PASS |
| Period selector (3/6/12 months) | ✅ PASS |
| Feature list with details | ✅ PASS |

### Dashboard (`/dashboard`)
| Check | Result |
|-------|--------|
| Redirects to `/auth` when unauthenticated | ✅ PASS |

---

## Phase 3: Edge Functions & Integrations Audit

### Telegram Bot (`telegram-bot-webhook`)
- **Status**: ✅ HEALTHY
- Multilingual support: RU/EN/KK
- Commands: `/start`, `/help`, `/language`, `/id`
- Callback queries for inline keyboard
- Warm-up endpoint support
- Language persistence: DB (for linked users) + in-memory (for new users)
- **Finding**: `tempLanguageStore` is in-memory only — resets on cold start (acceptable for ephemeral context)

### Lead Creation (`create-lead`)
- **Status**: ✅ SECURE
- Rate limiting: 15 req/min per IP
- Turnstile CAPTCHA verification
- Input validation: UUID format, email regex, length limits (name: 255, notes: 1000)
- Page owner verification before insert
- Async notification trigger (non-blocking)
- Webhook integration support

### Payments (`robokassa` + `robokassa-webhook`)
- **Status**: ✅ SECURE
- Subscription pricing: 3mo (13,050₸), 6mo (22,185₸), 12mo (36,540₸)
- Token purchase: 1000/5000/10000 with bulk discounts
- MD5 signature generation (Password #1 for init, #2 for webhook)
- Signature verification on webhook
- Proper `OK{InvId}` response format
- **Finding**: `premium_until` field used in webhook but `premium_expires_at` in PLATFORM_SNAPSHOT — verify column name consistency

### Pixel Proxy (`pixel-proxy`)
- **Status**: ✅ PRODUCTION-READY
- Facebook CAPI with PII hashing (SHA-256)
- TikTok Events API with PII hashing
- GA4 Measurement Protocol
- Rate limiting: 100 req/min per IP
- Page integration caching (5-min TTL)
- Event whitelist (10 allowed events)
- Deduplication via event_id
- Fire-and-forget with `Promise.allSettled`

### Lead Notifications (`send-lead-notification`)
- **Status**: ✅ SECURE
- HTML escaping for XSS prevention
- Telegram Markdown notifications
- Resend email with professional HTML template
- Respects user notification preferences
- Graceful degradation (missing API keys don't crash)

---

## Phase 4: Security Assessment

| Area | Status | Notes |
|------|--------|-------|
| RLS policies | ✅ Enabled | All sensitive tables protected |
| Secrets in client code | ✅ Clean | Only `VITE_SUPABASE_*` exposed (anon key) |
| CORS headers | ✅ Present | All Edge Functions have `Access-Control-*` |
| Input validation | ✅ Strong | UUID, email, length checks in `create-lead` |
| CAPTCHA | ✅ Turnstile | Cloudflare Turnstile in form submissions |
| Rate limiting | ✅ Active | Both `create-lead` (DB) and `pixel-proxy` (in-memory) |
| Payment signature | ✅ Verified | Robokassa MD5 with Password #1/#2 |
| XSS prevention | ✅ HTML escaping | `escapeHtml()` in notification emails |

---

## Issues Found (prioritized)

### 🔴 Critical — None

### 🟡 Major (3)
1. **10 files use legacy `next/link` import** — Causes test failures and represents technical debt. Files: `Gallery.tsx`, `Experts.tsx`, `Terms.tsx`, `Privacy.tsx`, `PaymentTerms.tsx`, `NavLink.tsx`, `PublicPageError.tsx`, `CollabsTab.tsx`, `TeamsTab.tsx`
2. **8 test files failing (14 tests)** — Test suite integrity compromised. Primary causes: legacy import resolution, missing mocks, environment teardown issues
3. **Large bundle chunks** — `vendor-export` (1.5 MB), `lucide-react` (721 kB), main `index` (671 kB)

### 🟢 Minor (4)
4. **3 `@ts-ignore` remaining** — In `select.tsx`, `BlockRenderer.tsx`, test file
5. **5 files with `console.log`** — Mostly in infrastructure code (logger, config), acceptable
6. **`premium_until` vs `premium_expires_at`** — Column naming inconsistency between webhook and docs
7. **Email notifications use `onboarding@resend.dev`** — Should use custom domain `@lnkmx.my` for production

---

## Recommendations

1. **[Sprint]** Migrate 10 `next/link` imports to `react-router-dom` `Link`
2. **[Sprint]** Fix 8 failing test files (mock updates, TurnstileWidget env guard)
3. **[Backlog]** Tree-shake `lucide-react` — import individual icons instead of barrel
4. **[Backlog]** Lazy-load `vendor-export` chunk (PDF/Excel) only when user clicks export
5. **[Backlog]** Configure custom email domain in Resend for production notifications
6. **[Backlog]** Verify `premium_until` vs `premium_expires_at` column name consistency

---

*Audited by: Antigravity (Principal Engineer)*
*Date: February 24, 2026*
*Environment: Development (localhost:8080)*
*Tools: TypeScript 5.8, Vite 6.4, Vitest 3.2, Playwright 1.57*

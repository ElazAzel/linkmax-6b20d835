# Security Checklist — lnkmx Platform

## Overview

This document outlines the security measures implemented in the lnkmx platform. Last fully audited: **2026-02-18** (Phases 1–5).

---

## 1. Authentication & Authorization

### ✅ Implemented

- [x] **Email/Password Authentication** via Supabase Auth
- [x] **Google OAuth** with `returnTo` parameter support
- [x] **Apple Sign-In** with `returnTo` parameter support
- [x] **JWT Token Management** with 1-hour expiry, auto-refresh
- [x] **Telegram Verification** for notifications + login
- [x] **Role-Based Access Control (RBAC)** with `app_role` enum (admin/moderator/user)
- [x] **Auth bypass prevention** — `auth.uid()` checks on `claim_daily_token_reward`, `process_marketplace_purchase`, `get_token_analytics`

### 🔐 Security Measures

- JWT tokens stored securely in httpOnly cookies (Supabase default)
- Session refresh handled automatically by Supabase
- OAuth `returnTo` parameter properly forwarded in redirect URLs
- Admin-only functions guarded by `has_role(auth.uid(), 'admin')`

---

## 2. Database Security (Row Level Security)

### ✅ All Tables Have RLS Enabled

| Table | RLS | Policies |
|-------|-----|----------|
| `pages` | ✅ | Users can only access their own pages |
| `blocks` | ✅ | Access through page ownership |
| `user_profiles` | ✅ | Users can view all, update own |
| `leads` | ✅ | Users can only access their own leads |
| `bookings` | ✅ | Owner/customer access only (fixed: overly permissive policy removed) |
| `analytics` | ✅ | Page owner access for viewing |
| `token_transactions` | ✅ | User/seller/buyer access |
| `token_withdrawals` | ✅ | User can only view/create own |
| `collaborations` | ✅ | Requester/target access |
| `verification_requests` | ✅ | User can only view/create own |
| `template_purchases` | ✅ | Buyer/seller access |
| `teams` | ✅ | Owner/member access |
| `languages` | ✅ | Admin management, public read active |
| `rate_limits` | ✅ | Service role access only |

### Double-Booking Prevention

Partial unique index `bookings_no_double_booking` on `(page_id, block_id, slot_date, slot_time) WHERE status != 'cancelled'`. Timezone column added.

---

## 3. API Security

### Rate Limiting

| Endpoint | Limit | Implementation |
|----------|-------|----------------|
| `seo-ssr` | 60 req/min per IP | In-memory (Deno) |
| `pixel-proxy` | 100 req/min per IP | In-memory (Deno) |
| `create-lead` | 15 req/min per IP | DB-backed (`rate_limits` table) |
| AI generation | 5 req/day (free) | Application-level |

### Anti-Spam: Cloudflare Turnstile

- **Frontend**: `TurnstileWidget.tsx` renders invisible CAPTCHA on forms
- **Backend**: `create-lead` verifies token via Cloudflare `siteverify` API
- Graceful degradation if `TURNSTILE_SECRET_KEY` not configured

### Edge Function Security

- All edge functions validate inputs (regex, length limits)
- CORS headers properly configured
- Service role keys used only server-side
- No secrets exposed in client code

---

## 4. Data Protection & GDPR

### ✅ Implemented

- [x] **GDPR Data Export**: `export_user_data(p_user_id)` — returns all user data as JSONB
- [x] **GDPR Data Deletion**: `delete_user_account(p_user_id)` — cascading delete across 15+ tables
- [x] **Cookie Consent**: `CookieConsent.tsx` banner with accept/reject, gating analytics
- [x] **Analytics Consent Gating**: All tracking calls (`trackPageView`, `trackBlockClick`, `trackShare`) require explicit consent
- [x] **PII Hashing**: Pixel proxy hashes emails/phones with SHA-256 before forwarding to FB CAPI / TikTok
- [x] **HTTPS Only** — all traffic encrypted
- [x] **Environment Variables** — secrets in Edge Functions only

### Data Categories

| Category | Storage | Access |
|----------|---------|--------|
| User credentials | Supabase Auth (hashed) | Auth system only |
| Personal info | `user_profiles` | User + Admin |
| Payment info | NOT stored locally | External processors |
| Analytics | `analytics` table | Page owner only (consent gated) |

---

## 5. XSS & Content Security

### ✅ Implemented

- [x] **CSP Headers**: Strict Content Security Policy in `index.html`
- [x] **CustomCodeBlock Sandbox**: `sandbox="allow-scripts"` only (removed `allow-forms`, `allow-popups`, `allow-modals`)
- [x] **DOMPurify**: HTML sanitization on user-generated content
- [x] **Input Validation**: Zod schemas, regex checks, length limits
- [x] **SQL Injection**: Prevented by Supabase parameterized queries

---

## 6. Storage Security

### Supabase Storage Buckets

| Bucket | Public | Policies |
|--------|--------|----------|
| `avatars` | ✅ | Users can upload/update own |
| `documents` | ❌ | User-specific folders |
| `templates` | ✅ | Read all, write own |

---

## 7. Infrastructure Security

### Environment Variables

| Variable | Location | Security |
|----------|----------|----------|
| `VITE_SUPABASE_URL` | Public (.env) | ✅ Safe — publishable |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public (.env) | ✅ Safe — anon key |
| `GEMINI_API_KEY` | Edge Functions | 🔐 Server only |
| `TELEGRAM_BOT_TOKEN` | Edge Functions | 🔐 Server only |
| `TURNSTILE_SECRET_KEY` | Edge Functions | 🔐 Server only |
| `FB_CAPI_ACCESS_TOKEN` | Edge Functions | 🔐 Server only |
| `TT_EVENTS_ACCESS_TOKEN` | Edge Functions | 🔐 Server only |
| `GA4_MP_API_SECRET` | Edge Functions | 🔐 Server only |

### Cold Start Mitigation

`pg_cron` job `warmup-edge-functions` pings `seo-ssr`, `telegram-bot-webhook`, `pixel-proxy` every 4 minutes via `pg_net`.

---

## 8. Compliance

### Legal Requirements (Kazakhstan)

- [x] 14-day refund policy per RK law
- [x] Terms of Service page
- [x] Privacy Policy page
- [x] Payment terms documentation
- [x] Business registration displayed (БИН: 971207300019)

### Data Retention

- User data retained until account deletion (GDPR delete available)
- Analytics data: 2 years
- Logs: 90 days

---

## 9. Monitoring & Observability

- **Sentry**: `logger.ts` sends structured error reports to `VITE_SENTRY_DSN` via `sendBeacon`
- **Supabase Analytics**: DB logs and Edge Function logs
- **pg_cron monitoring**: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10`

---

## 10. Repository Security & IP Protection

### ✅ Implemented
- [x] **Private Repository**: Codebase access restricted to authorized personnel only
- [x] **History Sanitization**: Git history audited and purged of credentials (Feb 2026)
- [x] **Unified Gitignore**: Standardized tracking, strictly excluding secrets

---

## Quick Security Commands

```bash
# Check for exposed secrets
git log --all --full-history -- "*.env"

# Run type checking
npx tsc --noEmit

# Check dependencies
npm audit

# Verify cron jobs
# SQL: SELECT * FROM cron.job;
# SQL: SELECT * FROM cron.job_run_details ORDER BY start_time DESC;
```

---

**Security contact**: admin@lnkmx.my

*Last updated: 2026-02-18*

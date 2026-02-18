# 🔴 DEEP SECURITY & BUSINESS LOGIC AUDIT

**Date**: 2026-02-18  
**Scope**: RLS, RBAC, XSS, Anti-spam, Pixel Proxy, Booking Logic, GDPR, Token Economy, Observability, Rate Limiting, Edge Functions, SEO Live, Analytics, i18n, a11y  
**Auditor**: Antigravity Principal Engineer  
**Previous Audit**: `FULL_PLATFORM_AUDIT_2026_02_18.md` — found surface issues, this audit goes deep into business logic and security

---

## Executive Summary

The platform has decent surface-level security (RLS enabled on 30+ tables, rate limiting on key functions), but **critical gaps exist in business logic, compliance, and operational reliability** that would be fatal for a B2B platform handling client data and financial transactions.

### Severity Distribution

| Severity | Count | Examples |
|----------|-------|---------|
| 🔴 **CRITICAL** | 7 | Token function auth bypass, booking PII leak, no GDPR compliance |
| 🟠 **HIGH** | 8 | No observability, no CSP, XSS via custom code, no CAPTCHA |
| 🟡 **MEDIUM** | 6 | Hreflang in SPA-only, no anti-fraud, no cold-start monitoring |
| 🟢 **OK** | 5 | Leads RLS, admin RBAC DB, referral dedup, rate limits on AI |

---

## 1. RLS / Data Isolation (CRM — «Ров» платформы)

### ✅ Leads — PROPERLY ISOLATED

```sql
-- All CRUD operations scoped to auth.uid() = user_id
CREATE POLICY "Users can view own leads" ON public.leads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own leads" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own leads" ON public.leads FOR DELETE USING (auth.uid() = user_id);
```

> [!NOTE]
> **Verdict**: User A **CANNOT** access User B's leads via direct Supabase API. The `lead_interactions` table is also properly scoped by `user_id`.

### 🔴 Bookings — PII DATA LEAK (migration exists but status unclear)

**Original policy** (in `20251226171027`):
```sql
-- DANGEROUS: Anyone can see ALL booking details for published pages
CREATE POLICY "Anyone can view bookings for public pages"
ON public.bookings FOR SELECT
USING (EXISTS (SELECT 1 FROM pages WHERE pages.id = bookings.page_id AND pages.is_published = true));
```

**Impact**: Any anonymous/authenticated user could query `SELECT client_name, client_phone, client_email FROM bookings` and see ALL client PII for any published page. This is a GDPR violation and reputational killer.

**Fix exists** in `20260216000000_comprehensive_security.sql`:
```sql
DROP POLICY IF EXISTS "Anyone can view bookings for public pages" ON public.bookings;
```

> [!CAUTION]
> **But has this migration been applied to production?** The migration file exists locally, but there's no evidence it was deployed. This MUST be verified immediately.

### ✅ Tokens — PROPERLY ISOLATED (after hardening)

Token functions (`add_linkkon_tokens`, `spend_linkkon_tokens`, `convert_tokens_to_premium`) were hardened in the comprehensive security migration with `auth.uid()` checks.

### 🔴 Token Admin Functions — NO AUTH CHECKS

```sql
-- get_token_analytics: ANY authenticated user can call this and see ALL platform token stats
CREATE OR REPLACE FUNCTION public.get_token_analytics(p_start_date DATE, p_end_date DATE)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER ...
-- NO auth.uid() or has_role() check!

-- claim_daily_token_reward: ANY user can claim rewards for ANY other user
CREATE OR REPLACE FUNCTION public.claim_daily_token_reward(p_user_id UUID, p_action_type TEXT, p_amount NUMERIC)
-- NO auth.uid() check!

-- process_marketplace_purchase: ANY user can initiate purchases on behalf of ANY other user  
CREATE OR REPLACE FUNCTION public.process_marketplace_purchase(p_buyer_id UUID, p_seller_id UUID, ...)
-- NO auth.uid() check!
```

> [!CAUTION]
> **CRITICAL**: These SECURITY DEFINER functions bypass RLS. Without `auth.uid()` validation, they are effectively public APIs that can be exploited by any authenticated user.

---

## 2. Admin RBAC

### ✅ Database Layer — Properly Implemented

```sql
CREATE FUNCTION public.has_role(_user_id uuid, _role app_role) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER ...
```

- `user_roles` table with RLS: only admins can view/manage roles, users can see own role
- Admin RLS policies use `public.has_role(auth.uid(), 'admin')` — correct pattern

### 🟠 Edge Functions — Only 1 of ~27 checks admin role

| Edge Function | Admin Check | Status |
|---|---|---|
| `language-upload` | ✅ `rpc('has_role', ...)` | SECURE |
| `seed-demo-accounts` | ❌ None | **VULNERABLE** |
| All other admin-facing functions | ❌ None | **VULNERABLE** |

> [!WARNING]
> The frontend `useAdminAuth` hook **provides zero security**. Any user with the Supabase URL and anon key can call edge functions directly. All admin-facing edge functions MUST validate `has_role()` on the backend.

---

## 3. Custom Code Block — XSS / Phishing Risks

### Current Implementation

```tsx
<iframe
  src={iframeSrc}  // Blob URL from user-supplied HTML/CSS/JS
  sandbox={
    block.enableInteraction !== false
      ? 'allow-scripts allow-forms allow-popups allow-modals'
      : ''
  }
/>
```

### Analysis

| Attack Vector | Protected? | Details |
|---|---|---|
| localStorage/token theft | ✅ Yes | No `allow-same-origin` — iframe can't access parent's localStorage |
| Phishing forms | ❌ **No** | `allow-forms` + `allow-popups` = can create fake login forms and submit to attacker |
| Redirect to malicious site | ❌ **No** | `allow-popups` allows `window.open()` to any URL |
| Crypto mining / resource abuse | ❌ **No** | `allow-scripts` with no CPU limits |
| Content injection | ❌ **No** | No validation of HTML/JS content at save time |

### 🟠 No Content Security Policy (CSP)

```
grep -r "Content-Security-Policy" src/ → 0 results
```

No CSP headers are set anywhere in the application. This means:
- Inline scripts execute freely
- External resources load from any origin
- No frame-ancestors restriction

---

## 4. Anti-Spam & Abuse

### create-lead: Rate limited, NO CAPTCHA

```typescript
const RATE_LIMIT_REQUESTS = 15; // 15 requests per minute per IP
```

- ✅ IP-based rate limiting (15/min)
- ✅ Input validation (UUID, email format, length limits)
- ✅ Page owner existence verification
- ❌ **No CAPTCHA/challenge** — a bot behind rotating proxies can flood CRM with spam leads
- ❌ **No honeypot field** — simplest anti-bot measure missing

### Token Economy Abuse

| Attack | Protected? | Details |
|---|---|---|
| Self-referral | ✅ | `v_referrer_id = p_referred_user_id` check |
| Double referral | ✅ | `already_referred` check |
| Multi-account farming | ❌ **No** | Create 100 accounts → refer each other → 5000 free tokens |
| Daily quest farming | ⚠️ Partial | `daily_quests_completed` table prevents same-day duplicates, but multi-account bypasses this |
| Daily token claim abuse | ❌ **No** | `claim_daily_token_reward` has no `auth.uid()` check — claim for anyone |

---

## 5. Pixel Proxy / CAPI — ❌ NOT IMPLEMENTED

### Claims vs Reality

| Claimed Feature | Actually Exists? |
|---|---|
| "Proxy pixel events (FB, TikTok) to prevent ad-blockers" | ❌ **No code found** |
| Server-Side Events (CAPI) | ❌ **No code found** |
| `fbq`, `ttq`, `gtag`, `ym()` | ❌ **Zero references in `src/lib/`** |

```
grep -ri "pixel.*proxy\|server.*event\|CAPI\|conversion.*api" src/ → 0 results
grep -ri "fbq\|ttq\|gtag\|metrika\|ym(" src/lib/ → 0 results
```

> [!CAUTION]
> **If you are marketing this to marketers/coaches as having «clean data in bypass of ad-blockers», this is false advertising.** The pixel proxy feature does not exist. Users store pixel IDs in page settings, but there is no server-side event forwarding — pixels load client-side and are fully blocked by ad-blockers.

---

## 6. Booking Logic — Critical Business Flaws

### 🔴 No Double-Booking Prevention

```sql
CREATE TABLE public.bookings (
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  -- NO UNIQUE constraint on (page_id, block_id, slot_date, slot_time)
);
```

**Impact**: Two users can book the same slot simultaneously. No database-level or application-level lock.

### 🔴 No Timezone Support

```sql
slot_date DATE NOT NULL,
slot_time TIME NOT NULL,   -- No timezone!
slot_end_time TIME,        -- No timezone!
```

**Impact**: Client in Astana (UTC+5) books 14:00. Master in Moscow (UTC+3) sees 14:00 instead of 16:00.

### 🟠 Cancellation — No Instant Slot Release

```sql
status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
```

- Status changes to `cancelled`, but there's no trigger to "release" the slot
- The original `bookings` row still exists with the `cancelled` status
- **New bookings don't check for cancelled slots** — they only check if a booking exists at that time

### Missing for Beauty Masters (core segment)

- ❌ No break/buffer time between appointments
- ❌ No recurring availability patterns
- ❌ No calendar sync (Google Calendar, Apple Calendar)
- ❌ No no-show tracking
- ❌ No cancellation policy enforcement (e.g., 24h before)

---

## 7. GDPR / Data Export — ❌ NOT IMPLEMENTED

### Legal Promises vs Code

| Document | Promise | Implementation |
|---|---|---|
| `Terms.tsx` §11.2 | "User may delete the account" | ❌ No `deleteAccount` function exists |
| `Privacy.tsx` §9.3 | "User may delete their account and content" | ❌ No delete cascade beyond FK `ON DELETE CASCADE` |
| Privacy Policy | Implied: right to data export | ❌ No `exportData` function exists |

### What's Missing

1. **Data Export**: No endpoint or UI to download user data as JSON/ZIP
2. **Account Deletion**: No cascade delete function that cleans up:
   - Storage files (avatars, media)
   - Edge function state
   - Rate limit entries
   - Token withdrawal records
   - Telegram bot associations
3. **Cookie Consent**: Zero consent banner/opt-out mechanism
4. **Data Retention Policy**: No automated cleanup of old analytics/logs

> [!CAUTION]
> **Regulatory risk**: Kazakhstan's Personal Data Protection Law (2013, amended 2021) and GDPR (if serving EU users) both require data portability and deletion rights. Non-compliance = fines and legal liability.

---

## 8. Token Economy & Payments

### Security (Hardened)

| Function | Auth Check | Status |
|---|---|---|
| `add_linkkon_tokens` | ✅ `auth.uid() = p_user_id OR admin` | SECURE |
| `spend_linkkon_tokens` | ✅ `auth.uid() = p_user_id` | SECURE |
| `convert_tokens_to_premium` | ✅ `auth.uid() = p_user_id` | SECURE |
| `apply_referral` | ✅ `auth.uid() = p_referred_user_id` | SECURE |
| `get_token_analytics` | ❌ **None** | 🔴 ANY USER CAN SEE ALL STATS |
| `claim_daily_token_reward` | ❌ **None** | 🔴 CLAIM FOR ANY USER |
| `process_marketplace_purchase` | ❌ **None** | 🔴 BUY ON BEHALF OF ANYONE |

### Financial Risks

| Area | Status | Risk |
|---|---|---|
| Real payment gateway (Stripe/Kaspi) | ❌ Not integrated | Cannot monetize |
| Token purchase flow | ❌ Not implemented | Tokens are free only |
| Refund flow | ❌ Not implemented | No way to reverse transactions |
| KYC/AML for withdrawals | ❌ Not implemented | Regulatory risk if tokens = real money |
| Withdrawal limits | ⚠️ Premium-only restriction only | No daily/monthly caps |
| Legal documents for tokens | ❌ No token terms of service | Legal grey area |

---

## 9. Observability — ❌ CONSOLE-ONLY

### Current State

```typescript
// logger.ts — line 68, 81-82
// TODO: Send to Sentry/LogRocket
// Sentry.captureMessage(message, 'warning');
// TODO: Integrate Sentry
// Sentry.captureException(error, { ... });
```

| Capability | Status |
|---|---|
| Error tracking (Sentry) | ❌ TODO comment only |
| Log aggregation (Logflare/Datadog) | ❌ Not integrated |
| Request correlation (trace IDs) | ❌ Not implemented |
| Alerting (PagerDuty/email) | ❌ Not integrated |
| Edge function monitoring | ❌ Only Supabase dashboard (limited) |
| Core flow metrics (signup→publish→view→lead) | ❌ Not tracked server-side |
| Real user monitoring (RUM) | ❌ Not implemented |

> [!WARNING]
> **If seo-ssr fails at 3 AM, nobody knows until users complain.** No alerts, no dashboards, no error tracking. This is unacceptable for a production B2B platform.

---

## 10. Rate Limiting Coverage

### Edge Functions Rate Limit Matrix

| Function | Rate Limit | Auth Required | Risk |
|---|---|---|---|
| `create-lead` | 15/min/IP | ❌ Public | ⚠️ No CAPTCHA |
| `ai-content-generator` | 20/min/IP | ✅ Auth | ✅ OK |
| `translate-content` | 20/min/IP | ✅ Auth | ⚠️ High per-call cost (GPT) |
| `chatbot-stream` | 10/min/IP | ✅ Auth | ✅ OK |
| **`seo-ssr`** | ❌ **NONE** | ❌ Public | 🔴 **DDoS vector** |
| **`telegram-bot-webhook`** | ❌ **NONE** | ❌ Public (Telegram) | 🟠 Telegram floods possible |
| `send-lead-notification` | ❌ None | ✅ Service role | ✅ Internal only |
| `public-experts` | ⚠️ Headers only | ❌ Public | 🟠 DB query per request |
| All other functions | ❌ None | Varies | 🟡 Depends on exposure |

> [!CAUTION]
> **seo-ssr** is a public endpoint that does a database query + HTML generation per request. A bot sending 1000 RPS would exhaust the Supabase database connection pool and crash the entire platform — not just SSR.

---

## 11. Edge Function Reliability

### Cold Start Risk

| Function | Size | External APIs | Cold Start Risk |
|---|---|---|---|
| `seo-ssr` | ~300 lines | Supabase DB | 🟠 Bots get 500 on cold start |
| `telegram-bot-webhook` | ~440 lines | Telegram API, Supabase DB | 🟠 Webhook timeouts → missed messages |
| `ai-content-generator` | ~535 lines | OpenAI, Supabase DB | 🟡 User-facing delay acceptable |

- No keep-alive/warm-up mechanism
- No timeout configuration beyond Supabase defaults
- No retry logic for cold start failures

---

## 12. SEO Live Verification

### What's Implemented (Code Level)

| Feature | Status | Notes |
|---|---|---|
| SSR for bots | ✅ `seo-ssr` edge function | Cloudflare Worker detects User-Agent |
| robots.txt | ✅ In `public/` + Cloudflare | Configured for major crawlers |
| Sitemap | ❌ `sitemap.ts.bak` — disabled | **P0 issue from initial audit** |
| Hreflang tags | ✅ Via SPA JavaScript | `?lang=ru/en/kk` pattern |
| Canonical URLs | ✅ Set in SEO heads | But `?ref=...` params not stripped |
| Schema.org | ✅ `EnhancedSEOHead` | JSON-LD in SPA — **NOT in SSR** |

### 🟠 Hreflang — SPA-Only Problem

```tsx
// EnhancedSEOHead.tsx — this runs in the BROWSER, not SSR
setLinkTag('alternate', `${meta.canonical}?lang=ru`, 'ru');
setLinkTag('alternate', `${meta.canonical}?lang=en`, 'en');
setLinkTag('alternate', `${meta.canonical}?lang=kk`, 'kk');
```

**Problem**: Hreflang tags are injected via JavaScript. Googlebot may not see them if it doesn't execute JS. The `seo-ssr` edge function (which serves to bots) does NOT include hreflang tags in its HTML output.

### 🟡 Canonical URL Duplication Risk

URLs like `/slug`, `/slug/`, `/slug?ref=abc`, `/slug?lang=ru` all potentially index as separate pages. The canonical tag is set, but query parameter handling is inconsistent.

---

## 13. Analytics Accuracy

### Current Deduplication

```tsx
// useAnalyticsTracking.tsx
const sessionKey = `linkmax_viewed_${pageId}`;
const alreadyViewed = sessionStorage.getItem(sessionKey);
```

| Concern | Status |
|---|---|
| Session dedup | ✅ Via `sessionStorage` |
| Cross-tab dedup | ❌ Each tab = new session in some browsers |
| Private/incognito mode | ❌ Every visit = "unique" (sessionStorage cleared) |
| Ad-blocker resilience | ❌ Analytics via Supabase API — blocked if blocker targets it |
| View count fraud | ❌ No IP dedup, no fingerprinting, no rate limit on views |
| Bot view filtering | ❌ No bot detection on analytics endpoints |
| Cookie consent mode | ❌ No consent check before tracking |

> [!WARNING]
> **If leaderboards and boosts are based on view counts, they can be trivially gamed** by opening pages in incognito tabs. No server-side validation of view uniqueness.

---

## 14. i18n — Deeper Than "Files Exist"

### Translation Coverage

| Area | ru | en | kk | Status |
|---|---|---|---|---|
| UI strings | ✅ | ✅ | ⚠️ | kk.json quality uncertain |
| Telegram bot | ✅ | ✅ | ✅ | 3 languages built-in |
| Email notifications | ? | ? | ? | Not verified |
| SSR meta tags | ✅ | ✅ | ✅ | Via page `seo` field |
| Date/number formatting | ❌ | ❌ | ❌ | **No Intl.DateTimeFormat** usage found |
| Currency formatting | ❌ | ❌ | ❌ | Hardcoded "тенге" or raw numbers |
| Legal pages (Terms/Privacy) | English only | ✅ | ❌ | **Localized legal docs required** |

### Missing

- No `Intl.DateTimeFormat` or `Intl.NumberFormat` — dates shown as raw ISO strings in some places
- Token amounts displayed as raw numbers without locale-specific formatting
- Legal documents (Terms, Privacy) exist only in English — problematic for a Kazakh/Russian audience

---

## 15. Accessibility & Cross-Browser

### a11y

- ❌ Dialog accessibility issues (previously partially fixed)
- ❌ No aria-labels on icon-only buttons in block toolbar
- ❌ Color contrast not verified systematically
- ❌ No keyboard navigation testing
- ❌ No screen reader testing

### Cross-Browser Concerns

| Browser | Risk Area | Status |
|---|---|---|
| Safari iOS | Blob URLs in iframe, PWA | 🟠 Not tested |
| Telegram in-app WebView | Limited API, custom UA | 🟠 Not tested |
| Old Android WebView | CSS Grid, ES2020+ | 🟡 Not tested |
| Firefox | Standard compat | 🟢 Likely fine |

---

## Summary Scorecard

| Area | Score | Critical Issues |
|---|---|---|
| 1. RLS / Data Isolation | 7/10 | Booking PII leak (fix exists, deployment unclear) |
| 2. Admin RBAC | 5/10 | Only 1 edge function checks admin role |
| 3. Custom Code XSS | 4/10 | Phishing via forms/popups, no CSP, no content validation |
| 4. Anti-Spam | 5/10 | Rate limits yes, no CAPTCHA, multi-account farming |
| 5. Pixel Proxy / CAPI | 0/10 | **Does not exist** |
| 6. Booking Logic | 2/10 | Double-booking, no timezone, no slot release |
| 7. GDPR Compliance | 1/10 | No export, no delete, no consent banner |
| 8. Token Economy | 4/10 | 3 functions without auth, no KYC, no refunds |
| 9. Observability | 1/10 | Console-only, no Sentry, no alerts |
| 10. Rate Limiting | 6/10 | seo-ssr unprotected, webhook unprotected |
| 11. Edge Reliability | 5/10 | Cold starts cause 500s, no warm-up |
| 12. SEO Verification | 5/10 | SSR works, but sitemap disabled, hreflang SPA-only |
| 13. Analytics Accuracy | 3/10 | No fraud prevention, no consent, adblock-vulnerable |
| 14. i18n Depth | 4/10 | No date/currency formatting, English-only legal docs |
| 15. a11y / Cross-browser | 3/10 | Untested on Safari/Telegram/Android |

### Overall Deep Audit Score: **3.7 / 10**

> [!CAUTION]
> The surface-level audit scored 7.4/10 because it checked feature existence. This deep audit scores 3.7/10 because it checks **correctness, security, and production-readiness**. The gap between "feature exists" and "feature works safely at scale" is enormous.

---

## Priority Fix Order

### 🔴 Week 1 — Stop the Bleeding

1. **Verify security migration deployment** — confirm `20260216000000_comprehensive_security.sql` is applied in production
2. **Add auth checks** to `get_token_analytics`, `claim_daily_token_reward`, `process_marketplace_purchase`
3. **Add rate limiting to seo-ssr** — simple IP-based, 30 req/min
4. **Re-enable sitemap** — rename `sitemap.ts.bak` back to `sitemap.ts`
5. **Add manifest.json** for PWA

### 🟠 Week 2 — Legal & Data Protection

6. **Implement cookie consent banner** with tracking opt-out
7. **Create data export endpoint** (edge function → query all user tables → return JSON)
8. **Create account deletion** cascade function
9. **Add CSP headers** via Cloudflare Worker or meta tag
10. **Add admin role check** to all admin-facing edge functions

### 🟡 Week 3 — Business Logic

11. **Fix double-booking** — add UNIQUE constraint + timezone field
12. **Add CAPTCHA** to create-lead (Cloudflare Turnstile recommended — free)
13. **Integrate Sentry** for error tracking
14. **Implement pixel proxy** or remove the claim from marketing
15. **Add hreflang to SSR output** in seo-ssr edge function

# Future Stack: Libraries, Services & Tools to Integrate

> **Purpose:** Gap analysis of the current tech stack against the roadmap and industry best practices.
> Each section explains **why** the tool is needed, **when** (roadmap alignment), and links to docs.

---

## 🔴 Critical — Needed Now (Q1 2026)

### 1. Sentry — Error Monitoring & Performance

**Gap:** Currently using a custom `logger.ts` (console-based). No crash reports, no performance traces, no alerting.

**Why:** In production, silent errors cause user churn. Sentry catches unhandled exceptions, slow renders, and failed API calls automatically.

| Detail | Value |
|---|---|
| **Install** | `npm i @sentry/react @sentry/vite-plugin` |
| **Docs** | [sentry.io/for/react](https://docs.sentry.io/platforms/javascript/guides/react/) |
| **Vite Plugin** | [sentry.io/vite](https://docs.sentry.io/platforms/javascript/guides/react/sourcemaps/uploading/vite/) |
| **Pricing** | Free tier: 5K errors/month (sufficient for launch) |

**Integration Points:**
- `main.tsx` or app entry — `Sentry.init()` with DSN
- `ErrorBoundary` component wrapping routes
- Sourcemap upload via `@sentry/vite-plugin` in `vite.config.ts`
- Edge Functions: separate `@sentry/deno` integration

---

### 2. Upstash Redis — Global Rate Limiting & Caching

**Gap:** Current rate limiting is in-memory (resets on cold start). No shared state between edge function instances.

**Why:** Prevents abuse of public endpoints (lead forms, chatbot). Also enables caching for SSR responses.

| Detail | Value |
|---|---|
| **Install** | Deno: `import { Redis } from "https://deno.land/x/upstash_redis/mod.ts"` |
| **Rate Limit** | `import { Ratelimit } from "@upstash/ratelimit"` |
| **Docs** | [upstash.com/docs/redis](https://upstash.com/docs/redis/overall/getstarted) |
| **Supabase Guide** | [supabase.com/docs/guides/functions/rate-limiting](https://supabase.com/docs/guides/functions/rate-limiting) |
| **Pricing** | Free: 10K commands/day |

**Integration Points:**
- `create-lead` edge function (15 req/min per IP)
- `chatbot-stream` (3 req/min per user)
- `seo-ssr` response caching (5-min TTL)

---

### 3. Web Vitals — Performance Monitoring

**Gap:** No real-user performance data is collected.

**Why:** Google uses Core Web Vitals (LCP, CLS, INP) as ranking signals. Must measure to improve.

| Detail | Value |
|---|---|
| **Install** | `npm i web-vitals` |
| **Docs** | [web.dev/vitals](https://web.dev/articles/vitals) |
| **npm** | [npmjs.com/package/web-vitals](https://www.npmjs.com/package/web-vitals) |

**Integration:**
```tsx
import { onLCP, onCLS, onINP } from 'web-vitals';
onLCP(metric => trackEvent('web_vital', { name: 'LCP', value: metric.value }));
onCLS(metric => trackEvent('web_vital', { name: 'CLS', value: metric.value }));
onINP(metric => trackEvent('web_vital', { name: 'INP', value: metric.value }));
```

---

## 🟡 High Priority — Q2 2026 (Growth & Mobile)

### 4. Capacitor.js — Native Mobile App Wrapper

**Gap:** PWA only. No App Store / Play Store presence. No push notifications.

**Why:** Per roadmap Q2: "Native App Wrapper: Wrap PWA in Capacitor for Store presence." 90% of target users manage business from phone.

| Detail | Value |
|---|---|
| **Install** | `npm i @capacitor/core @capacitor/cli` |
| **Docs** | [capacitorjs.com/docs](https://capacitorjs.com/docs) |
| **Key Plugins** | `@capacitor/push-notifications`, `@capacitor/camera`, `@capacitor/share` |
| **Why Capacitor** | 100% code reuse with existing Vite+React app (unlike React Native) |

**Key Benefits over React Native:**
- Zero rewrite — wraps existing web app
- Single codebase for Web + iOS + Android
- Native push notifications via Firebase/APNs plugin

---

### 5. Firebase Cloud Messaging (FCM) + APNs — Push Notifications

**Gap:** No native push. Telegram bot is the only notification channel.

**Why:** "New Lead", "New Booking", "Weekly Summary" push notifications increase retention 3x vs email.

| Detail | Value |
|---|---|
| **Docs** | [firebase.google.com/docs/cloud-messaging](https://firebase.google.com/docs/cloud-messaging) |
| **Capacitor Plugin** | [capacitorjs.com/docs/apis/push-notifications](https://capacitorjs.com/docs/apis/push-notifications) |
| **Supabase + FCM** | [supabase.com/docs/guides/functions/push-notifications](https://supabase.com/docs/guides/functions/push-notifications) |

---

### 6. RoboKassa / Kaspi — Payment Processing

**Gap:** Payment flow is "in progress". No actual payment code in `src/`.

**Why:** Core monetization. Competitors (Taplink) have deep local payment integration.

| Detail | Value |
|---|---|
| **RoboKassa** | |
| Official API | [docs.robokassa.ru](https://docs.robokassa.ru/en/) |
| Node.js SDK | [`@dev-aces/robokassa`](https://www.npmjs.com/package/@dev-aces/robokassa) |
| **Kaspi** | |
| Kaspi Pay API | [kaspi.kz/pay](https://pay.kaspi.kz/) (requires merchant agreement) |

**Architecture:**
1. Edge Function generates payment URL with signature
2. User redirected to RoboKassa/Kaspi checkout
3. Webhook callback → Edge Function validates + activates subscription
4. `user_profiles.is_premium` updated

---

### 7. React Email — Email Templates

**Gap:** Edge functions send plain-text emails via Resend. No branded templates.

**Why:** Professional emails increase trust. Booking confirmations, lead notifications, and weekly digests should look polished.

| Detail | Value |
|---|---|
| **Install** | `npm i @react-email/components react-email` |
| **Docs** | [react.email](https://react.email/) |
| **Resend integration** | [resend.com/docs/send-with-react-email](https://resend.com/docs/send-with-react-email) |

**Templates to Create:**
- `BookingConfirmation.tsx`
- `LeadNotification.tsx`
- `WeeklyDigest.tsx`
- `WelcomeEmail.tsx`
- `TrialEndingEmail.tsx`

---

## 🟢 Planned — Q3-Q4 2026 (Ecosystem & Scale)

### 8. Cloudflare for SaaS — Custom Domains

**Gap:** All pages served under `lnkmx.my/{slug}`. No custom domain support.

**Why:** Per roadmap Q3: "Automated SSL provisioning for user-owned domains."

| Detail | Value |
|---|---|
| **Docs** | [developers.cloudflare.com/cloudflare-for-platforms](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/) |
| **API** | [Custom Hostnames API](https://developers.cloudflare.com/api/resources/custom_hostnames/) |

**Flow:**
1. User enters `mypage.com` in Settings
2. Backend calls Cloudflare API to create Custom Hostname
3. User adds CNAME record at their DNS provider
4. Cloudflare auto-provisions SSL
5. `resolve-domain` edge function routes traffic

---

### 9. Zapier / Make — Integration Platform

**Gap:** No external integrations. Leads stay inside lnkmx only.

**Why:** Per roadmap Q3: "Allow leads to flow to external CRMs (HubSpot, AmoCRM)."

| Detail | Value |
|---|---|
| **Zapier** | [platform.zapier.com](https://platform.zapier.com/quickstart/introduction) |
| **Make (Integromat)** | [make.com/en/api-documentation](https://www.make.com/en/api-documentation) |
| **Implementation** | Expose webhooks from Edge Functions that Zapier/Make can subscribe to |

---

### 10. Stripe — International Payments

**Gap:** RoboKassa covers CIS. No international payment option.

**Why:** For white-label / agency mode (Q3) and international expansion.

| Detail | Value |
|---|---|
| **Docs** | [stripe.com/docs](https://stripe.com/docs) |
| **Supabase + Stripe** | [supabase.com/docs/guides/getting-started/tutorials/with-stripe-subscriptions](https://supabase.com/docs/guides/getting-started/tutorials/with-stripe-subscriptions) |
| **React** | [`@stripe/react-stripe-js`](https://www.npmjs.com/package/@stripe/react-stripe-js) |

---

### 11. PostHog or Mixpanel — Product Analytics

**Gap:** Only page-view/click analytics for *visitors*. No product analytics for *creators* (onboarding funnels, feature adoption).

**Why:** Understanding creator behavior is critical for improving retention and conversion to Pro.

| Detail | Value |
|---|---|
| **PostHog** | [posthog.com/docs](https://posthog.com/docs) — Open-source, self-hostable, free tier with 1M events/mo |
| **Mixpanel** | [mixpanel.com/docs](https://docs.mixpanel.com/) |

**Events to Track:**
- `onboarding_step_completed`
- `block_added`, `block_deleted`
- `page_published`
- `lead_viewed`, `lead_status_changed`
- `pro_upgrade_started`, `pro_upgrade_completed`

---

## Summary Matrix

| Tool | Priority | Roadmap | Status | Effort |
|---|---|---|---|---|
| **Sentry** | 🔴 Critical | Now | Not integrated | 2-3 hours |
| **Upstash Redis** | 🔴 Critical | Now | Not integrated | 4-6 hours |
| **Web Vitals** | 🔴 Critical | Now | Not integrated | 1 hour |
| **Capacitor.js** | 🟡 High | Q2 2026 | Not started | 2-3 days |
| **FCM + APNs** | 🟡 High | Q2 2026 | Not started | 1-2 days |
| **RoboKassa** | 🟡 High | Q1-Q2 2026 | In progress | 3-5 days |
| **React Email** | 🟡 High | Q2 2026 | Not started | 2-3 days |
| **Cloudflare SaaS** | 🟢 Planned | Q3 2026 | Not started | 3-5 days |
| **Zapier/Make** | 🟢 Planned | Q3 2026 | Not started | 3-5 days |
| **Stripe** | 🟢 Planned | Q3-Q4 2026 | Not started | 5-7 days |
| **PostHog** | 🟢 Planned | Q2-Q3 2026 | Not started | 4-6 hours |

---

*Last updated: February 19, 2026*

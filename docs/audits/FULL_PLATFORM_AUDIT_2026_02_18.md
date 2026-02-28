# 🔍 Full Platform Audit — lnkmx (LinkMAX)

**Date**: 2026-02-18  
**Auditor**: Antigravity Principal Engineer  
**Scope**: Dashboard, blocks, analytics, AI, SEO/GEO/AEO, auth, social, Telegram, payments, i18n, edge functions, PWA

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Working correctly |
| ⚠️ | Works but needs improvement |
| ❌ | Not working or critical issue |
| 💡 | Opportunity / enhancement idea |

---

## 1. Dashboard & Navigation

| Area | Status | Notes |
|------|--------|-------|
| DashboardV2 routing | ✅ | Proper tab-based navigation with lazy-loaded screens |
| Multi-page support | ✅ | `useMultiPage` handles CRUD, page switching, tier-based limits (free: 1 page, pro: unlimited) |
| Auth guard | ✅ | `useDashboardAuthGuard` redirects unauthenticated users |
| Header / layout | ✅ | Responsive, mobile-first with safe-area support |
| Settings tabs (Page/Account) | ✅ | Proper tab switching between page and account settings |
| Page slug editing | ✅ | Validation (3-30 chars, lowercase, hyphens) |

**Issues:**
- ⚠️ **DashboardClient.tsx** exists alongside `DashboardV2.tsx` — potential dead code, creates confusion about which is the active dashboard
- 💡 Consider consolidating dashboard entry points

---

## 2. Block Editor

| Area | Status | Notes |
|------|--------|-------|
| Block CRUD | ✅ | Add, edit, delete, duplicate blocks |
| Drag & drop | ✅ | `DraggableBlockList` + `useGridDragDrop` |
| BlockEditorShell | ✅ | Unified editor wrapper with consistent UX |
| BlockErrorBoundary | ✅ | Graceful error handling per block |
| Editor undo | ✅ | `useBlockUndo` + `useEditorHistory` |
| Grid layout | ⚠️ | `useGridLayout` exists but unclear if used alongside standard list layout |
| Freemium gating | ✅ | `FreemiumBlockLimit` component + `FreePremiumBlockGate` |

**Issues:**
- ⚠️ **Scroll issue on PC** was identified and fixed in a recent conversation (aca7eb72), but may recur if CSS changes
- ⚠️ Some block editors may not call `BlockEditorShell` consistently (identified in audit 3524e892)

---

## 3. Block Types — Inventory (28 types)

### Free Blocks (11)
| Type | Renderer | Editor | Status |
|------|----------|--------|--------|
| profile | ✅ | ✅ | ✅ Core block |
| link | ✅ | ✅ | ✅ |
| button | ✅ | ✅ | ✅ |
| text | ✅ | ✅ | ✅ |
| separator | ✅ | ✅ | ✅ |
| avatar | ✅ | ✅ | ✅ |
| socials | ✅ | ✅ | ✅ |
| messenger | ✅ | ✅ | ✅ |
| image | ✅ | ✅ | ✅ |
| map | ✅ | ✅ | ✅ |
| faq | ✅ | ✅ | ✅ |

### Premium Blocks (17)
| Type | Renderer | Editor | Status |
|------|----------|--------|--------|
| video | ✅ | ✅ | ✅ |
| carousel | ✅ | ✅ | ✅ |
| custom_code | ✅ | ✅ | ✅ |
| form | ✅ | ✅ | ✅ |
| newsletter | ✅ | ✅ | ✅ |
| testimonial | ✅ | ✅ | ✅ |
| scratch | ✅ | ✅ | ✅ |
| catalog | ✅ | ✅ | ✅ |
| countdown | ✅ | ✅ | ✅ |
| before_after | ✅ | ✅ | ✅ |
| download | ✅ | ✅ | ✅ |
| product | ✅ | ✅ | ✅ |
| pricing | ✅ | ✅ | ✅ |
| shoutout | ✅ | ✅ | ✅ |
| community | ✅ | ✅ | ✅ |
| booking | ✅ | ✅ | ✅ |
| event | ✅ | ✅ | ✅ |

**Assessment:** ✅ All 28 block types have matching renderers and editors. Registry is well-organized with categories (basic, media, interactive, commerce, social, advanced).

**Issues:**
- ⚠️ **Block consistency discrepancy**: `useFreemiumLimits` uses `search` in `FREE_BLOCKS` but it's NOT in `block-registry.ts` — potential crash if user tries to add a "search" block
- ⚠️ Block type lists are defined in **3 different places** (`block-registry.ts`, `useFreemiumLimits.ts`, `block-factory.ts`) — risk of drift

---

## 4. Analytics / Insights

| Area | Status | Notes |
|------|--------|-------|
| Page view tracking | ✅ | Session-deduped via `sessionStorage`, one view per session |
| Block click tracking | ✅ | Tracks block ID, type, title |
| Share tracking | ✅ | Tracks sharing method |
| Visitor fingerprinting | ✅ | Browser-based fingerprint for unique visitors |
| UTM parameter capture | ✅ | Extracts utm_source, utm_medium, utm_campaign, etc. |
| Referrer detection | ✅ | Categorizes Google, Instagram, Facebook, TikTok, Telegram, etc. |
| Device type detection | ✅ | Mobile / tablet / desktop |
| Analytics dashboard | ✅ | `usePageAnalytics` + admin analytics |
| Heatmap data | ⚠️ | `useHeatmapData` + `useHeatmapTracking` exist but frontend visualization unclear |
| Funnel analytics | ⚠️ | `useFunnelAnalytics` hook exists |
| Marketing analytics | ⚠️ | `useMarketingAnalytics` hook exists |
| Admin analytics | ✅ | `useAdminAnalytics` + `useAdminStats` |

**Issues:**
- ⚠️ **Block analytics accuracy** was flagged as problematic in conversation da5a5651 — interactive blocks (Event, Pricing, Catalog) may not track conversions properly
- ⚠️ `sendBeacon` API key issues were identified and fixed (conversation 28b6f340) — ensure beacon still includes correct API key
- 💡 Consider adding conversion funnel visualization

---

## 5. AI Functionality

| Area | Status | Notes |
|------|--------|-------|
| AI Builder Wizard | ✅ | 5-step stepper (info → niche → template → generate → complete) |
| AI Content Generator (edge fn) | ✅ | `ai-content-generator` — rate limited (20 req/min) |
| Magic Title generator | ✅ | Via `useDashboardAI` |
| Sales Copy generator | ✅ | Via `useDashboardAI` |
| SEO generator | ✅ | Via `useDashboardAI` |
| Block normalization | ✅ | Handles socials, countdown, generic blocks from AI |
| AI page generation limits | ✅ | Free: 1/month, Pro: unlimited |
| Onboarding wizard | ✅ | Shows for new users with no blocks, skippable |
| Settings access button | ✅ | Fixed in this session — added to `PageSettingsTab` |
| AI → blocks pipeline | ✅ | `createBlockFromAI` merges AI data with factory defaults |
| Token reward for AI use | ✅ | Awards tokens + triggers quest completion |

**Issues:**
- ⚠️ **Template source**: AI Builder fetches templates from Supabase `templates` table — 404 errors were previously fixed (conversations 705fe02e, b7f7c79b), verify table is populated
- ⚠️ **Chatbot-stream edge function** exists but integration unclear — was it replaced by the AI Builder?
- 💡 AI-generated blocks may not always match the schema perfectly (edge cases in normalization)

---

## 6. SEO / GEO / AEO / AI Search

| Area | Status | Notes |
|------|--------|-------|
| Meta tag generation | ✅ | Auto-generated title, description, OG image, canonical, robots from blocks |
| Schema.org (structured data) | ✅ | WebPage, Person/Organization, FAQ, Event, BreadcrumbList, Service schemas |
| Quality gate | ✅ | Min 2 blocks, min 50 chars, blocked domains, external link limits |
| SEO SSR (edge function) | ✅ | `seo-ssr` renders HTML for bots with full meta/OG tags |
| robots.ts | ✅ | Exists in `src/app/robots.ts` |
| sitemap.ts | ⚠️ | Exists as `sitemap.ts.bak` — **DISABLED** |
| Auto-FAQ generation | ✅ | `src/lib/seo/auto-faq.ts` — generates FAQ from blocks |
| Answer block optimization | ✅ | `src/lib/seo/answer-block.ts` — optimizes for featured snippets |
| Entity linking | ✅ | `src/lib/seo/entity-linking.ts` — links entities for knowledge panels |
| GEO schemas | ✅ | `src/lib/seo/geo-schemas.ts` — local business + location schemas |
| Key facts extraction | ✅ | `src/lib/seo/key-facts.ts` — extracts structured facts |
| Anchors | ✅ | `src/lib/seo/anchors.ts` — page anchors for in-page navigation |
| AI citability | ✅ | `generateSourceContext()` with version hashing and provenance |
| Content hashing | ✅ | `generateContentHash()` for change detection |

**Issues:**
- ❌ **sitemap.ts is DISABLED** (renamed to `.bak`) — this severely hurts SEO indexation
- ⚠️ `generate-sitemap` edge function exists but unclear if active or replacing the disabled Next.js-style sitemap
- ⚠️ **SeoLanding.tsx** page exists but unclear if it's accessible (routing verified in conversation 0f04d43a)
- 💡 GEO schemas are comprehensive — verify they're actually injected in public page HTML via the SSR function

---

## 7. Authentication

| Area | Status | Notes |
|------|--------|-------|
| Email/Password signup | ✅ | Standard Supabase auth with email confirmation |
| Email/Password signin | ✅ | `signInWithPassword` |
| Google OAuth | ✅ | Via `lovable.auth.signInWithOAuth('google')` |
| Apple OAuth | ✅ | Via `lovable.auth.signInWithOAuth('apple')` |
| Auth state management | ✅ | `AuthProvider` context with `onAuthStateChange` listener |
| Token refresh handling | ✅ | Handles `TOKEN_REFRESHED` failure gracefully |
| Password recovery | ✅ | Detects `PASSWORD_RECOVERY` event |
| Auth callback page | ✅ | `src/app/auth/callback/` exists |
| Session persistence | ✅ | LocalStorage with `autoRefreshToken: true` |
| Telegram linking | ✅ | Saves pending chat ID on sign-in via localStorage |
| Admin auth | ✅ | `useAdminAuth` hook for admin panel access |

**Issues:**
- ⚠️ **OAuth redirect_uri** uses `window.location.origin` — works but won't handle custom domains correctly; `returnTo` parameter is accepted but **not used** in Google/Apple sign-in
- ⚠️ **Password reset via Telegram** edge function exists (`telegram-password-reset`) — unclear if Telegram users have a password to reset
- 💡 Consider supporting additional providers (GitHub, Facebook) for developer/creator audience

---

## 8. User Interaction

| Area | Status | Notes |
|------|--------|-------|
| Friends system | ✅ | Send/accept/reject requests, friend list, pending/sent requests |
| User search | ✅ | Search by username/display_name |
| Collaborations | ✅ | Send collab requests, accept/reject with dedicated pages |
| Teams | ✅ | Create, invite by code, join, leave, member management |
| Shoutouts | ✅ | Send/receive/delete, displayed on profile |
| Premium gifts | ✅ | Send premium days to friends with custom message |
| Page boosts | ✅ | Standard/premium/super boost types with time duration |
| Weekly challenges | ✅ | Auto-generated challenges with token rewards |
| Friend activities | ✅ | Activity feed from friends |
| Referral system | ✅ | Code generation, apply codes, bonus days (3 referrals = premium) |
| Leaderboard | ✅ | `useLeaderboard` hook |
| Achievements | ✅ | `useAchievements` + daily quests |

**Issues:**
- ⚠️ **Social notification edge functions** exist (6+ functions for different notification types) but unclear if all are connected to correct triggers
- ⚠️ **Team page** (`TeamPage.tsx`) exists but routing to it unclear
- 💡 The social layer is feature-rich — ensure all features are discoverable in the UI

---

## 9. Telegram Bot

| Area | Status | Notes |
|------|--------|-------|
| Webhook handler | ✅ | `telegram-bot-webhook` — 438 lines, handles commands + inline keyboards |
| Language support | ✅ | 3 languages (ru/en/kk) with persistent preference |
| Commands | ✅ | /start, /help, /language, /id |
| User linking | ✅ | Chat ID linking via `pending_telegram_chat_id` localStorage |
| Telegram validation | ✅ | `validate-telegram` edge function |
| Notifications | ⚠️ | Multiple send-* edge functions exist |

**Issues:**
- ⚠️ **Language preference storage** uses in-memory `tempLanguageStore` for unlinked users — resets on function cold start
- ⚠️ **Telegram bot registration flow**: user starts bot → gets chatId → registers on website → chatId linked. This flow may be fragile if user clears localStorage between steps
- ❌ **No bot commands for page analytics/management** — missed opportunity for engagement
- 💡 Add commands like `/stats` (page views), `/publish` (trigger publish), `/blocks` (block count)

---

## 10. Templates & Marketplace

| Area | Status | Notes |
|------|--------|-------|
| Template system | ✅ | `useTemplates` hook + `AdminTemplateEditor` for admin-created templates |
| Template categories | ✅ | `templateCategories.ts` aligns with niches |
| Page templates (hardcoded) | ✅ | `page-templates.ts` (99KB!) — extensive preset library |
| Widget templates | ✅ | `widget-templates.ts` (60KB) |
| Gallery | ✅ | `Gallery.tsx` + `useGallery` + `useGalleryFilters` |
| Experts page | ✅ | `public-experts` edge function |
| Marketplace purchases | ✅ | Token-based with 4% platform fee |

**Issues:**
- ⚠️ **Massive hardcoded template files** — `page-templates.ts` (99KB) and `widget-templates.ts` (60KB) could be moved to database
- ⚠️ **useTemplates 404** was fixed (conversations 705fe02e, b3cb94b7) but the `templates` table may still be empty
- 💡 Consider template versioning and community submissions

---

## 11. Payments & Monetization

| Area | Status | Notes |
|------|--------|-------|
| Token system | ✅ | Balance, earn, spend, bonus mechanics |
| Token rewards | ✅ | Daily visit (5), add block (3), use AI (10), achievements (10-100) |
| Premium conversion | ✅ | 100 tokens = 1 day premium |
| Marketplace fees | ✅ | 4% platform fee, 1 token = 1 tenge |
| Withdrawals | ✅ | Request/approve/reject/complete flow (premium only) |
| Admin token management | ✅ | Analytics, all transactions, process withdrawals |
| Freemium limits | ✅ | 20+ feature flags (analytics, CRM, scheduler, pixels, chatbot, etc.) |
| Paid pages | ✅ | `isPaid`, `isPrimaryPaid` flags |
| Multi-page limits | ✅ | Free: 1 page, Pro: unlimited |

**Issues:**
- ⚠️ **No real payment gateway** — only token-based economy. No Stripe/PayPal/Kaspi integration for actual money
- ⚠️ **Token-to-tenge rate** (1:1) seems too simple — no mechanism for purchasing tokens with real money
- 💡 Need payment integration for monetization to work in production

---

## 12. PWA & Performance

| Area | Status | Notes |
|------|--------|-------|
| Web Vitals monitoring | ✅ | Initialized in `main.tsx` |
| Performance monitoring | ✅ | `usePerformanceMonitor` hook |
| Install prompt | ✅ | PWA install prompt in `Install.tsx` |
| Haptic feedback | ✅ | `useHapticFeedback` for mobile |
| Pull to refresh | ✅ | `usePullToRefresh` hook |
| Sound effects | ✅ | `useSoundEffects` hook |
| Lazy loading | ✅ | Route-based code splitting in `main.tsx` |

**Issues:**
- ❌ **No manifest.json found** in project root — PWA install will NOT work without it (critical for mobile-first platform)
- ⚠️ **No service worker** found (`sw.js` or `sw.ts`) — offline support missing
- 💡 PWA install page exists but may be non-functional without manifest

---

## 13. i18n / Localization

| Area | Status | Notes |
|------|--------|-------|
| Language support | ✅ | 16 languages supported |
| Core languages | ✅ | Russian (168KB), Kazakh (141KB), English (120KB), Ukrainian (162KB) |
| Extended languages | ✅ | ar, be, de, es, fr, it, ja, ko, pt, tr, uz, zh |
| i18n config | ✅ | `src/i18n/config.ts` |
| Translation validation | ✅ | `src/i18n/validation.ts` (10KB) |
| Multilingual strings | ✅ | `MultilingualString` type + `getI18nText()` helper |
| Language upload | ✅ | `language-upload` edge function |
| Auto-translate | ✅ | `useAutoTranslate` + `translate-content` edge function |
| Admin translations | ✅ | `AdminTranslations.tsx` (42KB) — comprehensive admin panel |

**Issues:**
- ⚠️ **kk.json was previously invalid** (fixed in conversation a35bdaf6) — need to re-verify
- ⚠️ **Extended language files** (~112KB each) may be machine-translated — quality unclear
- ⚠️ **Pricing fragments** exist as separate files (`pricing_en_fragment.json`, `pricing_ru_fragment.json`) — should be merged into main locale files
- 💡 Some locale files are suspiciously similar in size (112KB) — may be duplicated/incomplete translations

---

## 14. Edge Functions (27 total)

| Function | Purpose | Status |
|----------|---------|--------|
| `ai-content-generator` | AI page content generation | ✅ Rate-limited (20/min) |
| `chatbot-stream` | AI chatbot streaming | ⚠️ Integration unclear |
| `create-lead` | Lead capture | ✅ |
| `generate-sitemap` | Dynamic sitemap | ⚠️ May conflict with disabled `sitemap.ts` |
| `google-forms-parser` | Parse Google Forms | ✅ |
| `language-upload` | Upload language files | ✅ |
| `process-crm-automations` | CRM workflow automation | ⚠️ Requires CRM setup |
| `public-experts` | Public experts listing | ✅ |
| `resolve-domain` | Custom domain resolution | ✅ |
| `seed-demo-accounts` | Demo data seeding | ✅ Dev-only |
| `send-attendee-email` | Event attendee notifications | ✅ |
| `send-booking-notification` | Booking confirmations | ✅ |
| `send-booking-reminder` | Booking reminders | ✅ |
| `send-collab-notification` | Collaboration notifications | ✅ |
| `send-event-confirmation` | Event registration confirmation | ✅ |
| `send-friend-notification` | Friend request notifications | ✅ |
| `send-lead-notification` | New lead alerts | ✅ |
| `send-social-notification` | Social activity alerts | ✅ |
| `send-team-notification` | Team activity alerts | ✅ |
| `send-trial-ending-notification` | Trial expiry warnings | ✅ |
| `send-weekly-digest` | Weekly analytics digest | ✅ |
| `send-weekly-motivation` | Motivational messages | ✅ |
| `seo-ssr` | SEO HTML for bots | ✅ |
| `telegram-bot-webhook` | Telegram bot handler | ✅ |
| `telegram-password-reset` | Password reset via Telegram | ⚠️ |
| `translate-content` | AI auto-translation | ✅ |
| `validate-telegram` | Telegram link validation | ✅ |

---

## 🚨 Critical Issues (Immediate Action Required)

| # | Issue | Impact | Priority |
|---|-------|--------|----------|
| 1 | ❌ **No manifest.json** — PWA install non-functional | PWA completely broken | **P0** |
| 2 | ❌ **sitemap.ts disabled** (.bak) — search engines can't discover pages | SEO severely impacted | **P0** |
| 3 | ⚠️ **Block type drift** — `search` in useFreemiumLimits but missing from registry | Potential runtime crash | **P1** |
| 4 | ⚠️ **OAuth returnTo unused** — Google/Apple don't use the `returnTo` param | Deep link return broken after OAuth | **P1** |
| 5 | ⚠️ **No payment gateway** — tokens exist but can't be purchased with real money | Monetization impossible | **P1** |

## ⚠️ Improvements Needed

| # | Area | Issue | Recommendation |
|---|------|-------|----------------|
| 1 | Templates | 99KB + 60KB hardcoded template files | Move to database |
| 2 | Telegram Bot | No stats/management commands | Add /stats, /publish commands |
| 3 | Telegram Bot | In-memory language store for unlinked users | Persist to temp KV or cookie |
| 4 | SEO | Unclear if Schema.org data is injected in SSR | Verify `seo-ssr` function outputs schemas |
| 5 | Analytics | Block conversion tracking inaccurate | Review interactive block analytics hooks |
| 6 | i18n | Extended languages may be low-quality | Manual review of ar, zh, ja, ko translations |
| 7 | Dashboard | DashboardClient.tsx vs DashboardV2.tsx coexistence | Consolidate or remove dead code |
| 8 | Social | Many notification edge functions — unclear triggers | Map each function to its trigger event |
| 9 | Chatbot | chatbot-stream edge function — integration unclear | Verify usage or remove |
| 10 | PWA | No service worker for offline support | Add SW with caching strategy |

## 💡 Enhancement Opportunities

1. **Payment Integration** — Add Kaspi / Stripe for real money transactions
2. **AB Testing** — Leverage multi-page for page variants
3. **Push Notifications** — Web push via service worker
4. **Webhook Integrations** — Zapier/Make.com for power users
5. **Page Scheduling** — Timed publish/unpublish
6. **Blog/Post Block** — Long-form content with SEO
7. **AI Image Generation** — Generate images within blocks
8. **Analytics Export** — PDF/Excel reports (infrastructure exists in `excel-export.ts`, `pdf-export.ts`)
9. **Custom Domain SSL** — Automated certificate management
10. **API Access** — Public API for programmatic page management

---

## Platform Health Score

| Area | Score | Verdict |
|------|-------|---------|
| Dashboard & Navigation | 9/10 | ✅ Excellent |
| Block System | 9/10 | ✅ Comprehensive, well-typed |
| Analytics | 7/10 | ⚠️ Good infra, accuracy concerns |
| AI Functionality | 9/10 | ✅ Feature-rich, well-integrated |
| SEO/GEO/AEO | 7/10 | ⚠️ Excellent code, but sitemap disabled |
| Authentication | 8/10 | ✅ Solid with minor OAuth issues |
| Social Features | 9/10 | ✅ Very comprehensive |
| Telegram Bot | 7/10 | ⚠️ Basic, needs expansion |
| Payments | 5/10 | ⚠️ Token system only, no real payments |
| PWA | 3/10 | ❌ Missing critical files |
| i18n | 8/10 | ✅ Extensive, quality uncertain |
| Edge Functions | 8/10 | ✅ Well-organized |
| **Overall** | **7.4/10** | **⚠️ Strong platform, 2 critical gaps** |

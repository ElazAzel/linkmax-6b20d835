# LinkMAX — The Business OS for the Solo-Economy (Encyclopedia v2026.03)

> **Strategic Vision:** LinkMAX is the **"Anti-Bitrix/AmoCRM"** for solopreneurs. We are a comprehensive **Business Operating System** (Solo OS) that consolidates the fragmented tech stack into a single, mobile-first, AI-native platform with a **"Step-by-Growth"** monetization model.

---

## 1) What LinkMAX is

**Positioning:** The Micro-Business Operating System — Page Builder + Mini-CRM + Analytics + Fintech Foundation.

LinkMAX is a comprehensive SaaS platform designed for the **Solo-Economy (2026)**, where creators operate as independent digital enterprises. It combines:

1. **Page Builder** — AI-powered drag-and-drop constructor with 28+ blocks. Uses the **"Living Canvas"** aesthetic (frosted high-index glass, reactive WebGL backgrounds, and organic micro-animations). Fully localized in 4 languages (RU, EN, KK, UZ).
2. **Mini-CRM** — Real-time lead management, automated Telegram notifications, Custom Fields, and Kanban. Features a global **Cmd+K Command Palette** for deep search across entities, and native **export for Analytics, Leads, and CRM data**.
3. **Advanced Analytics & AEO** — Server-side tracking (Pixel Proxy) to bypass browser restrictions and **AI-optimized Answer Blocks** for generative search (Perplexity, GPT).
4. **Team Collaboration & Business Zones** — RBAC-based organization management using **Secured View Architecture (`public_teams`)** and multi-tenant workspaces with CRM Kanban and Team Inbox.
5. **Fintech Core & Auth** — Telegram Mini App integration with full localization, Telegram Web Login, integrated ledger with Kaspi QR Sandbox, local **PDF Invoice / Acts generation**, and a **"Step-by-Growth"** monetization model (7% / 1% fees).

**Core Value:** Eliminating the "Tool Tax" (high costs and admin fatigue from using multiple разрозненных SaaS) by providing a unified infrastructure in 15 minutes.

### Key Competitive Moats

- **Liquid Glass Aesthetic:** Premium design capital that allows users to charge more for their services.
- **AI-Native Workflow:** Gemini-powered content and layout generation to solve "blank page syndrome".
- **Data-Backed Retention:** High switching costs once customer data (leads/bookings) is stored in the LinkMAX CRM.
- **Privacy-First Analytics:** Server-side proxying (FB CAPI, TikTok) for 2026's cookieless environment.

### Repository Security & Privacy

The codebase is hosted in a **Private** repository to protect intellectual property and business logic. Access is restricted to authorized team members and IPA BEEGIN representatives. Git history is periodically audited and sanitized of sensitive credentials. See [ADR 0024: Repository Security and Privacy](../../ADR/0024-repository-security.md) for details on recent security hardening.
The database layer is further hardened with **Trigger Guards** (ADR 0027) preventing unauthorized mutation of system-critical columns in `user_profiles` and `challenge_progress`.

**Target audiences:**

- Experts and consultants showcasing services with booking and lead capture
- Small businesses managing products, clients, and analytics
- Service providers (beauty, fitness, education) with appointment scheduling
- Creators and freelancers needing a professional web presence

## Company Information

- Legal entity: ИП BEEGIN
- BIN: 971207300019
- Address: г. Алматы, ул. Шолохова, д. 20/7
- Email: <admin@LinkMAX.my>
- Phone: +7 705 109 76 64

---

## 2) User Roles and Main Journeys

### 2.1 Visitor (Public Page Viewer)

**What they see:**

- Creator's profile (avatar, name, bio, verification badge)
- Block-based content: links, products, services, galleries, events
- Interactive elements: booking forms, event registration, contact forms

**Actions they can perform:**

- Click links and CTAs → tracked as `block_click` events
- Submit lead forms → creates record in `leads` table
- Register for events → creates `event_registrations` + receives email/ticket
- Book appointments → creates `bookings` record with time slot
- Download files, view videos, browse catalogs

**Data captured (anonymized):**

- Page views (`analytics.event_type = 'page_view'`)
- Block clicks with block_id reference
- UTM parameters stored in `metadata` JSON
- Form submissions stored with consent

---

### 2.2 Creator (Page Owner)

**Primary journey:**

```text
Signup → AI Onboarding (3 steps) → Page Generated → Customize Blocks → Publish → Share Link → Track Analytics → Manage Leads
```

**Key capabilities:**

| Feature | Identity (Free) | Starter (Success) | Pro (Business OS) |
| :--- | :--- | :--- | :--- |
| **Price** | $0 / mo | **$0 / mo + 7% fee** | **~$6.5 / mo + 1% fee** |
| Pages | 1 | 2 | 6 |
| Blocks | 11 free types | All 28 types | All 28 types |
| AI generations | 1/month | 3/month | 10/month |
| Analytics | Basic (7 days) | Full | Deep + Heatmaps |
| CRM/Leads | View only | Full management | Full + Automations |
| Remove watermark | No | Yes | Yes |
| Custom domain | No | Yes | Yes |

- **Full Report**: [UX_UI_AUDIT_REPORT_2026_03_12.md](file:///c:/Users/i.azelkhanov/.gemini/antigravity/brain/e9ed3a0d-5f2f-4e48-b33f-7e907b04b0d6/UX_UI_AUDIT_REPORT_2026_03_12.md)

### [2026-03-12] Fluid Design System & Mobile Polish

A system-wide modernization was implemented to achieve "Responsive Harmony":

- **Fluid Typography**: Replaced media-query breakpoints with mathematical `clamp()` functions for all semantic text roles.
- **Fluid Spacing System**: Introduced `--space-page-px` and `--space-section-y` tokens for seamless cross-device layouts.
- **Component Polish**:
  - HeroSection: Scaled CTAs and stats for mobile viewports.
  - Insights: Refined tab navigation with horizontal scrolling and optimized touch triggers.
  - Editor: Increased touch target sizes for block reordering and insertion (44x44px+).
  - CRM: Standardized page paddings and improved action accessibility.
- **Performance**: Capped blur radii and simplified animations on mobile to maintain 60FPS on low-end devices. Implemented **Vendor Bundle Splitting** (`manualChunks`) in production builds to reduce TBT and improve Core Web Vitals.

**Dashboard sections (DashboardV2):**

- **Editor** — Block management, drag-drop reordering, inline editing
- **Analytics (Insights)** — Views, clicks, conversions, advanced block CTR
- **CRM (Leads)** — Centralized inbox for form leads, bookings, and registrations
- **Settings** — Page settings (slug, SEO, domains) and Account settings (profile, billing)
- **Templates** — Apply pre-made designs created by admins in `page_templates`
- **History** — Version rollback (pages with content)

**Multi-page management:**

- Switch pages via sidebar dropdown
- Each page has unique slug: `LinkMAX.my/{slug}`
- Pro users can upgrade additional pages to "paid" status for premium features

---

### 2.3 Admin (Platform Administrator)

**Accessed via:** `/admin` route (requires `app_role = 'admin'`)

**Capabilities:**

| Section | Purpose |
| :--- | :--- |
| Users | View all users, premium status, ban/unban |
| Pages | Browse all pages, feature in gallery, moderate content |
| Analytics | Platform-wide metrics, event tracking |
| Tokens | Linkkon token economy management |
| Subscriptions | Manage plans, extend trials |
| Events | View all events and registrations |
| Verification | Review user verification requests |
| Partners | Manage partner logos and links |

**Key files:**

- `src/pages/Admin.tsx` — Main admin page
- `src/components/admin/` — Admin panel components refactored to use Service Layer
- `src/services/admin.ts` — Centralized admin business logic (Stats, Partners CRUD)
- `src/hooks/admin/useAdminData.ts` — React Query hooks for admin views
- `src/hooks/useAdminAuth.ts` — Admin authentication check

---

## 3) Core Concepts (Entities)

| Concept | What it is | Why it exists | Where in code |
| :--- | :--- | :--- | :--- |
| **Page** | A public mini-site with blocks | Core user asset | `src/domain/entities/Page.ts`, DB: `pages` |
| **Block** | Content unit (link, product, form, etc.) | Modular page building | `src/types/page.ts`, DB: `blocks` |
| **Published vs Draft** | Published pages are publicly visible | Control content visibility | `pages.is_published` column |
| **User Profile** | Creator account data | Auth + preferences | DB: `user_profiles` |
| **Subscription** | Free/Pro tier status | Feature gating | `user_profiles.is_premium`, `premium_expires_at` |
| **Lead** | Contact form submission | CRM functionality | `src/services/pages.ts`, DB: `leads` |
| **Booking** | Appointment request | Scheduling feature | DB: `bookings`, `booking_slots` |
| **Event** | Event with registration | Event management | DB: `events`, `event_registrations` |
| **Analytics Event** | Page view, click, conversion | Performance tracking | `src/services/analytics.ts`, DB: `analytics` |
| **Experiment** | A/B test for a block | Conversion optimization | `src/services/experiments.ts`, DB: `experiments` |
| **Wallet** | User balance and ledger | Fintech foundation | `src/services/fintech.ts`, DB: `user_wallets` |
| **Transaction** | Financial record (GMV/Fee) | Ledger accounting | DB: `wallet_transactions` |
| **Widget Template** | Resuable HTML/JS/CSS snippet | DB-driven customization | DB: `widget_templates` |
| **Order** | Payment transaction record | Tracking status & provider | DB: `orders` |
| **Token** | Linkkon virtual currency | Gamification + marketplace | DB: `user_tokens`, `token_transactions` |

---

## 4) Blocks Catalog

### Free Blocks (11 types)

| Block | Visitor sees | Creator configures | Use case |
| :--- | :--- | :--- | :--- |
| **profile** | Avatar, name, bio, verification badge | Photo, name, bio text, frame style, animations | Hero section, personal branding |
| **link** | Clickable link card | URL, title, icon, background style | External links |
| **button** | CTA button | URL, text, hover effects, width | Primary actions |
| **text** | Formatted text | Content, heading/paragraph/quote style | Descriptions, headlines |
| **separator** | Horizontal divider | Style (solid/dashed/dotted), thickness | Visual separation |
| **avatar** | Profile image | Image, name, subtitle, frame | Secondary profiles |
| **socials** | Social media icons | Platform list with URLs | Social presence |
| **messenger** | Chat shortcuts | WhatsApp, Telegram, Viber links | Direct contact |
| **image** | Image with optional caption | Upload, alt text, link, style | Visual content |
| **map** | Embedded Google Map | Address string | Location display |
| **faq** | Accordion Q&A list | Question/answer pairs | Common questions |

### Pro Blocks (17 types)

| Block | Visitor sees | Creator configures | Use case |
| :--- | :--- | :--- | :--- |
| **video** | YouTube/Vimeo embed | URL, aspect ratio | Video content |
| **carousel** | Image slideshow | Images array, autoplay settings | Portfolio, gallery |
| **custom_code** | Embedded widget/HTML | HTML/CSS/JS code | Widgets, embeds |
| **form** | Lead capture form | Fields, submit email | Lead generation |
| **newsletter** | Email signup | Title, description, API endpoint | List building |
| **testimonial** | Reviews carousel | Name, text, rating, avatar | Social proof |
| **scratch** | Scratch-to-reveal card | Hidden text, scratch image | Gamification, promos |
| **catalog** | Product grid/list | Items with prices, categories | Service menu |
| **countdown** | Timer to date | Target date, display options | Urgency, launches |
| **before_after** | Comparison slider | Two images, labels | Transformations |
| **download** | File download button | File URL, name, size | Lead magnets |
| **product** | Product card | Name, price, image, buy link | Single product |
| **pricing** | Pricing table | Services with prices, durations | Service packages |
| **shoutout** | User recommendation | Target user ID | Cross-promotion |
| **community** | Telegram group link | Channel URL, member count | Community access |
| **event** | Event with registration | Date, location, capacity, form | Event management |

**Booking & Timezone Engine**:

- Automated visitor timezone detection.
- Cross-checking Google Calendar in `submit-booking` edge function for absolute double-booking protection.
- `useTimezone` hook centralized all logic and friendly formatting.

**Code locations:**

- Block renderers: `src/components/blocks/{BlockName}Block.tsx`
- Block editors: `src/components/block-editors/{BlockName}BlockEditor.tsx`
- Type definitions: `src/types/page.ts`
- Block registry: `src/lib/block-registry.ts`
- Unified editor wrapper: `src/components/block-editors/UnifiedBlockEditor.tsx`

---

## 5) Dashboard/CRM Overview

### Dashboard V2 Architecture

**Location:** `src/pages/DashboardV2.tsx`, `src/components/dashboard-v2/`

**Screen-based navigation:**

| Screen | Component | Purpose |
| :--- | :--- | :--- |
| Editor | `screens/EditorScreen.tsx` | Block management, inline editing, **mobile-optimized drag-and-drop** |
| Analytics | `screens/InsightsScreen.tsx` | Views, clicks, conversion metrics |
| CRM | `screens/ActivityScreen.tsx` | Leads, bookings, event registrations |
| Page Settings | `screens/PageSettingsScreen.tsx` | Slug, SEO, branding, **pixel analytics** |
| Account Settings | `screens/AccountSettingsScreen.tsx` | Profile, billing, notifications |

**Auto-save mechanism:**

- Hook: `src/hooks/useCloudPageState.ts`
- 1.5-second debounce on block changes
- Request versioning prevents stale overwrites
- Visual indicator: Saving... then Saved toast

**Publish flow:**

1. User clicks Publish button
2. `pages.is_published` set to `true`
3. Snapshot saved to `page_snapshots` (keeps last 5 versions)
4. Page accessible at `LinkMAX.my/{slug}`

### Pixel Analytics Integration

**Located in:** Page Settings -> Integrations

Supported platforms (Visitor tracking):

- **Facebook Pixel** (PageView)
- **TikTok Pixel** (PageView)
- **Google Analytics 4** (GA4)
- **Yandex Metrika**

### CRM/Inbox Features

**Entities displayed:**

- **Leads** — Form submissions with status pipeline (new, contacted, qualified, converted)
- **Bookings** — Appointment requests with date/time/status, enhanced with robust timezone handling (`date-fns-tz`)
- **Event Registrations** — Attendees with ticket codes

**Mobile UX/UI Hardening:**

- The CRM interface is optimized for mobile using full **Bottom Sheet (Drawer)** patterns.
- High-contrast typography (`text-xs` base for data tables) and minimum `44x44px` touch targets for all interactive actions in the Business Zone.
- All screens (Home, Insights, Activity, Editor, Events, Finance, Leads) are fully responsive, leveraging a **Fluid Spacing System** and visually consistent with the Liquid Glass aesthetic.

**Lead status flow:**

```text
new -> contacted -> qualified -> won/lost
```

**Automation (Pro):**

- CRM automations table: `crm_automations`
- Edge function: `process-crm-automations`
- Configurable follow-up triggers

---

## 6) Architecture

### Frontend

- Vite React SPA (Core Platform)
- React 18 + TypeScript
- Tailwind CSS with shadcn/ui
- i18next for RU/EN/KK/UZ (100% deep localization coverage, zero placeholders)
- PWA capabilities
- Motion system (CSS + IntersectionObserver)
- **Universal Error Normalization**: `app-error-normalizer.ts` and `useAppError` pattern maps raw exceptions to safe, localized `react-i18next` messages, abstracting technical details from the UI.

### Backend

- Supabase (Postgres, Auth, Storage)
- **Native Auth Implementation**: Direct integration with Supabase Auth (Google/Apple OAuth) and Telegram Web Login / Telegram Mini App validation via edge functions (`validate-telegram`, `validate-telegram-miniapp`).
- 28 Edge Functions

### 2.3. Platform Logic & Extensibility

- **Custom Fields (`zone_custom_fields`)**: Allows defining dynamic data points (Text, Number, Date, Boolean) appended to contacts (`zone_contacts.custom_fields`) and deals (`zone_deals.custom_fields`).
- **Webhooks & API (`user_api_keys`)**: Webhook triggers on events (Leads, Deals, Status changes) and a Public API for external integrations.
- **Background Jobs**: Supabase pg_cron for scheduled tasks (`cron_jobs` table/docs).ts, reminders)

### Edge Infrastructure

- **Cloudflare Workers** - Handles incoming requests for SEO/bot detection and pre-rendering

### AI integration (Decoupling in Progress)

- AI feature sets (Generate AI buttons) are currently decoupled.
- Temporarily bypassing Gemini generation to fallback to static layout construction, pending deployment of new internal algorithms.
- Deep localization for EN, KK, UZ languages (100% coverage, march 15). All keys synchronized and verified for zero Russian/English placeholders in target locales.
- Chatbot for visitor engagement

---

## 7) Public Pages and SEO

### Public Routes (Vite SPA / React Router)

| Route | Component | Purpose | Rendering |
| :--- | :--- | :--- | :--- |
| `/` | `src/pages/LandingV5.tsx` | Marketing landing page | Client-Side |
| `/pricing` | `src/pages/Pricing.tsx` | Plans and pricing | Client-Side |
| `/gallery` | `src/pages/Gallery.tsx` | Community showcase | Client-Side |
| `/auth` | `src/pages/Auth.tsx` | Login/signup | Client-Side |
| `/[slug]` | `src/pages/PublicPage.tsx` | User public page | Client-Side |
| `/seo-landing` | `src/pages/SeoLanding.tsx` | SEO/AEO optimized page for bots | Client-side Bot Detection |
| `/dashboard` | `src/pages/DashboardV2.tsx` | All dashboard routes | Client-Side |

### SEO Implementation

**Metadata API:**
Dynamic SEO meta tags are managed via `react-helmet-async` on the client and injected into the initial HTML by the `seo-ssr` edge function for crawlers.

**Structured data (JSON-LD):**

- WebPage schema for all pages
- Person/Organization for profiles
- FAQPage for FAQ blocks
- Event schema for event blocks
- LocalBusiness for service pages

**AEO/GEO optimization:**

- **Server-rendered HTML** for AI crawlers (ChatGPT, Perplexity, Gemini, Grok, DeepSeek, Qwen)
- Semantic HTML (h2/h3 structure)
- Key facts bullet points and **Answer Block** generation
- Meta `ai-summary` and dedicated `llms.txt` for AI assistant discovery

**Technical SEO:**

- Sitemap: `public/sitemap.xml` (Seed) + `generate-sitemap` Edge Function (Full index)
- SEO Landing: `/seo-landing` for deep indexing of core platform value.
- Robots: `public/robots.txt` (AI-bot optimized)
- AI Metadata: `public/llms.txt`
- Canonical URLs per page

---

## 8) Payments and Plans

### 8.1 Модель монетизации (Step-by-Growth)

LinkMAX использует гибридную модель, направленную на минимизацию барьеров для входа. Подробности в [2. Бизнес-модель и Фин-модель](../product/2_BUSINESS_FINANCIAL_MODEL.md).

| План | Цена (KZT/мес) | Описание |
| :--- | :--- | :--- |
| **Identity (Free)** | 0 | 1 страница, виральность через вотермарку. |
| **Starter (Transaction)** | 0 + 7% комиссия | Доступ к CRM и Payments без абонплаты. Интеграция с Kaspi QR и Robokassa. Удержание 7% комиссии. |
| **Pro (Business)** | ~3,045 (annual) | White-label, 6 страниц, полная CRM, комиссия 1%. |

### Plan Checking

**Frontend hooks:**

- `src/hooks/usePremiumStatus.ts` — Returns `isPremium`, `premiumExpiresAt`
- `src/hooks/useFreemiumLimits.ts` — Checks specific feature access

**Database columns:**

- `user_profiles.is_premium` — Boolean premium status
- `user_profiles.premium_expires_at` — Expiration timestamp
- `user_profiles.trial_ends_at` — Trial period end

### Page Upgrades (Pro)

- Additional pages start as free within Pro account
- Can upgrade individual pages to paid status
- Tracked via `pages.is_paid` and `pages.is_primary_paid`
- RPC: `set_primary_paid_page`, `rpc_upgrade_page_to_paid`

---

## 9) Data Storage and Backend

### Supabase Infrastructure

**Project ID:** `pphdcfxucfndmwulpfwv`

### Key tables

| Table | Purpose | RLS |
| :--- | :--- | :--- |
| `pages` | Page metadata, slug, theme, white-label | Owner only |
| `blocks` | Block content, position | Via page ownership |
| `user_profiles` | User data, premium status | Owner only |
| `leads` | Form submissions | Owner + public insert |
| `bookings` | Appointment requests | Owner + public insert |
| `events` | Event definitions | Owner only |
| `event_registrations` | Attendees | Owner + public insert |
| `analytics` | Event tracking | Public insert, owner read |
| `user_tokens` | Linkkon balance | Owner only |
| `page_snapshots` | Version history | Owner only |
| `languages` | Translations | Admin management, public read |
| `templates` | Project page templates (JSON blocks) | slug (PK), name, description, category, thumbnail_url, components (JSONB), is_active |
| `i18n_translations` | JSONB store for DB-driven translations | Admin only |
| `widget_templates` | Reusable block/widget templates | id (PK), name, description, category, thumbnail_url, components (JSONB), is_active |
| `orders` | Payment transactions tracking | id (PK), user_id, amount, currency, status, provider, description, metadata |
| `custom_domains` | Mapping of domains to pages | Owner + Admins |
| `zone_document_templates` | Templates for document generation | Zone Member access |
| `zone_documents` | Generated documents with status | Zone Member access |
| `language_upload_history` | Translation upload logs | Admin only |

### Data model (high level)

**Core entities:**

- `pages`: public page metadata, SEO settings, theme.
- `blocks`: structured blocks for each page (28 types).
- `user_profiles`: plan, limits, and profile data.
- `subscriptions`: plan status and billing metadata.

- **Fluid Design System**:
  - All UI components are built with a responsive, fluid spacing system.
  - Mobile adaptation is a core principle, ensuring optimal experience across devices.

- **Quality Assurance**:
  - Added `test:coverage` script to `package.json` for code coverage tracking.
  - Updated `PLATFORM_SNAPSHOT.md` health score to **10/10** (Status: Production Ready).

- **Multi-Page**: Users can create up to 6 pages (Pro) or 1 page (Free).
- **Custom Domains**: Pro users can connect custom domains via CNAME record.
- **SSR/SEO**: Hybrid SSR via Cloudflare Workers + `seo-ssr` Edge Function for bots.
- **Analytics**: Built-in simple analytics + Pixel integrations (FB, TT, GA4, Yandex).

**Leads and CRM:**

- `leads`: lead records collected from forms.
- `lead_interactions`: status history and notes.
- `crm_automations`: automated follow-up rules.

**Business Zones (Multi-Tenant Workspaces):**

- `zones`: workspace metadata, billing plan, owner.
- `zone_members`: RBAC membership (owner/admin/member/viewer).
- `zone_subscriptions`: plan billing cycles and status.
- `process-lead`, `api-leads` (Public API).

#### 2.2.3. Deals & Pipelines (CRM)

- **Tables**: `zone_deals`, `zone_deal_stages`, `zone_activities`, `zone_pipelines`
- **Features**:
  - Multiple sales pipelines support.
  - Kanban board (DnD via `@dnd-kit`).
  - Expected value tracking.
  - Custom Fields (JSONB) for dynamic data collection.
- **Edge Functions**: `api-deals` (Public API).
- `zone_deal_activities`: deal activity log.
- `zone_conversations`: team inbox conversations (Telegram, etc.).
- `zone_messages`: realtime messages within conversations.
- `zone_tasks`: collaborative task management with priorities, assignments, and **checklists**.
- `zone_invoices`: invoice tracking per deal/contact with **multi-item support**, automatic sequential numbering, `robokassa_invoice_id` tracking, and **Kaspi QR Sandbox** simulation components for transaction verification.
- `zone_invites`: invite tokens for onboarding new members.
- `zone_automations`: advanced rule-based CRM engine (triggers: invoice paid, stage change, etc.).
- `zone_document_templates`: customizable HTML templates for Acts/Invoices/Contracts generation.
- `zone_documents`: actual generated documents attached to deals and contacts supporting status tracking.

**Social features:**

- `friendships`: user connections.
- `shoutouts`: cross-promotion between users.
- `collaborations`: joint page features.

**Events and Bookings:**

- `events`: event management.
- `event_registrations`: attendee tracking.
- `bookings`: appointment scheduling.
- `booking_slots`: availability management.

**Gamification:**

- `user_tokens`: Linkkon token balances.
- `token_transactions`: token economy history.
- `user_achievements`: unlocked achievements.
- `daily_quests_completed`: quest progress.
- `weekly_challenges`: challenge tracking.

### Edge Functions

| Function | Trigger | Purpose |

| Function | Trigger | Purpose |
| :--- | :--- | :--- |
| `ai-content-generator` | Dashboard | AI page/block generation |
| `chatbot-stream` | Widget | AI chatbot responses |
| `translate-content` | Editor | Block content translation |
| `create-lead` | Form submit | Lead capture |
| `send-lead-notification` | Lead created | Telegram/email alert |
| `send-booking-notification` | Booking created | Owner notification |
| `send-booking-reminder` | Cron | Upcoming booking reminders |
| `send-event-confirmation` | Registration | Attendee confirmation email |
| `send-attendee-email` | Manual | Custom attendee emails |
| `generate-sitemap` | On-demand | Dynamic sitemap XML |
| `process-crm-automations` | Cron | CRM follow-up automation |
| `telegram-bot-webhook` | Telegram | Bot command handling |
| `telegram-password-reset` | Auth | Password reset via Telegram |
| `validate-telegram` | Auth | Telegram login verification (Web widget) |
| `validate-telegram-miniapp` | Auth | Telegram Mini App `initData` verification |
| `process-transaction-fee` | Webhook | Automates Kaspi/Robokassa fee deductions and balance updates |
| `send-collab-notification` | Collaboration | Collaboration alerts |
| `send-friend-notification` | Friends | Friend request alerts |
| `send-social-notification` | Social | Social activity alerts |
| `send-team-notification` | Teams | Team activity alerts |
| `send-trial-ending-notification` | Cron | Trial expiry reminders |
| `send-weekly-digest` | Cron | Weekly summary emails |
| `send-weekly-motivation` | Cron | Motivational notifications |
| `seed-demo-accounts` | Admin | Demo data seeding |
| `google-forms-parser` | Integration | Google Forms parsing |
| `public-experts` | Public | Expert directory API |
| `seo-ssr` | Bot request | SSR HTML for crawlers (rate limited, warm-up) |
| `pixel-proxy` | Analytics | Server-side FB CAPI / TikTok / GA4 forwarding |
| `resolve-domain` | Domain | Custom domain resolution (Hostname -> Slug) |
| `verify-domain` | Domain | Real-time DNS CNAME verification via Deno.resolveDns |
| `language-upload` | Admin | Language file uploads |
| `send-contact-email` | Form | Contact form email via Resend |

### Key RPC Functions

| Function | Purpose |
| :--- | :--- |
| `save_page_blocks` | Atomic block save with deduplication |
| `check_page_limits` | Validate page count vs tier |
| `generate_unique_slug` | Create unique page slug |
| `increment_view_count` | Track page views |
| `increment_block_clicks` | Track block clicks |
| `add_linkkon_tokens` | Credit token balance |
| `spend_linkkon_tokens` | Debit token balance |
| `claim_daily_token_reward` | Daily quest rewards (auth.uid check) |
| `get_token_analytics` | Token economy stats (admin-only) |
| `process_marketplace_purchase` | Template purchases (auth check) |
| `export_user_data` | GDPR data export |
| `delete_user_account` | GDPR cascading delete |
| `warmup_edge_functions` | pg_cron warm-up pinger |

---

## 10) Repository Structure

```text
LinkMAX/
├── docs/
├── cloudflare-worker/
├── public/
├── src/
│   ├── components/
│   │   ├── blocks/               # 28 block renderers (public view)
│   │   ├── block-editors/        # 28 block editors (dashboard)
│   │   ├── editor/               # Editor core logics (BlockRenderer, etc)
│   │   ├── dashboard-v2/         # Dashboard components
│   │   ├── zones/                # Business Zone UI (CRM, Inbox, Tasks, Settings)
│   │   ├── landing-v5/           # Landing page sections
│   │   ├── admin/                # Admin panel components
│   │   ├── auth/                 # Auth forms
│   │   ├── billing/              # Subscription and premium limits
│   │   ├── pwa/                  # Progressive Web App features
│   │   ├── crm/                  # CRM/lead components
│   │   ├── seo/                  # SEO adjustments and metadata
│   │   ├── translation/          # Internationalization tools
│   │   ├── legal/                # Cookie consents, antispam
│   │   ├── layout/               # General Layout components
│   │   ├── ui/                   # shadcn/ui base components
│   │   └── ...                   # Other feature components
│   │
│   ├── pages/
│   │   ├── DashboardV2.tsx       # Main dashboard logic
│   │   ├── LandingV5.tsx         # Marketing landing (current)
│   │   ├── PublicPage.tsx        # User public pages
│   │   ├── Admin.tsx             # Admin panel
│   │   ├── Auth.tsx              # Login/signup
│   │   └── ...                   # Other pages
│   │
│   ├── platform/                 # Platform-specific integrations
│   │   ├── supabase/             # Client & type generation
│   │   ├── robokassa/            # Payment gateway logic
│   │   └── next/                 # SSR/Edge compatibility layers
│   │
│   ├── hooks/                    # React hooks (60+)
│   │   ├── admin/                # Admin panel hooks (useAdminData, etc.)
│   │   ├── analytics/            # Event and tracking hooks
│   │   ├── crm/                  # Lead management hooks
│   │   ├── dashboard/            # Dashboard flow hooks
│   │   ├── editor/               # Block editor hooks
│   │   ├── page/                 # Page state and versions
│   │   ├── social/               # Collab, community, friends
│   │   ├── ui/                   # Gesture, sound, toast
│   │   ├── user/                 # Auth, profile, billing
│   │   └── zones/                # Zone hooks (useZones, useZoneContacts, useZoneDeals, useZoneTasks)
│   │   
│   ├── lib/                      # Core utilities
│   │   ├── blocks/               # Block factories and validators
│   │   ├── export/               # PDF, Excel generators
│   │   ├── utils/                # Compress, format, helpers
│   │   ├── page-templates.ts     # Pre-made templates
│   │   ├── widget-templates.ts   # Pre-made widgets
│   │   └── ...                   # Other utils
│   │
│   ├── services/                 # Business logic services
│   │   ├── pages.ts              # Page CRUD operations
│   │   ├── user.ts               # User profile management
│   │   ├── analytics.ts          # Analytics tracking
│   │   ├── events.ts             # Event management
│   │   ├── tokens.ts             # Token economy
│   │   ├── admin.ts              # Admin dashboard services
│   │   └── ...                   # Other services
│   │
│   ├── domain/                   # Domain entities (Clean Architecture)
│   │   ├── entities/             # Block, Page, User entities
│   │   └── value-objects/        # Result type, validation
│   │
│   ├── repositories/             # Data access layer
│   │   ├── interfaces/           # Repository contracts
│   │   └── implementations/      # Supabase implementations
│   │
│   ├── use-cases/                # Application workflows
│   │
│   ├── lib/                      # Utilities
│   │   ├── block-registry.ts     # Block type definitions
│   │   ├── block-utils.ts        # Block manipulation helpers
│   │   ├── block-recommendations.ts # Niche-based suggestions
│   │   └── ...                   # Other utilities
│   │
│   ├── types/                    # TypeScript definitions
│   │   ├── page.ts               # Block and page types (700+ lines)
│   │   ├── blocks.ts             # Block editor types
│   │   └── ...                   # Other types
│   │
│   ├── i18n/                     # Internationalization
│   │   └── locales/              # RU, EN, KK, UZ deep localization (100% verified)
│   │
│   ├── contexts/                 # React contexts
│   │
│   ├── integrations/
│   │   └── supabase/             # Supabase client and types
│   │
│   ├── main.tsx                  # App entry point
│   └── index.css                 # Global styles + design tokens
│
├── supabase/
│   ├── functions/
│   │   ├── ai-content-generator/
│   │   ├── create-lead/
│   │   ├── send-event-confirmation/
│   │   └── ...
│   ├── migrations/
│   └── config.toml
│
└── package.json
```

### Component structure

**Landing page v5 (current):**

Located in `src/components/landing-v5/`:

- `NavBar.tsx` - Navigation with scroll effects
- `HeroSection.tsx` - Hero with animated preview (Prismatic/Living Canvas)
- `ProblemSolutionSection.tsx` - Pain points and solutions
- `HowItWorksSection.tsx` - 3-step process
- `ResultsSection.tsx` - Use cases by niche
- `BlocksShowcaseSection.tsx` - Block type showcase
- `ExamplesGallerySection.tsx` - Live examples
- `TrustSection.tsx` - Social proof
- `PricingAurora.tsx` - Premium Pricing with Aurora effects
- `SEOExplainerSection.tsx` - SEO benefits
- `FAQSection.tsx` - FAQ accordion
- `FinalCTASection.tsx` - Final call to action
- `PremiumFooter.tsx` - Premium Footer with links

**Living Canvas Design System** - A premium visual overhaul (Evolution of Liquid Glass) featuring:

- **Canvas Engine**: WebGL-powered reactive backgrounds using `CanvasBackground` with organic fluid movement.
- **High-Index Glass**: Premium `glass-subtle` and `glass` tokens using `backdrop-blur-2xl`, standardizing material depth.
- **Dynamic Shadows**: Adaptive shadows with `shadow-glass-sm`, `shadow-glass`, and `shadow-glass-lg`.
- **Premium Typography**: Consistent `text-gradient` for hero headers and refined headings.
- **Organic Interactions**: Refined `framer-motion` variants with organic spring physics and staggered entry.

**Dashboard v2 (current):**

Located in `src/components/dashboard-v2/`:

- Layout components (header, sidebar, navigation)
- Screen components (editor, analytics, CRM, settings)
- Common utilities and dialogs
- **Motion System**: Centralized `framer-motion` variants for staggered entry (`containerVariants`, `itemVariants`) and `AnimatePresence` for smooth layout transitions.

---

## 11) How to Run Locally

### Required Environment Variables

```bash
VITE_SUPABASE_URL=            # Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY= # Supabase anon key
VITE_SUPABASE_PROJECT_ID=     # Project ID

# Edge functions (in Supabase secrets)
GEMINI_API_KEY=               # AI generation
RESEND_API_KEY=               # Email delivery
TELEGRAM_BOT_TOKEN=           # Telegram notifications
```

### Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm run test

# Build for production
npm run build

# Start production server (Preview)
npm run start
```

---

## 12) Troubleshooting

### Common Issues

**Migration/Schema errors:**

- Check `supabase/migrations/` for pending migrations
- Run migrations via Lovable Cloud interface
- Verify RLS policies do not block expected operations

**Block save failures:**

- Check network tab for 400/500 errors on `/rest/v1/blocks`
- Verify `page_id` exists and user owns the page
- Check for duplicate block IDs (use `ensureBlockIds()`)

**Auth loops:**

- Clear localStorage (`sb-*` keys)
- Check `user_profiles` table has matching user record
- Verify Supabase auth settings (auto-confirm enabled)

**AI generation fails:**

- Check `GEMINI_API_KEY` secret is set
- Verify rate limits (3/week for free users)
- Check Edge Function logs for errors

**Event registration not working:**

- Verify `events` table has matching event_id
- Check `event_registrations` RLS allows public insert
- Verify email service (Resend) is configured

**QR scanner not working:**

- Requires HTTPS (not localhost)
- Check camera permissions
- Some devices require explicit hardware access grant

### 14.1 Build/Lint errors

- Run `npm run typecheck` to identify type issues
- Check for unused imports/variables
- Verify all block types are registered in `block-registry.ts`

**Git Push Errors:**

- **HTTP 408/Timeout:** Run `git config http.postBuffer 524288000` to increase buffer size.
- **GH001 Large Files:** Check if `.next` folder was committed. Remove it from git history and add to `.gitignore`.

---

## 13) Adding New Blocks Safely

1. Add the block type to domain types and block registry (`src/lib/block-registry.ts`).
2. Implement renderer (`src/components/blocks/`) and editor UI (`src/components/block-editors/`).
3. Add localization keys for labels and helper text.
4. Update free vs Pro gating rules if needed.
5. Add analytics tracking for clicks or form submits.

---

## 14) Roadmap (What is Next)

Based on codebase analysis, these are logical next improvements:

1. ~~**Custom domains**~~ — Real-time verification, CNAME resolution, and dashboard control (Completed 2026-02-22)

2. ~~**White-label mode**~~ — Remove all platform branding for enterprise clients (Completed 2026-02-25)

| 13. **CRM Quick Actions**: Prominent "Call", "Email", and "Telegram" buttons in Contact and Deal views for instant communication. (Completed 2026-03-07)
| 12. **Phase 6: Regional Expansion & Technical Hardening**: Standardized Edge Functions with import maps, implemented manual CRM automations (Auto-Invoice), established Kaspi Pay service bridge, and added E2E CRM workflow verification. (Completed 2026-03-06)
| 12. **Monetization (Phase 1): Payment Skeleton**: Implemented `PaymentService` and `orders` table infrastructure. (Completed 2026-03-05)
| 13. **Business Zones Phase 4 (Analytics Dashboard)**: Visual funnel charts, revenue timeline, and performance metrics for zones. (Completed)
12. **API access** — Public API for integrations (Zapier, Make, custom apps)
13. **Booking TZ & GCal Protection** — Robust timezone awareness and server-side calendar conflict checks (Completed 2026-03-11)
14. **Global Command Palette (Cmd+K)** — Quick-select navigation across contacts and deals (Completed 2026-03-11)
15. **CRM Excel & PDF Exports** — Full native .xlsx generation and local JS-driven PDF Acts/Invoices (Completed 2026-03-11)
16. **Phase 4 & 5: Living Canvas Expansion** — Complete Landing Page overhaul and Dashboard UI standardization (Completed 2026-03-12)
17. **Email sequences** — Automated email drip campaigns for leads
18. **Mobile app** — Native iOS/Android app for page management

- **i18n**: Support for RU/EN/KK/UZ. Current status: **100% sync** (Synced March 2026).
- **Audit History**: See [FULL_PLATFORM_AUDIT_2026_02_18.md](FULL_PLATFORM_AUDIT_2026_02_18.md), [FULL_PLATFORM_AUDIT_2026_02_24.md](FULL_PLATFORM_AUDIT_2026_02_24.md), [EDO_MODULE_AUDIT_2026_03_05.md](EDO_MODULE_AUDIT_2026_03_05.md), and [AUDIT_REPORT_2026_03_10.md](AUDIT_REPORT_2026_03_10.md).

---

*Last updated: March 12, 2026*
*Current Platform Health Score: **10/10** (Full Mobile Adaptation & Dashboard Standardization completed, 256/256 tests passing)*
*Maintained by: Antigravity (Principal Engineer)*

# lnkmx.my — The Micro-Business OS

> **Document Purpose:** Single source of truth for the lnkmx platform — architecture, features, user flows, and repository structure. See `PLATFORM_SNAPSHOT.md` for the complete schema and infrastructure details. Written for team onboarding and technical reference.

---

## 1) What lnkmx is

**Positioning:** The Micro-Business Operating System — Page Builder + Mini-CRM + Analytics

lnkmx is a comprehensive SaaS platform that combines three core capabilities into one unified system:

1. **Page Builder** — AI-powered drag-and-drop constructor with 28 customizable blocks for creating professional websites without coding
2. **Mini-CRM** — Lead management system with status tracking, interaction history, and Telegram notifications
3. **Analytics** — Click tracking, conversion funnels, traffic sources, device breakdown, and geography insights

The platform enables creators, freelancers, and small businesses to build their online presence, capture leads, and manage client relationships from a single dashboard. Core value: complete business system accessible in minutes.

### Repository Security & Privacy
The codebase is hosted in a **Private** repository to protect intellectual property and business logic. Access is restricted to authorized team members and IPA BEEGIN representatives. Git history is periodically audited and sanitized of sensitive credentials. See [ADR 0024: Repository Security and Privacy](file:///c:/Users/admin/OneDrive - УО 'Алматы Менеджмент Университет'/Документы/inkmax/docs/ADR/0024-repository-security.md) for details on recent security hardening.

**Target audiences:**
- Experts and consultants showcasing services with booking and lead capture
- Small businesses managing products, clients, and analytics
- Service providers (beauty, fitness, education) with appointment scheduling
- Creators and freelancers needing a professional web presence

## Company Information

- Legal entity: ИП BEEGIN
- BIN: 971207300019
- Address: г. Алматы, ул. Шолохова, д. 20/7
- Email: admin@lnkmx.my
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
```
Signup → AI Onboarding (3 steps) → Page Generated → Customize Blocks → Publish → Share Link → Track Analytics → Manage Leads
```

**Key capabilities:**

| Feature | Free Tier | Pro Tier |
|---------|-----------|----------|
| Pages | 1 | 6 (1 primary + 5 additional) |
| Blocks | 11 free types | All 28 types |
| AI generations | 1/month | 5/month |
| Analytics | Basic (7 days) | Full (30 days + heatmaps) |
| CRM/Leads | View only | Full management |
| Remove watermark | No | Yes |
| Custom domain | No | Yes |

**Dashboard sections (DashboardV2):**
- **Editor** — Block management, drag-drop reordering, inline editing
- **Analytics (Insights)** — Views, clicks, conversions, advanced block CTR
- **CRM (Leads)** — Centralized inbox for form leads, bookings, and registrations
- **Settings** — Page settings (slug, SEO, domains) and Account settings (profile, billing)
- **Templates** — Apply pre-made designs created by admins in `page_templates`
- **History** — Version rollback (pages with content)

**Multi-page management:**
- Switch pages via sidebar dropdown
- Each page has unique slug: `lnkmx.my/{slug}`
- Pro users can upgrade additional pages to "paid" status for premium features

---

### 2.3 Admin (Platform Administrator)

**Accessed via:** `/admin` route (requires `app_role = 'admin'`)

**Capabilities:**

| Section | Purpose |
|---------|---------|
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
- `src/components/admin/` — Admin panel components
- `src/hooks/useAdminAuth.ts` — Admin authentication check

---

## 3) Core Concepts (Entities)

| Concept | What it is | Why it exists | Where in code |
|---------|------------|---------------|---------------|
| **Page** | A public mini-site with blocks | Core user asset | `src/domain/entities/Page.ts`, DB: `pages` |
| **Block** | Content unit (link, product, form, etc.) | Modular page building | `src/types/page.ts`, DB: `blocks` |
| **Published vs Draft** | Published pages are publicly visible | Control content visibility | `pages.is_published` column |
| **User Profile** | Creator account data | Auth + preferences | DB: `user_profiles` |
| **Subscription** | Free/Pro tier status | Feature gating | `user_profiles.is_premium`, `premium_expires_at` |
| **Lead** | Contact form submission | CRM functionality | `src/services/pages.ts`, DB: `leads` |
| **Booking** | Appointment request | Scheduling feature | DB: `bookings`, `booking_slots` |
| **Event** | Event with registration | Event management | DB: `events`, `event_registrations` |
| **Analytics Event** | Page view, click, conversion | Performance tracking | `src/services/analytics.ts`, DB: `analytics` |
| **Token** | Linkkon virtual currency | Gamification + marketplace | DB: `user_tokens`, `token_transactions` |

---

## 4) Blocks Catalog

### Free Blocks (11 types)

| Block | Visitor sees | Creator configures | Use case |
|-------|--------------|-------------------|----------|
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
|-------|--------------|-------------------|----------|
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
| **booking** | Appointment calendar | Working hours, slot duration | Scheduling |
| **event** | Event with registration | Date, location, capacity, form | Event management |

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
|--------|-----------|---------|
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
4. Page accessible at `lnkmx.my/{slug}`

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
- **Bookings** — Appointment requests with date/time/status
- **Event Registrations** — Attendees with ticket codes

**Lead status flow:**
```
new -> contacted -> qualified -> won/lost
```

**Automation (Pro):**
- CRM automations table: `crm_automations`
- Edge function: `process-crm-automations`
- Configurable follow-up triggers

---

## 6) Architecture

### Frontend

- **Vite React SPA** (Migrated purely to Vite, no Next.js)
- React 18 + TypeScript
- Tailwind CSS with shadcn/ui
- i18next for RU/EN/KK
- PWA capabilities
- Motion system (CSS + IntersectionObserver)

### Backend

- Supabase (Postgres, Auth, Storage)
- **Native Auth Implementation**: Direct integration with Supabase Auth (Google/Apple OAuth) without third-party wrappers.
- 28 Edge Functions for AI, notifications, SEO, and analytics
- Row Level Security for data isolation
- pg_cron for scheduled jobs (warm-up, digests, reminders)

### Edge Infrastructure
- **Cloudflare Workers** - Handles incoming requests for SEO/bot detection and pre-rendering

### AI integration (Decoupling in Progress)

- AI feature sets (Generate AI buttons) are currently decoupled.
- Temporarily bypassing Gemini generation to fallback to static layout construction, pending deployment of new internal algorithms.
- Translation for RU/EN/KK content using Locize logic.
- Chatbot for visitor engagement

---

## 7) Public Pages and SEO

### Public Routes (Vite SPA / React Router)

| Route | Component | Purpose | Rendering |
|-------|-----------|---------|-----------|
| `/` | `src/pages/LandingV5.tsx` | Marketing landing page | Client-Side |
| `/pricing` | `src/pages/Pricing.tsx` | Plans and pricing | Client-Side |
| `/gallery` | `src/pages/Gallery.tsx` | Community showcase | Client-Side |
| `/auth` | `src/pages/Auth.tsx` | Login/signup | Client-Side |
| `/[slug]` | `src/pages/PublicPage.tsx` | User public page | Client-Side |
| `/seo-landing` | `src/pages/SeoLanding.tsx` | SEO/AEO optimized page for bots | Client-side Bot Detection |
| `/dashboard` | `src/pages/DashboardV2.tsx` | All dashboard routes | Client-Side |

### SEO Implementation

**Metadata API (Next.js):**
- Dynamic `generateMetadata()` in `layout.tsx` and `page.tsx`
- Server-side fetching of user data for Open Graph tags
- Zero layout shift for critical meta tags

**Structured data (JSON-LD):**
- WebPage schema for all pages
- Person/Organization for profiles
- FAQPage for FAQ blocks
- Event schema for event blocks
- LocalBusiness for service pages

**AEO/GEO optimization:**
- **Server-rendered HTML** for AI crawlers (ChatGPT, Perplexity, Gemini)
- Semantic HTML (h2/h3 structure)
- Key facts bullet points

**Technical SEO:**
- Sitemap: `src/app/sitemap.ts` (Dynamic generation)
- SEO Landing: `/seo-landing` for deep indexing of core platform value.
- Robots: `src/app/robots.ts`
- Canonical URLs per page

---

## 8) Payments and Plans

### Subscription Tiers

| Plan | Price (KZT/month) | Features |
|------|-------------------|----------|
| Free | 0 | 1 page, 11 blocks, 1 AI generation/month, basic analytics |
| Pro | 2,900 (annual) | 6 pages (1 primary + 5 additional), 28 blocks, 5 AI/month, full CRM, no watermark |

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
|-------|---------|-----|
| `pages` | Page metadata, slug, theme | Owner only |
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
| `language_upload_history` | Translation upload logs | Admin only |

### Data model (high level)

**Core entities:**
- `pages`: public page metadata, SEO settings, theme.
- `blocks`: structured blocks for each page (28 types).
- `user_profiles`: plan, limits, and profile data.
- `subscriptions`: plan status and billing metadata.
- **Multi-Page**: Users can create up to 6 pages (Pro) or 1 page (Free).
- **Custom Domains**: Pro users can connect custom domains via CNAME record.
- **SSR/SEO**: Next.js-like SSR via Cloudflare Workers + Supabase Edge Functions for bots.
- **Analytics**: Built-in simple analytics + Pixel integrations (FB, TT, GA4, Yandex).

**Leads and CRM:**
- `leads`: lead records collected from forms.
- `lead_interactions`: status history and notes.
- `crm_automations`: automated follow-up rules.

**Analytics:**
- `analytics`: page views, CTA clicks, block clicks, and marketing events.

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
|----------|---------|---------|
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
| `validate-telegram` | Auth | Telegram login verification |
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
| `resolve-domain` | Domain | Custom domain resolution |
| `language-upload` | Admin | Language file uploads |
| `send-contact-email` | Form | Contact form email via Resend |

### Key RPC Functions

| Function | Purpose |
|----------|---------|
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

```
lnkmx/
├── docs/                          # Documentation
│   ├── platform.md                # This file
│   ├── architecture.md            # Technical architecture
│   └── Features.md                # Feature status tracking
│
├── cloudflare-worker/             # Cloudflare Worker (SEO/Bot handling)
│   ├── prerender-worker.js        # Worker logic
│   └── wrangler.toml              # Worker config
│
├── public/                        # Static assets (images, icons)
│
├── src/
│   ├── components/
│   │   ├── blocks/               # 28 block renderers (public view)
│   │   ├── block-editors/        # 28 block editors (dashboard)
│   │   ├── editor/               # Editor core logics (BlockRenderer, etc)
│   │   ├── dashboard-v2/         # Dashboard components
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
│   ├── pages/                    # Legacy Pages (Migrated to use client)
│   │   ├── DashboardV2.tsx       # Main dashboard logic
│   │   ├── LandingV5.tsx         # Marketing landing (current)
│   │   ├── PublicPage.tsx        # User public pages
│   │   ├── Admin.tsx             # Admin panel
│   │   ├── Auth.tsx              # Login/signup
│   │   └── ...                   # Other pages
│   │
│   ├── hooks/                    # React hooks (60+)
│   │   ├── admin/                # Admin panel hooks
│   │   ├── analytics/            # Event and tracking hooks
│   │   ├── crm/                  # Lead management hooks
│   │   ├── dashboard/            # Dashboard flow hooks
│   │   ├── editor/               # Block editor hooks
│   │   ├── page/                 # Page state and versions
│   │   ├── social/               # Collab, community, friends
│   │   ├── ui/                   # Gesture, sound, toast
│   │   └── user/                 # Auth, profile, billing
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
│   │   └── locales/              # RU, EN, KK translations
│   │
│   ├── contexts/                 # React contexts
│   │
│   ├── integrations/
│   │   └── supabase/             # Supabase client and types
│   │
│   ├── main.tsx                  # App entry point (Legacy/Reference)
│   └── index.css                 # Global styles + design tokens
│
├── supabase/
│   ├── functions/                # 28 Edge Functions
│   │   ├── ai-content-generator/
│   │   ├── create-lead/
│   │   ├── send-event-confirmation/
│   │   └── ...
│   ├── migrations/               # Database migrations
│   └── config.toml               # Supabase config
│
└── package.json                  # Dependencies
```

### Component structure

**Landing page v5 (current):**

Located in `src/components/landing-v5/`:
- `NavBar.tsx` - Navigation with scroll effects
- `HeroSection.tsx` - Hero with animated preview
- `ProblemSolutionSection.tsx` - Pain points and solutions
- `HowItWorksSection.tsx` - 3-step process
- `ResultsSection.tsx` - Use cases by niche
- `BlocksShowcaseSection.tsx` - Block type showcase
- `ExamplesGallerySection.tsx` - Live examples
- `TrustSection.tsx` - Social proof
- `PricingSection.tsx` - Pricing plans
- `SEOExplainerSection.tsx` - SEO benefits
- `FAQSection.tsx` - FAQ accordion
- `FinalCTASection.tsx` - Final call to action
- `FooterSection.tsx` - Footer with links

**Liquid Glass Design System** - A premium visual overhaul featuring:
  - **Glassmorphism**: Consistent use of `glass-card`, `backdrop-blur-xl`, and `border-white/10`.
  - **Depth & Shadows**: Layered shadows using `shadow-glass`, `shadow-glass-lg`, and `shadow-primary/20`.
  - **Premium Typography**: Extensive use of `text-gradient` for headers.
  - **Interactive Micro-animations**: Hover scales (`scale-[1.02]`), active presses (`scale-[0.98]`), and background glow transitions.
- **Motion system** (CSS + IntersectionObserver)
  - Staggered reveals and intersection-based transitions.
  - Performance-optimized CSS animations.

**Dashboard v2 (current):**

Located in `src/components/dashboard-v2/`:
- Layout components (header, sidebar, navigation)
- Screen components (editor, analytics, CRM, settings)
- Common utilities and dialogs
- **Motion System**: Centralized `framer-motion` variants for staggered entry (`containerVariants`, `itemVariants`) and `AnimatePresence` for smooth layout transitions.

---

## 11) How to Run Locally

### Required Environment Variables

```
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

# Build/Lint errors:
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

1. **Custom domains** — Allow Pro users to use their own domains instead of `lnkmx.my/{slug}`

2. **White-label mode** — Remove all platform branding for enterprise clients

3. **A/B testing for blocks** — Test different block configurations to optimize conversions

4. **Advanced booking** — Calendar sync (Google/Outlook), payment integration, reminders

5. **Team collaboration** — Multi-user editing for business pages

6. **API access** — Public API for integrations (Zapier, Make, custom apps)

7. **Email sequences** — Automated email drip campaigns for leads

8. **Analytics export** — CSV/Excel download of analytics data

9. **Block templates library** — Pre-configured block combinations for quick setup

10. **Mobile app** — Native iOS/Android app for page management

---

*Last updated: February 20, 2026*
*Maintained by: lnkmx Platform Team*

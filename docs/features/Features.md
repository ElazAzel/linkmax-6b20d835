# LinkMAX Features


## Status legend

- **Implemented**: shipped and usable in production.
- **In progress**: partially shipped or under active development.
- **Planned**: on roadmap, not shipped yet.

---

## Core Blocks (Free Tier)

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Profile, text, buttons, links | Implemented | Basic identity and CTA blocks |
| Images, separators, socials | Implemented | Visual structure and social links |
| Lead form (basic) | Implemented | Collect inquiries into leads |
| Messenger shortcuts | Implemented | Quick contact blocks |
| Map block | Implemented | Location display |

## Pro Blocks

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Pricing block | Implemented | Service packages with locale-aware formatting |
| Catalog block | Implemented | Product listings with cart |
| Video and carousel blocks | Implemented | Rich media blocks |
| Testimonials and FAQ | Implemented | Social proof and objections |
| Booking block | Implemented | Schedule appointments with time slots, timezone support |
| Event block | Implemented | Event registration with ticket confirmation |
| Custom code block | Implemented | Embed widgets (sandboxed `allow-scripts` only) |
| Countdown block | Implemented | Timer for events/offers |
| Scratch card block | Implemented | Gamified promotions |

## AI

| Feature | Status | Notes |
| :--- | :--- | :--- |
| AI page draft generation | Implemented | Drafts structure and copy via Google Gemini |
| AI copy refinements | Implemented | Short copy tweaks, SEO titles, and tone rephrasing |
| Auto-translation | Implemented | RU/EN/KK content variants (16+ languages supported) |
| AI chatbot | Implemented | Public page chatbot with streaming and knowledge base |


## CRM & Leads

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Lead capture | Implemented | Create lead records from forms (Turnstile CAPTCHA) |
| Lead status tracking | Implemented | Pipeline stages and notes |
| Telegram notifications | Implemented | Lead alerts via Telegram bot |
| CRM automations | Implemented | Hourly cron processes automation rules |
| Command Palette | Implemented | Cmd+K global search across all entities (Users, Pages, CRM) |
| Export System | Implemented | CSV/PDF export for Analytics, Leads, and Transactions |
| Quick replies | Implemented | Templates for faster multi-channel responses |


## Analytics & Tracking

| Feature | Status | Notes |
|---|---|---|
| Page views and clicks | Implemented | Core events stored in analytics |
| Block-level analytics | Implemented | Clicks per block with conversion rates |
| Pixel integrations | Implemented | Facebook Pixel, TikTok Pixel, GA4, Yandex Metrika |
| Server-side pixel proxy | Implemented | FB CAPI, TikTok Events API, GA4 MP (bypasses ad-blockers) |
| Cookie consent gating | Implemented | Analytics requires explicit consent |
| Funnel analytics | In progress | V2 product analytics now has `product_events`, activation state, creator health score, and the initial activation-event bridge. Dashboard/reporting surfaces remain roadmap work. |
| Heatmap friction signals | In progress | Phase 25 foundation adds `heatmap_rage_clicks`, privacy-safe repeated-click detection, friction-zone aggregation, and owner heatmap surfacing. |

## Business Zones (Business OS)

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Operational Command Center | Implemented | Zone dashboard now surfaces health score, daily focus, next actions, work queue, and activation map across deals, tasks, contacts, invoices, and automations |
| Kanban Pipeline | Implemented | Drag-and-drop deals management with custom stages |
| Task Management | Implemented | Priority-based tasks with checklists and assignments |
| Shared Contacts | Implemented | Consolidated contact database for the entire zone |
| Invoice System | Implemented | Multi-item invoices with automated numbering and tracking |
| Document Management (EDO) | Implemented | Template-based generation of Acts, Contracts, and Invoices |
| Zone Automations | Implemented | Trigger-based workflows (e.g., stage change -> notification) |
| Team Collaboration | Implemented | RBAC-based member management (Owner, Admin, Member) |

## Payments & Subscriptions

| Feature | Status | Notes |
| :--- | :--- | :--- |
| RoboKassa checkout | Implemented | Subscription purchase flow and webhook handling |
| Paddle checkout | Implemented | Overlay checkout for Pro paywall flows with promo-code handoff |
| Subscription status sync | Implemented | Access control based on plan |
| Billing recovery | In progress | Phase 26 foundation adds Paddle failed-payment recovery state, idempotent billing journal records, owner email/Telegram notifications, product analytics events, and Webhooks V2 events |
| Local pricing in KZT | Implemented | Pricing display by locale |
| Linkkon token economy | Implemented | Virtual currency with daily quests |

## Collaboration & Growth

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Gallery and templates | Implemented | Public examples and inspirations |
| Teams and collaborations | Implemented | Shared access to pages and Business Zones |
| Custom Domains | Implemented | Connect your-domain.com with auto-SSL |
| Referral program | Implemented | Multi-tier incentivized sharing (Linkkon rewards) |

| Expert directory | Implemented | Public expert profiles with niche, city, search, verified-review filters, and rating summaries |

## Trust & Reputation

| Feature | Status | Notes |
|---|---|---|
| Static testimonials block | Implemented | Creator-edited social proof inside page blocks. |
| Verified reviews foundation | In progress | Phase 47 adds durable `reviews`, `page_review_summaries`, booking-backed review RPCs, moderation RPC, analytics events, webhook events, public-page display for published verified reviews, Activity inbox owner moderation, and `/experts` rating enrichment. |
| Review request links | In progress | Phase 47 adds durable `review_requests`, hashed token RPCs, request lifecycle helpers, analytics/webhook events, the customer-facing `/review/request/:token` submission route, a completed-booking CRM action to create/copy request links, and CRM automation wiring that creates owner Telegram review-request notifications after completed bookings. |

## Localization

| Feature | Status | Notes |
|---|---|---|
| RU/EN/KK UI | Implemented | Full product UI localization |
| Content localization | Implemented | Block content in multiple languages |
| Locale-aware formatting | Implemented | Dates, currency via centralized `format.ts` |

## Security & Compliance

| Feature | Status | Notes |
|---|---|---|
| GDPR data export/delete | Implemented | SQL functions for full compliance |
| Cookie consent banner | Implemented | Accept/reject with localStorage |
| Cloudflare Turnstile | Implemented | Anti-spam on public forms |
| CSP headers | Implemented | Strict Content Security Policy |
| XSS sandbox | Implemented | Custom code iframe sandboxed |
| Trigger Guards | Implemented | Database-level protection for sensitive columns |

## Design Systems

| Feature | Status | Notes |
|---|---|---|
| Living Canvas | Implemented | Evolution of Liquid Glass: Prismatic effects, WebGL backgrounds |
| Fluid Spacing/Typo | Implemented | Math-based scaling for all viewports |

## Infrastructure

| Feature | Status | Notes |
|---|---|---|
| SSR for SEO bots | Implemented | `seo-ssr` edge function with hreflang + indexnow |
| Cold start warm-up | Implemented | pg_cron pings every 4 min (Zenith Optimized) |
| Rate limiting | Implemented | Per-IP and Per-User limits on 100% of edge functions |
| Error reporting | Implemented | Sentry-compatible logger + Health-Check endpoint |
| Product feature flags | In progress | Native `feature_flags`, rules, audit log, and typed evaluation service exist. Admin UI and module-level rollout wiring remain roadmap work. |

## Developer Portal (Zenith Phase)

| Feature | Status | Notes |
| :--- | :--- | :--- |
| API Key Management | In progress | V1 UI/service exists; Phase 46 adds V2 scoped `api_keys` contract, hash verification RPC, expiry/revocation metadata, and rate-limit metadata. |
| Outgoing Webhooks | In progress | V1 page/automation webhooks exist; Phase 46 adds endpoint registry, secrets, queue, delivery logs, canonical events, HMAC contract, and retry schedule. Dispatcher and status UI remain roadmap work. |
| Developer Settings UI | Partial | Dedicated dashboard section exists, but V2 endpoint persistence, delivery timeline, test event, manual retry, and secret rotation UI remain roadmap work. |
| API Explorer | Implemented | Live playground for testing LinkMAX API endpoints |


---

*Last updated: July 9, 2026 (Phase 50 Business Zone Command Center)*

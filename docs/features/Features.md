# lnkmx Features

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
| AI page draft generation | Implemented | Drafts structure and copy via Gemini |
| AI copy refinements | In progress | Short copy tweaks and rephrasing |
| Auto-translation | Implemented | RU/EN/KK content variants |
| AI chatbot | Implemented | Public page chatbot with streaming |

## CRM & Leads

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Lead capture | Implemented | Create lead records from forms (Turnstile CAPTCHA) |
| Lead status tracking | Implemented | Pipeline stages and notes |
| Telegram notifications | Implemented | Lead alerts via Telegram bot |
| CRM automations | Implemented | Hourly cron processes automation rules |
| Quick replies | In progress | Templates for faster responses |

## Analytics & Tracking

| Feature | Status | Notes |
|---|---|---|
| Page views and clicks | Implemented | Core events stored in analytics |
| Block-level analytics | Implemented | Clicks per block with conversion rates |
| Pixel integrations | Implemented | Facebook Pixel, TikTok Pixel, GA4, Yandex Metrika |
| Server-side pixel proxy | Implemented | FB CAPI, TikTok Events API, GA4 MP (bypasses ad-blockers) |
| Cookie consent gating | Implemented | Analytics requires explicit consent |
| Funnel analytics | Planned | Signup to publish to Pro |

## Business Zones (Business OS)

| Feature | Status | Notes |
| :--- | :--- | :--- |
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
| Subscription status sync | Implemented | Access control based on plan |
| Local pricing in KZT | Implemented | Pricing display by locale |
| Linkkon token economy | Implemented | Virtual currency with daily quests |

## Collaboration & Growth

| Feature | Status | Notes |
| :--- | :--- | :--- |
| Gallery and templates | Implemented | Public examples and inspirations |
| Teams and collaborations | Implemented | Shared access to pages and Business Zones |
| Custom Domains | Implemented | Connect your-domain.com with auto-SSL |
| Referral program | Planned | Incentivized sharing |
| Expert directory | Implemented | Public expert profiles API |

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

## Infrastructure

| Feature | Status | Notes |
|---|---|---|
| SSR for SEO bots | Implemented | `seo-ssr` edge function with hreflang |
| Cold start warm-up | Implemented | pg_cron pings every 4 min |
| Rate limiting | Implemented | In-memory on critical edge functions |
| Error reporting | Implemented | Sentry-compatible logger |

---

*Last updated: 2026-03-05*

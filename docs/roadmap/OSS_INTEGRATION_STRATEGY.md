# LinkMAX OSS Integration Strategy

> **Status:** Active
> **Last updated:** July 4, 2026
> **Source of truth relationship:** This document extends `docs/PLATFORM_SNAPSHOT.md`. If implementation facts conflict, `PLATFORM_SNAPSHOT.md` and the codebase win.

## Position

LinkMAX is no longer just a link-in-bio product. It is becoming a micro-business operating system: Page Builder, CRM, Business Zones, analytics, payments, SEO/SSR, Telegram, and Developer Portal in one workflow.

The OSS ecosystem should be used as a map of proven SaaS categories, not as a shopping list of systems to embed wholesale. The product risk is clear: if every category becomes a full external product inside LinkMAX, the user experience turns into a heavy admin suite instead of a fast operating cockpit for solo businesses.

## Product Principles

1. Core UX stays native. Users should see human product concepts: "Автоматизации", "Записи", "Клиенты", "Продажи", "Документы".
2. OSS projects are architecture references first. Add a dependency only when it clearly reduces build time, cost, or operational risk.
3. V1 foundations already shipped in several areas. The next roadmap is V2 hardening and operational depth, not feature-count theater.
4. The fastest value loop remains: page created -> lead captured -> lead processed -> invoice/order issued -> payment received.

## V1 Reality vs V2 Roadmap

| Area | Current V1 reality | V2 direction |
| --- | --- | --- |
| Product analytics | Visitor analytics, PostHog dependency, Web Vitals, dashboard analytics, Phase 46 `product_events`, activation state, creator health score, and initial AI/activation bridge | Complete activation funnel reporting, richer event coverage, and dashboard recommendations |
| Feature flags & rollout | Block-level A/B tests plus Phase 46 native `feature_flags`, targeting rules, audit log, and typed evaluation service | Admin rollout UI, module-level flag checks, and release governance for V2 surfaces |
| Developer Portal & Webhooks | API keys, outgoing webhooks, developer settings UI, Phase 46 V2 endpoint/secret/queue/delivery schema, scoped key RPCs, and typed event/retry/signature contract | Dispatcher edge functions, producer enqueueing, delivery timeline UI, test event, manual retry, HMAC verification UX |
| Trust & verified reviews | Static testimonial blocks, expert directory with rating summaries and filters, public experts dataset, and Phase 47 `reviews` / `page_review_summaries` / `review_requests` foundations with booking-backed creation, hashed request tokens, customer-facing request route, CRM copy action, CRM automation wiring, public page verified review display, owner moderation UI, analytics, and webhook events | Owner review analytics UI, GEO/AEO aggregate rating payloads, business verification badge, and dispatcher hardening |
| Automations | CRM/zone automation foundations | Template-first automation builder with 3-click activation |
| Booking | Booking block, timezone support, double-booking protection | Services, staff, availability, deposits, reschedule/cancel, no-show protection |
| Forms | Basic lead forms and event forms | Schema-driven form builder, conditional logic, lead scoring, survey templates |
| Billing & Commerce | Orders, wallet/ledger foundations, Robokassa/Kaspi flow, Paddle subscriptions, and Phase 48 billing recovery foundation | Usage metering, commission rules, idempotent ledger, recovery runner, protected digital delivery |
| Search | Cmd+K global/zone search | Postgres full-text/trigram index hardening, semantic search later |
| EDO/Documents | Document generation and PDF export | Simple signature lifecycle, audit trail, KZ-specific ECP later |
| Website analytics | Page views, clicks, block performance, pixel proxy | Micro-business language: who came, source, button conversion, lead quality |

## OSS Reference Map

| Category | Reference projects | Native LinkMAX interpretation |
| --- | --- | --- |
| Product Analytics | PostHog, Objectiv | Activation funnels, retention, creator usage telemetry |
| Workflow Automation | n8n, Activepieces, Pipedream, Temporal | CRM automation templates and simple trigger/action flows |
| Webhooks | Svix | Reliable event delivery with signatures, retries, logs, secret rotation |
| Scheduling | Cal.com | Booking V2 with staff, availability, reschedule, deposits |
| Forms / Surveys | Formbricks, Formio, LimeSurvey | Form Builder V2, NPS, lead qualification |
| E-commerce | Medusa, Saleor, Vendure | Small native catalog, checkout, orders, protected digital delivery |
| Billing | Lago | Dunning, promo codes, usage metering, fee rules, commission accounting |
| Digital Signature | DocuSeal, Documenso | Lightweight signing links, consent, audit trail, signed PDF archive |
| Observability | Sentry, Grafana, OpenStatus, Signoz | Errors, uptime, synthetic checks, health signals |
| Search | Meilisearch, Typesense, Qdrant | Postgres search first, dedicated/vector search only after scale triggers |
| Website Analytics | Plausible, Umami, Matomo | Privacy-first analytics explained in business language |
| Reviews & Reputation | Trustpilot, Senja, Canny references for trust capture patterns | Native verified reviews tied to bookings/orders, surfaced on public pages and expert discovery |
| Internal Tools | Appsmith, ToolJet, Windmill | Admin/support tooling, not customer-facing complexity |

## Priority Matrix

| Priority | Module | Why |
| --- | --- | --- |
| P0 | Repo/docs cleanup | Developers need one current truth before building deeper layers |
| P0 | Product analytics | Onboarding and activation cannot be improved blindly |
| P0 | Feature flags | V2 modules need controlled rollout before broad exposure |
| P0 | Webhooks V2 | Developer Portal must be operationally reliable |
| P0 | Verified reviews | Human trust is missing between expert discovery, booking, and conversion |
| P0 | Billing recovery | Failed Pro payments should become recoverable events, not silent churn |
| P1 | Automations | Core Business OS value |
| P1 | Booking V2 | High-value for beauty, experts, services, education |
| P1 | Form Builder V2 | Improves lead quality, not just lead volume |
| P1 | Billing/commission engine | Required for Step-by-Growth economics |
| P2 | Commerce/digital products | GMV and take-rate expansion |
| P2 | Search/Cmd+K hardening | Keeps UX scalable as entities grow |
| P2 | EDO signature | B2B trust and operational maturity |
| P3 | Support inbox | Operational maturity after core value loops |
| P3 | Social scheduling | Useful growth loop, not core Business OS |

## 90-Day Execution Plan

### Days 1-14: Foundation Sprint

- Keep README, quickstart, platform snapshot, feature list, and roadmap aligned.
- Define product analytics event naming.
- Add or harden `product_events`, activation state, and health score storage. Status: foundation added in Phase 46.
- Start tracking onboarding, publish, Telegram connection, first lead, and lead processing events. Status: initial bridge from existing activation events is in place; more direct editor, signup, and payment call sites remain.
- Define the native feature flag contract before broad controlled rollouts. Status: foundation added in Phase 46 with canonical keys, tables, RLS, audit log, and typed evaluation service.
- Define the Webhooks V2 reliability contract. Status: foundation added in Phase 46 with ADR 0029, scoped API key RPCs, endpoint registry, signing secrets, durable event queue, delivery log, and typed event/retry/signature service.
- Define the verified reviews trust contract. Status: foundation added in Phase 47 with ADR 0030, booking-backed review creation, moderation, review summaries, analytics events, and webhook events.
- Define the billing recovery contract. Status: foundation added in Phase 48 with ADR 0032, `subscriptions.recovery_*`, idempotent Paddle billing history, owner notifications, promo checkout handoff, and billing analytics/webhook events.

### Days 15-30: Activation & Insights Sprint

- Add admin activation funnel.
- Calculate Creator Health Score.
- Show a next-best-action module on the dashboard Home screen.
- Segment onboarding recommendations for expert, beauty, and freelancer users.
- Add owner review analytics, GEO/AEO aggregate rating payloads, and business verification on top of the shipped page and `/experts` trust surfaces.

### Days 31-50: Webhooks & Automations Sprint

- Harden webhook endpoint model, delivery logs, HMAC signatures, retry policy, manual retry, and event testing.
- Extend Phase 46 Webhooks V2 foundation with dispatcher edge functions, producer event enqueueing, and Developer Settings delivery timeline.
- Ship automation templates for leads, bookings, invoices, event registrations, Telegram, email, tasks, status changes, and outgoing webhooks.

### Days 51-70: Booking V2 Sprint

- Add services, staff, availability windows, buffers, reschedule/cancel links, and deposit-ready schema.
- Add Telegram booking controls for confirm, reschedule, cancel, and message customer.

### Days 71-90: Billing + Commerce Sprint

- Add usage metering and commission calculation.
- Harden ledger idempotency around debit, credit, fee, refund, payout, and adjustment events.
- Add recovery runner and dashboard surfacing for due billing recovery touchpoints.
- Ship protected digital products MVP and revenue dashboard.

## KPI Framework

| Metric | Definition | Target |
| --- | --- | --- |
| Signup -> Published page | Creators with first published page / completed signups | 55%+ |
| Published -> Telegram connected | Creators connecting Telegram after publishing / creators with published page | 40%+ |
| Published -> First lead or booking | Creators receiving first lead or booking within 14 days / creators with published page | 20%+ |
| First lead -> Lead processed | First leads moved from new to contacted/won/lost / first leads received | 60%+ |
| Free -> Starter | Free creators moving to Starter | 15-20% |
| Starter -> Pro | Starter creators upgrading to Pro | 3-5% |
| Pages with booking/form/pricing | Published pages containing at least one monetization or lead-quality block | 50%+ |
| Webhook delivery success | Successful deliveries / attempted deliveries after retry window | 98%+ |
| Billing recovery rate | Failed Pro billing windows that recover before exhaustion / failed Pro billing windows | 25%+ |
| Automation activation among Pro | Pro creators with at least one enabled automation | 25%+ |
| GMV tracked through LinkMAX | Paid order/booking volume tracked by LinkMAX | Growing month over month |

Guardrails:

- Do not optimize activation by pushing users into low-quality published pages.
- Do not increase lead volume while reducing lead processing rate.
- Do not add automation complexity that increases support load faster than activation.
- Do not add billing features without ledger idempotency and auditability.

## Architecture Contract

Every new module should move through:

```text
types -> services -> hooks -> UI -> edge functions -> migrations
```

Use native LinkMAX components and language first. External services can sit behind the scenes when they reduce operational burden, but the user-facing product should remain a simple Business OS.

## Not Now

| Avoid | Reason |
| --- | --- |
| ERPNext / Odoo-style ERP | Destroys product simplicity |
| Keycloak / Ory / SuperTokens | Supabase Auth is enough for the current stage |
| Full Chatwoot | Too heavy for early support needs |
| Full n8n inside product | Users should not face a technical workflow canvas |
| Kubernetes PaaS / Coolify / Dokku | Current serverless-first stack is simpler |
| Full Medusa/Saleor | Commerce should stay native and small |
| Full Metabase/Lightdash for users | Too complex for micro-business analytics |

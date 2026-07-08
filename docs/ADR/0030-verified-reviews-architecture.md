# ADR 0030: Verified Reviews Foundation

## Status

Accepted for phased implementation.

## Context

The July 2026 strategic plan identifies "human trust" as a P0 gap. LinkMAX already has a `testimonial` block for owner-authored social proof and AI-generated sample content, but the repository does not have a durable, verifiable review entity tied to a real `booking` or `order`.

Repository intelligence:

| Area | Current state | Gap |
| --- | --- | --- |
| Public proof | `TestimonialBlock` renders static block content | No proof that a testimonial came from a real customer |
| Booking | `bookings` stores customer, slot, status, staff, payment metadata | No review request or one-review-per-booking guard |
| Orders | `orders` tracks payments and status | No post-purchase review relationship |
| Expert discovery | `/experts` lists published pages with verified rating summaries, niche/city filters, and trust-aware ranking; `public-experts` still returns the GEO/AEO dataset | GEO/AEO API aggregate ratings and business verification badges are separate trust surfaces |
| Analytics/events | `product_events` and Webhooks V2 foundation exist | No `review.created` or `review.published` platform facts |
| Moderation | Owner dashboards manage CRM, bookings, invoices, and Activity inbox review moderation | Owner review analytics can extend the same summaries |

The main drift is the coexistence of `zones` and `organizations`. Booking staff uses `pages.organization_id -> organizations`; older Business Zone modules use `zones`. Reviews should not introduce a third workspace concept. The first iteration anchors reviews to `pages` and `owner_id`, records `organization_id` when present, and only records `zone_id` when an existing `zones` relationship is provable.

## Decision

Add a verified reviews foundation:

- `reviews`: durable review records, tied to `pages`, optionally to `bookings`, `orders`, staff, `organizations`, and `zones`.
- `page_review_summaries`: denormalized public-safe aggregate per page.
- RPC-only creation for booking-backed reviews.
- RPC moderation for owners/workspace admins.
- Public RLS exposes only `published` reviews for published pages.
- Creation and publication emit product analytics facts and Webhooks V2 events.

Static `testimonial` remains an editable block. It is not replaced and is not treated as verified proof.

## Gap Analysis

| Category | Status |
| --- | --- |
| Already implemented | Booking records, order records, testimonial block, public expert directory, product events, Webhooks V2 event queue, verified review table, status lifecycle, duplicate guard, aggregate rating, event contract, moderation RPC, public page display, Activity inbox moderation, `/experts` rating summaries and trust-aware ranking |
| Partially implemented | Trust messaging through static testimonials, verified public page reviews, `/experts` discovery, and SEO/GEO expert discovery |
| Missing | Business verification badge and GEO/AEO API aggregate rating payload |
| Can extend | `bookings`, `orders`, `pages`, `page_review_summaries`, `product_events`, `webhook_event_queue`, `/experts`, `public-experts` |
| Must change | Add business verification and GEO/AEO aggregate ratings without replacing the existing public-experts API |

## Product Design

Verified reviews improve public-page conversion for experts, beauty specialists, coaches, educators, and service businesses. The user value is simple: visitors can distinguish owner-written testimonials from reviews tied to completed bookings or paid orders.

Business impact:

- Higher public-page conversion.
- More owner activation after the first fulfilled booking.
- Stronger `/experts` marketplace quality without turning LinkMAX into a generic marketplace.
- More defensible trust layer for local solo businesses.

## UX Flow

First production flow:

1. Customer completes a booking.
2. Owner marks the booking completed.
3. Customer receives or opens a review request link.
4. Customer submits rating and optional text.
5. Review is stored as `pending`.
6. Owner publishes, hides, rejects, or flags the review.
7. Published review contributes to page rating summary and future public display.

The shipped review request, moderation, public page, and `/experts` iterations now cover steps 3-7 for booking-backed reviews and surface the aggregate rating in public discovery.

## Database Design

### `reviews`

- `page_id`: required FK to `pages`.
- `owner_id`: page owner for direct authorization and analytics.
- `organization_id`: optional FK to `organizations`, preserving booking/staff workspace ownership.
- `zone_id`: optional FK to `zones`, only populated when a real zone relationship exists.
- `booking_id`: optional FK to `bookings`, unique when present.
- `order_id`: optional FK to `orders`, unique when present.
- `rating`: integer 1-5.
- `body`, `title`: optional public content with length checks.
- `reviewer_display_name`: public display name.
- `reviewer_contact_hash`: non-public dedupe/audit hash, not raw contact data.
- `status`: `pending`, `published`, `hidden`, `rejected`, `flagged`.
- `verification_status`: `verified_booking`, `verified_order`, `owner_imported`, `unverified`.

### `page_review_summaries`

Stores `published_count`, `average_rating`, `last_review_at`, and rating breakdown for fast public/expert reads.

## Backend

- `create_review_for_booking(...)` inserts one pending review only for completed bookings after either authenticated customer ownership or contact proof against the booking email/phone.
- `moderate_review(...)` allows page owners, organization admins/editors, zone admins, and platform admins to transition review status.
- Triggers refresh page review summaries.
- Triggers emit `review_created` / `review_published` product events.
- Triggers enqueue `review.created` / `review.published` webhook events.

## Frontend

Shipped UI extends existing surfaces:

- `src/pages/ReviewRequest.tsx` handles customer review submission from tokenized request links.
- `src/components/crm/BookingsPanel.tsx` lets owners create and copy request links from completed bookings.
- `src/components/public/VerifiedReviewsSection.tsx` renders published verified reviews on public pages without replacing editable testimonial blocks.
- `src/components/crm/ReviewsPanel.tsx` adds Activity inbox moderation for pending, flagged, published, hidden, and rejected reviews through the existing `moderate_review(...)` RPC.
- `src/services/pages.ts` exposes a typed `fetchExpertDirectoryProfiles(...)` reader that joins public pages with `page_review_summaries`.
- `src/components/screens/Experts.tsx` shows verified rating badges, city filtering, search filtering, verified-only filtering, trust-aware ranking, and `AggregateRating` JSON-LD.

## Security

- No direct public insert into `reviews`.
- No raw reviewer email/phone is stored in the public review row.
- Anonymous booking review creation must prove the booking contact email or phone; authenticated booking customers can submit for their own booking.
- Public RLS only exposes published reviews for published pages.
- Moderation is RPC-controlled to avoid arbitrary direct updates.
- One review per booking/order prevents basic duplicate abuse.

## Performance

- Public page and directory views should read `page_review_summaries`, not aggregate `reviews` on every request.
- Indexes cover page/status/time, owner/status/time, booking, order, and workspace filters.
- Trigger summary refresh is page-scoped and cheap for small review volume.

## Scalability

At 100-10,000 users, trigger-maintained summaries are sufficient. At 100,000+ users, summaries can move to async queue refresh if write volume grows. At 1,000,000 users, `/experts` ranking should use indexed summary columns and cached directory pages.

## Backward Compatibility

The static `testimonial` block remains unchanged. Existing bookings, orders, public pages, and expert directory URLs remain compatible while review summaries enrich discovery cards.

## Iterations

1. Reviews foundation: schema, RPCs, summaries, event names, typed service, focused tests.
2. Review request flow: secure review request token foundation, customer-facing route, CRM booking copy action, booking-backed CRM automation wiring, and public page verified review display (ADR 0031 shipped).
3. Owner moderation UI in the existing Activity inbox.
4. `/experts` rating enrichment: typed directory reader, public summary badges, city/search/verified filters, trust-aware ranking, and `AggregateRating` schema.
5. Automation templates and Webhooks V2 dispatcher integration for review events.

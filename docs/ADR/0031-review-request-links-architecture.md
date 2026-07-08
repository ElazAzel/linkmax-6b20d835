# ADR 0031: Review Request Links

## Status

Accepted for phased implementation.

## Context

ADR 0030 added durable verified reviews, but review collection still needed a secure post-booking entry point. LinkMAX already has Booking, CRM automations, product analytics, and Webhooks V2 foundations. Review requests must extend those surfaces instead of creating a second review, booking, notification, or automation system.

Repository intelligence:

| Area | Current state | Gap |
| --- | --- | --- |
| Reviews | `reviews`, moderation RPCs, summaries, review events, Activity inbox owner moderation, and `/experts` rating enrichment | Business verification and GEO/AEO aggregate ratings remain separate trust surfaces |
| Booking | Completed bookings include customer contact and page ownership; CRM booking cards can create and copy review request links for completed bookings | Customer-channel delivery can extend the same automation log model when email/WhatsApp delivery is available |
| CRM automation | `review_request` automation type exists; `process-crm-automations` can now create booking-backed request links and notify the owner in Telegram | Customer-channel delivery can extend the same automation log model when email/WhatsApp delivery is available |
| Product analytics | `product_events` has canonical event validation | No `review_request_created` / `review_request_used` facts |
| Webhooks V2 | Durable queue and event catalog exist | No outbound events for request creation/usage |

## Decision

Add `review_requests` as the durable request layer for verified reviews:

- Store only a SHA-256 token hash. The raw token is returned once by RPC.
- Anchor the first iteration to completed bookings.
- Keep one active fact row per booking/order through partial unique indexes.
- Use RPC-only creation, token lookup, and token consumption.
- Emit product analytics and Webhooks V2 events when a request is created or used.
- Reuse `create_review_for_booking(...)` to submit the actual review, preserving verified review rules.

## Gap Analysis

| Category | Status |
| --- | --- |
| Already implemented | Bookings, CRM automations, verified reviews, product events, Webhooks V2, tokenized request links, public request route, CRM booking copy action, booking-based CRM automation wiring, public page verified review section, Activity inbox owner moderation, `/experts` verified rating cards and filters |
| Partially implemented | Owner trust workflow: collection, moderation, public display, and expert discovery exist; customer-channel delivery still depends on email/WhatsApp delivery infrastructure |
| Missing | Business verification badge and GEO/AEO aggregate rating payload |
| Can extend | `bookings`, `reviews`, `review_requests`, `automation_logs`, `product_events`, `webhook_event_queue`, `src/services/reviews.ts`, `src/services/pages.ts` |
| Must change | Add business verification and GEO/AEO aggregate ratings without replacing the existing public-experts API |

## Product Design

Review request links let a creator collect verified human trust at the exact moment a service is completed. This supports conversion on public pages and future expert discovery without forcing the owner to manually copy customer feedback into static testimonial blocks.

Business impact:

- Higher conversion on service pages.
- Better activation after first completed booking.
- Stronger automation and webhook hooks for CRM follow-up flows.
- A safer trust layer than owner-authored testimonials alone.

## UX Flow

1. Owner completes a booking.
2. Owner creates a review request link from the completed booking, or the existing CRM automation worker creates one after the configured delay.
3. Customer opens `/review/request/:token`.
4. Customer sees public-safe booking/page context.
5. Customer submits rating and optional text.
6. The token is marked `used`.
7. A pending verified review is created for owner moderation.

The first iteration implemented the data and service contract for steps 2-7. The second iteration added the customer-facing `/review/request/:token` route for steps 3-6. The third iteration added an owner action in the existing CRM bookings surface for manual request-link creation and copy. The fourth iteration wires booking-backed `review_request` automations into the existing hourly CRM automation processor. The sixth iteration adds owner moderation to the existing Activity inbox. The seventh iteration enriches `/experts` with public rating summaries and trust-aware ranking.

## Database Design

### `review_requests`

- `page_id`, `owner_id`, optional `organization_id` and `zone_id` preserve existing ownership boundaries.
- `booking_id` and `order_id` are optional fact references; at least one is required.
- `review_id` links to the created review after use.
- `request_token_hash` stores the SHA-256 hash of the raw token.
- `recipient_contact_hash` stores contact proof metadata without raw email/phone.
- `status` is `pending`, `used`, `expired`, or `revoked`.
- `expires_at`, `sent_at`, `used_at`, `revoked_at` support lifecycle and automation.

Indexes cover owner/status/time, page/status/time, expiry scans, and one request per booking/order.

### `automation_logs`

- `booking_id` is added as an optional target reference for booking-based automations.
- `lead_id` becomes nullable while `automation_logs_target_check` requires either a lead or booking target.
- `(automation_id, booking_id)` supports idempotent review-request automation checks without a new worker table.

## Backend

- `create_booking_review_request(...)` creates or rotates a pending token for a completed booking.
- `get_review_request_by_token(...)` returns public-safe page and booking context for a valid pending token.
- `submit_review_request(...)` consumes a token and delegates review creation to `create_review_for_booking(...)`.
- Triggers emit `review_request_created` / `review_request_used` product events.
- Triggers enqueue `review_request.created` / `review_request.used` webhook events.
- `process-crm-automations` branches `review_request` automations to completed bookings instead of converted leads, calls the existing RPC with service-role credentials, caps failed delivery retries at three attempts, and logs sent/failed/skipped outcomes against `automation_logs.booking_id`.
- Service-role execution can call `create_booking_review_request(...)`; authenticated owners still pass through `can_manage_page_review_requests(...)`.

## Frontend

- `src/services/reviews.ts` now owns review request lifecycle types and RPC wrappers.
- `src/pages/ReviewRequest.tsx` renders the customer-facing `/review/request/:token` route with loading, invalid, expired, used, revoked, form validation, submit, and success states.
- `src/main.tsx` registers the route before public slug routes so review tokens do not collide with creator pages.
- `src/components/crm/BookingsPanel.tsx` extends completed booking cards with an owner-only action that calls `createBookingReviewRequest(...)`, builds the absolute public URL, and copies it for customer follow-up.
- `src/components/crm/AutomationsPanel.tsx` keeps the existing review-request automation card and exposes booking variables, including `{review_request_url}`, for owner-configured Telegram copy.
- `src/components/public/VerifiedReviewsSection.tsx` renders published verified reviews and `page_review_summaries` on the existing public page without replacing owner-authored testimonial blocks.
- `src/components/crm/ReviewsPanel.tsx` adds owner moderation to the existing Activity inbox and calls `moderateReview(...)` instead of writing review rows directly.
- `src/components/screens/Experts.tsx` enriches the existing public directory with rating badges, city/search/verified filters, trust-aware ranking, and `AggregateRating` JSON-LD through `src/services/pages.ts`.

## Security

- Raw tokens are not stored.
- Public token lookup exposes only page and booking context needed to complete a review.
- Request creation requires owner/workspace permission for the booking page.
- Service-role automation can create links only through the same RPC, and pending manual links are not rotated by the worker.
- Submission reuses verified booking review rules and contact proof.
- RLS does not allow anonymous direct reads or writes to `review_requests`.
- Owner moderation stays RPC-controlled through `moderate_review(...)`; the Activity inbox reads only rows allowed by the existing owner/workspace review policy.

## Performance

- Token lookup is O(1) through a unique token hash.
- Owner operational views are covered by `(owner_id, status, created_at DESC)`.
- Automation scans only completed bookings older than the configured trigger window and uses `(automation_id, booking_id)` to avoid repeated sends.
- Public page rating still reads `page_review_summaries`; request flows do not add read-time aggregation.
- `/experts` reads `page_review_summaries` for returned page ids and does not aggregate raw `reviews` at render time.

## Scalability

At 100-10,000 users, synchronous RPCs and trigger events are sufficient. At 100,000+ users, sending reminders and expiring stale requests should move to queue-backed workers. At 1,000,000 users, owner dashboards should page by indexed request status and created time.

## Backward Compatibility

Existing reviews, testimonials, bookings, lead automations, CRM booking actions, and public pages remain compatible. The public route is isolated under `/review/request/:token`, marked `noindex,nofollow`, and only calls the token RPCs already defined in this ADR. `automation_logs` still supports lead targets and now also records booking targets. Owner moderation is added as a new Activity inbox tab rather than a parallel CRM module.

## Iterations

1. Review request foundation: schema, RPCs, event catalog, typed service, focused tests.
2. Customer-facing request route: `/review/request/:token`, accessible star rating, local validation, success/error states, component tests.
3. Booking CRM action: completed booking cards can create/copy request links through the existing typed service.
4. CRM automation wiring: completed bookings can produce request links and owner Telegram notifications through `process-crm-automations`.
5. Public page verified review section: published reviews and aggregate summary render after page blocks.
6. Owner moderation queue: Activity inbox reads owner reviews and publishes/hides/rejects through `moderate_review(...)`.
7. `/experts` rating enrichment: public summary badges, city/search/verified filters, trust-aware ranking, and `AggregateRating` schema.

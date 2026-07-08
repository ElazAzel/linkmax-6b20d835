# 0029. Webhooks V2 Architecture

Date: 2026-07-02

## Status

Accepted

## Context

The July 2026 roadmap moves LinkMAX from a page builder with integrations toward a micro-business operating system. Webhooks and the Developer Portal are P0 because external systems must receive business events reliably: leads, bookings, invoices, event registrations, page publication, and form submissions.

Repository intelligence found a V1 foundation, but not a reliable V2 system:

| Area | Already implemented | Partial | Missing |
| --- | --- | --- | --- |
| API keys | `api_keys`, legacy `user_api_keys`, `apiKeysService`, Developer Settings UI | Table contracts drift: UI/service expect `api_keys.name/key_prefix`, older edge functions read `user_api_keys.key/status` | Unified API key verification RPC with scopes |
| Webhook configuration | Page-level `pages.webhook_url`, `pages.webhook_secret`, `integrations.webhook_url` | Single endpoint per page and automation action `send_webhook` | Account/zone-level endpoint registry with event subscriptions |
| Delivery | Inline `fetch` in `create-lead`, inline `fetch` in `run-zone-automations` | Some docs claim signatures/retries | Durable event queue, delivery attempts, retry schedule, manual retry state |
| Security | RLS, Edge Functions, rate limits, service-role background work | `X-LinkMAX-Secret` exists in V1 senders | HMAC-SHA256 signing contract, secret rotation, scoped API keys |
| Developer UX | `DeveloperSettings.tsx`, `ApiKeysManagement` | Some UI state is local only | Status timeline, test event, retry action, signature verification guidance |

## Decision

Extend the existing Developer Platform instead of creating a parallel integration system.

1. `api_keys` becomes the authoritative V2 API key table. Legacy `user_api_keys` remains untouched for compatibility until edge functions are migrated.
2. Page-level `webhook_url` remains as a legacy shortcut, but V2 outgoing webhooks use dedicated endpoint, secret, queue, and delivery tables.
3. Webhook events use a small canonical event catalog aligned with the roadmap.
4. HMAC signing, retry timing, event naming, and scope naming live in typed contracts before UI or dispatcher work expands.
5. The first production iteration is the DB/RPC contract plus typed service/tests. Dispatcher and Developer Settings UI follow as separate vertical slices.

## Product Design

Webhooks V2 lets a solo business connect LinkMAX to external tools without waiting for built-in integrations. The business outcome is platform trust: when a lead, booking, invoice, form, or event registration happens, external systems receive an auditable event.

The UX target is native and operational:

1. User opens Developer Settings.
2. User creates an endpoint, chooses events, copies the signing secret once.
3. User sends a test event.
4. User sees delivery status, response code, error preview, and retry timing.
5. User can rotate the secret or manually retry a failed delivery.

## Database Design

Iteration 1 adds:

- `webhook_endpoints`: user/zone-owned endpoint registry with target URL, event subscriptions, status, failure counters, and timestamps.
- `webhook_secrets`: generated signing secrets with `current`, `previous`, and `revoked` states.
- `webhook_event_queue`: durable event outbox with idempotency key, source entity, status, attempts, and next attempt time.
- `webhook_deliveries`: per-attempt delivery log with response metadata and retry timing.

It also hardens `api_keys` with name, prefix, scopes, expiry, revocation metadata, and API-key RPCs:

- `generate_user_api_key`
- `verify_user_api_key`

RLS remains owner/zone-admin scoped for endpoint visibility, delivery visibility, and queue visibility. Secret rows are service-managed; users receive secrets through create/rotate RPC responses.

## Backend

Future slices should extend this foundation:

- `dispatch-webhook`: selects pending queue rows, finds matching active endpoints, signs payloads, writes delivery attempts, updates endpoint health.
- `retry-webhook-deliveries`: scheduled retry runner using the same delivery logic.
- Existing event producers (`submit-lead`, `submit-booking`, payment webhooks, event registration, page publish, form submit) enqueue canonical events instead of sending inline webhook requests.
- `api-leads` and `api-deals` migrate from `user_api_keys` lookup to `verify_user_api_key` with scopes.

## Frontend

Future UI should extend `DeveloperSettings.tsx` and reuse the current dashboard shell, tabs, cards, badges, and empty/error states. It should not create a second Developer Portal route. The first UI slice should replace local webhook state with V2 endpoint queries and show delivery status.

## Security

- API keys are stored as SHA-256 hashes and returned only once.
- Endpoint URLs must be HTTPS.
- Outgoing deliveries must sign `timestamp.payload` with HMAC-SHA256.
- Endpoint secrets rotate through RPC and are not exposed by ordinary table reads.
- Queue processing runs through service-role edge functions.
- API scopes are explicit: `leads:read`, `leads:write`, `bookings:read`, `bookings:write`, `pages:read`, `analytics:read`, `webhooks:manage`.

## Performance And Scale

- Queue processing uses partial indexes on pending rows and `next_attempt_at`.
- Endpoints use GIN indexing for `event_types`.
- Deliveries are indexed by endpoint and queue row for fast timelines.
- At 100 users, direct queue scanning is enough.
- At 1,000-10,000 users, scheduled workers process batches by `next_attempt_at`.
- At 100,000+ users, queue workers can shard by event ID hash or time window without changing public contracts.
- At 1,000,000 users, the same schema supports outbox partitioning by month/status if volume requires it.

## Technical Iterations

| Iteration | Scope | Files | Rollback |
| --- | --- | --- | --- |
| 1 | DB/RPC foundation, event/signature/retry contract, tests, docs | migrations, `src/services/webhooks.ts`, tests, docs | Drop V2 webhook tables/RPCs; `api_keys` additive columns can remain harmless |
| 2 | Dispatcher edge function and queue processing | `supabase/functions/dispatch-webhook`, shared Deno helper, cron runner | Disable function/cron and leave queued events intact |
| 3 | Producer integration | `submit-lead`, `submit-booking`, payments, events, page publish | Keep V1 inline sends during migration, then disable after parity |
| 4 | Developer Settings UI | Existing `DeveloperSettings.tsx`, hooks/services | Feature flag `developer_portal_v2_enabled` can hide V2 UI |
| 5 | Public API scope migration | `api-leads`, `api-deals`, docs | Fall back to legacy key lookup during migration window |

## Consequences

- LinkMAX keeps a native Developer Portal instead of embedding Svix or another external product.
- Existing page-level webhooks are not broken.
- Delivery reliability can now be built incrementally with durable evidence.
- The codebase gets a single source of truth for event names, scopes, HMAC headers, and retry timing.

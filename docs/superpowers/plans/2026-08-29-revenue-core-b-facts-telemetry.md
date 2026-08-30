# Revenue Core B: Revenue Facts and Telemetry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish server-authoritative service, booking, payment, transition and revenue-event facts that can support the first completed paid appointment.

**Architecture:** Add small pure TypeScript domains first, then forward-only Supabase migrations with state-machine RPCs and immutable payment facts. Existing `product_events` is extended for authoritative revenue projections; public intent remains in the existing analytics ingestion.

**Tech Stack:** TypeScript, Vitest, PostgreSQL/Supabase migrations, Supabase Edge Functions, PostHog projection adapter.

**Spec:** `docs/superpowers/specs/2026-08-29-revenue-core-v1-design.md`

## Global Constraints

- Client code cannot establish payment, completion, refund or no-show facts.
- Money crosses TypeScript boundaries as decimal strings.
- Manual external payment never creates a LinkMAX wallet transaction.
- Past bookings are not auto-completed.
- New `SECURITY DEFINER` functions use a fixed `search_path` and explicit grants.
- New and modified Revenue Core files have zero ESLint warnings.

---

### Task 1: Implement revenue domain primitives

**Files:**
- Create: `src/domain/revenue/service-offering.ts`
- Create: `src/domain/revenue/booking-lifecycle.ts`
- Create: `src/domain/revenue/money.ts`
- Create: `src/domain/revenue/events.ts`
- Create: `src/domain/revenue/__tests__/service-offering.test.ts`
- Create: `src/domain/revenue/__tests__/booking-lifecycle.test.ts`
- Create: `src/domain/revenue/__tests__/money.test.ts`
- Create: `src/domain/revenue/__tests__/events.test.ts`

**Interfaces:**
- Produces: `validateServiceOffering`, `calculateDepositAmount`, `canTransitionBooking`, `parseMoney`, `REVENUE_EVENTS`, `isAuthoritativeRevenueEvent`.
- Consumes: no React or Supabase dependencies.

- [x] **Step 1: Write failing deposit and service validation tests**

```ts
expect(calculateDepositAmount({ mode: 'fixed', value: '2000.00' }, '7000.00')).toBe('2000.00');
expect(calculateDepositAmount({ mode: 'percent', value: '25' }, '7000.00')).toBe('1750.00');
expect(() => calculateDepositAmount({ mode: 'fixed', value: '8000.00' }, '7000.00')).toThrow('deposit_exceeds_price');
expect(validateServiceOffering({ name: '', durationMinutes: 60, priceAmount: '5000.00', currency: 'KZT' }).ok).toBe(false);
```

- [x] **Step 2: Write failing lifecycle and authority tests**

```ts
expect(canTransitionBooking('pending_payment', 'confirmed')).toBe(true);
expect(canTransitionBooking('pending_payment', 'completed')).toBe(false);
expect(canTransitionBooking('completed', 'confirmed', { privilegedCorrection: true })).toBe(true);
expect(isAuthoritativeRevenueEvent('booking_completed')).toBe(true);
expect(isAuthoritativeRevenueEvent('booking_started')).toBe(false);
```

- [x] **Step 3: Run RED**

Run: `npm test -- --run src/domain/revenue`

Expected: FAIL because the domain files do not exist.

- [x] **Step 4: Implement minimal pure domains**

Use integer minor units internally in `money.ts` and return fixed two-decimal strings. Define booking statuses exactly as `pending_payment | confirmed | completed | cancelled | no_show`. Encode allowed transitions as a `Readonly<Record<BookingStatus, readonly BookingStatus[]>>`.

- [x] **Step 5: Verify GREEN and lint**

Run: `npm test -- --run src/domain/revenue`

Run: `npx eslint src/domain/revenue`

- [x] **Step 6: Commit**

```bash
git add src/domain/revenue
git commit -m "feat: add revenue domain contracts"
```

### Task 2: Add service offerings

**Files:**
- Create: `supabase/migrations/20260829120000_revenue_service_offerings.sql`
- Create: `supabase/tests/revenue_service_offerings.test.sql`

**Interfaces:**
- Produces: `service_offerings`, owner policies, public-safe active-offering policy, deposit checks.
- Consumes: `pages`, `auth.users`, `update_updated_at_column()`.

- [x] **Step 1: Write SQL assertions before the migration**

The test transaction creates an owner/page and asserts:

```sql
SELECT throws_ok(
  $$ INSERT INTO public.service_offerings (page_id, owner_id, name_i18n, duration_minutes, price_amount, deposit_mode, deposit_value)
     VALUES (:page_id, :owner_id, '{"ru":"Маникюр"}', 60, 5000, 'fixed', 6000) $$,
  '23514'
);
```

Also assert an anonymous role can select an active offering only for a published page and cannot insert one.

- [ ] **Step 2: Run SQL test and verify RED**

Run: `supabase test db supabase/tests/revenue_service_offerings.test.sql`

Expected: FAIL because the table does not exist.

- [x] **Step 3: Implement migration exactly from spec**

Add table, indexes `(page_id, is_active, display_order)` and `(owner_id, updated_at desc)`, validation function for deposit configuration, timestamp trigger and RLS policies.

- [ ] **Step 4: Run SQL test and schema lint**

Run: `supabase db reset`

Run: `supabase test db supabase/tests/revenue_service_offerings.test.sql`

- [x] **Step 5: Commit**

```bash
git add supabase/migrations/20260829120000_revenue_service_offerings.sql supabase/tests/revenue_service_offerings.test.sql
git commit -m "feat: add normalized service offerings"
```

### Task 3: Add booking lifecycle and payment ledger

**Files:**
- Create: `supabase/migrations/20260829121000_booking_lifecycle_and_payment_ledger.sql`
- Create: `supabase/tests/booking_lifecycle.test.sql`
- Create: `supabase/tests/booking_payments.test.sql`

**Interfaces:**
- Produces: extended `bookings`, `booking_payments`, `booking_status_transitions`, `transition_booking`, `record_manual_booking_payment`, aggregate trigger.
- Consumes: `service_offerings`, existing `bookings`, `is_zone_admin` where organization access exists.

- [x] **Step 1: Write failing lifecycle SQL tests**

Assert that direct status update is rejected, `pending_payment → confirmed` succeeds only after payment/waiver, `confirmed → completed` records payment atomically, duplicate idempotency returns the first result, and stale `expected_version` is rejected.

- [x] **Step 2: Write failing ledger SQL tests**

Insert succeeded deposit `2000.00`, succeeded balance `5000.00`, and succeeded refund `1000.00`; assert booking projections are `paid_amount = 7000.00`, `refunded_amount = 1000.00`, `payment_status = partially_refunded`.

- [ ] **Step 3: Run RED**

Run: `supabase test db supabase/tests/booking_lifecycle.test.sql supabase/tests/booking_payments.test.sql`

Expected: FAIL because the objects do not exist.

- [x] **Step 4: Implement forward migration**

Add spec columns including `version`. Replace booking status/payment checks without rewriting historical payment truth. Create immutable ledger/audit tables, projection trigger and RPCs. Revoke public update access to booking state.

- [x] **Step 5: Disable automatic completion**

Replace `auto_complete_past_bookings` body with an explicit exception `automatic_booking_completion_disabled` and remove all application invocations. Past confirmed appointments remain queryable for owner review.

- [ ] **Step 6: Run GREEN and concurrency test**

Run: `supabase db reset`

Run: `supabase test db supabase/tests/booking_lifecycle.test.sql supabase/tests/booking_payments.test.sql`

Run two concurrent `create_public_booking` fixture calls for the same slot and assert one success plus one `slot_unavailable`.

- [x] **Step 7: Commit**

```bash
git add supabase/migrations/20260829121000_booking_lifecycle_and_payment_ledger.sql supabase/tests/booking_lifecycle.test.sql supabase/tests/booking_payments.test.sql src
git commit -m "feat: enforce booking revenue lifecycle"
```

### Task 4: Harden public booking access

**Files:**
- Create: `supabase/migrations/20260829122000_booking_public_access_hardening.sql`
- Create: `supabase/tests/booking_public_access.test.sql`

**Interfaces:**
- Produces: `get_public_booking_context`, `get_public_availability`, `create_public_booking`, `booking_access_tokens`, `get_booking_by_access_token`, `manage_booking_by_access_token`.
- Consumes: service offerings, booking slots, lifecycle RPCs.

- [x] **Step 1: Write the anonymous RLS test**

Assert anonymous `SELECT client_phone FROM bookings` fails, while `get_public_availability` returns only `slot_date`, `slot_time`, `slot_end_time`, and `available`.

- [x] **Step 2: Write token tests**

Assert valid token returns public-safe context, invalid/expired tokens return error codes, and raw token text is absent from stored rows.

- [ ] **Step 3: Run RED**

Run: `supabase test db supabase/tests/booking_public_access.test.sql`

- [x] **Step 4: Implement safe RPCs and policies**

Drop anonymous raw booking selection/insertion policies. Derive owner, price, deposit and snapshot server-side. Store token hash with `digest(token, 'sha256')`. Cap attribution strings and omit raw URL/query/IP.

- [ ] **Step 5: Verify GREEN**

Run: `supabase db reset`

Run: `supabase test db supabase/tests/booking_public_access.test.sql`

- [x] **Step 6: Commit**

```bash
git add supabase/migrations/20260829122000_booking_public_access_hardening.sql supabase/tests/booking_public_access.test.sql
git commit -m "security: harden public booking access"
```

### Task 5: Add authoritative revenue event projection

**Files:**
- Create: `supabase/migrations/20260829123000_revenue_event_taxonomy_v2.sql`
- Create: `supabase/tests/revenue_events.test.sql`
- Modify: `src/lib/analytics/event-taxonomy.ts`
- Modify: `src/lib/activation-events.ts`
- Modify: `src/services/product-analytics.ts`
- Modify: `src/lib/posthog.ts`
- Modify: `src/services/__tests__/product-analytics.test.ts`

**Interfaces:**
- Produces: v2 event columns, `emit_revenue_product_event`, sanitized `captureRevenueEvent`.
- Consumes: transition/payment triggers and existing `product_events`.

- [x] **Step 1: Write failing event authority tests**

Assert client facade refuses `booking_completed`, permits `booking_started`, strips phone/email/token properties, and server transition emits one `booking_completed` for duplicate mutation replay.

- [ ] **Step 2: Run RED**

Run: `npm test -- --run src/services/__tests__/product-analytics.test.ts src/domain/revenue/__tests__/events.test.ts`

Run: `supabase test db supabase/tests/revenue_events.test.sql`

- [x] **Step 3: Extend product events and trigger projections**

Add `taxonomy_version`, `booking_id`, `service_offering_id`, `actor_type`, and `idempotency_key` with a partial unique index. Update allowed names and make authoritative inserts service-role/system-only.

- [x] **Step 4: Consolidate TypeScript facade**

Public intent calls use v2 event names. Deprecated activation names map to the new facade but never generate authoritative outcomes. PostHog receives pseudonymous IDs and allowlisted properties.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- --run src/domain/revenue src/services/__tests__/product-analytics.test.ts`

Run: `supabase test db supabase/tests/revenue_events.test.sql`

- [x] **Step 6: Commit**

```bash
git add supabase/migrations/20260829123000_revenue_event_taxonomy_v2.sql supabase/tests/revenue_events.test.sql src/domain/revenue src/lib/analytics src/lib/activation-events.ts src/services/product-analytics.ts src/lib/posthog.ts
git commit -m "feat: project authoritative revenue events"
```

### Task 6: Workstream B verification

**Files:**
- Modify: `docs/superpowers/plans/2026-08-29-revenue-core-b-facts-telemetry.md`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: verified revenue-facts foundation.

- [ ] **Step 1: Reset and test database**

Run: `supabase db reset`

Run: `supabase test db`

- [x] **Step 2: Test application contracts**

Run: `npm test -- --run src/domain/revenue src/services/__tests__/product-analytics.test.ts`

Run: `npm run typecheck:strict`

- [ ] **Step 3: Verify security invariants**

Run the anonymous RLS matrix and inspect function grants using `information_schema.routine_privileges`. Confirm no anonymous booking PII select and no `PUBLIC` execute on owner mutation RPCs.

- [ ] **Step 4: Commit plan progress**

```bash
git add docs/superpowers/plans/2026-08-29-revenue-core-b-facts-telemetry.md
git commit -m "docs: record revenue facts completion"
```

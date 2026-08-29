# Revenue Core D: Public Booking Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a recoverable mobile booking flow from service selection through deposit, confirmation and tokenized self-service.

**Architecture:** Replace the monolithic booking block behavior with a pure reducer-driven flow and thin Supabase adapters. The old block component becomes a compatibility wrapper. Server RPCs remain authoritative for availability, booking and state changes.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, React Router, TanStack Query, Supabase Edge Functions and notification queue.

**Spec:** `docs/superpowers/specs/2026-08-29-revenue-core-v1-design.md`

## Global Constraints

- Public booking requires no LinkMAX account.
- Required manual deposits remain pending until owner confirmation.
- Slot collision is atomic and recoverable.
- Customer links contain raw tokens; database, logs, Sentry and PostHog do not.
- Public booking works at 360 px, with keyboard and screen-reader semantics.

---

### Task 1: Define the public booking reducer and API adapter

**Files:**
- Create: `src/components/booking/public-booking-machine.ts`
- Create: `src/components/booking/__tests__/public-booking-machine.test.ts`
- Create: `src/services/booking-lifecycle.ts`
- Create: `src/services/__tests__/booking-lifecycle.test.ts`

**Interfaces:**
- Produces: `publicBookingReducer`, `PublicBookingState`, `createPublicBooking`, `loadPublicAvailability`, `manageBookingWithToken`.
- Consumes: Revenue Core RPC result and error types.

- [ ] **Step 1: Write failing reducer tests**

```ts
expect(reduce(initial, { type: 'SERVICE_SELECTED', service })).toMatchObject({ step: 'slot', service });
expect(reduce(formState, { type: 'SUBMIT_CONFLICT' })).toMatchObject({ step: 'slot', error: 'slot_unavailable' });
expect(reduce(submitting, { type: 'CREATED', status: 'pending_payment' })).toMatchObject({ step: 'deposit', bookingStatus: 'pending_payment' });
```

- [ ] **Step 2: Write failing adapter contract tests**

Assert decimal strings and idempotency key are preserved, owner/price/payment status are never sent by the client, and server error codes map to typed retryability.

- [ ] **Step 3: Run RED**

Run: `npm test -- --run src/components/booking/__tests__/public-booking-machine.test.ts src/services/__tests__/booking-lifecycle.test.ts`

- [ ] **Step 4: Implement minimal reducer and adapters**

Steps are `service | slot | contact | submitting | deposit | confirmed | error`. Reducer has no network or browser dependencies.

- [ ] **Step 5: Verify GREEN and commit**

Run: `npm test -- --run src/components/booking/__tests__/public-booking-machine.test.ts src/services/__tests__/booking-lifecycle.test.ts`

```bash
git add src/components/booking/public-booking-machine.ts src/components/booking/__tests__/public-booking-machine.test.ts src/services/booking-lifecycle.ts src/services/__tests__/booking-lifecycle.test.ts
git commit -m "feat: define public booking state machine"
```

### Task 2: Build the public booking UI

**Files:**
- Create: `src/components/booking/PublicBookingFlow.tsx`
- Create: `src/components/booking/ServiceSelectionStep.tsx`
- Create: `src/components/booking/SlotSelectionStep.tsx`
- Create: `src/components/booking/ContactDetailsStep.tsx`
- Create: `src/components/booking/DepositStateStep.tsx`
- Create: `src/components/booking/BookingConfirmationStep.tsx`
- Create: `src/components/booking/__tests__/PublicBookingFlow.test.tsx`
- Modify: `src/components/blocks/BookingBlock.tsx`

**Interfaces:**
- Produces: `<PublicBookingFlow pageId block linkedServiceId />` and a legacy adapter.
- Consumes: reducer, lifecycle service, existing Calendar/Input/Button components.

- [ ] **Step 1: Write failing no-deposit journey test**

Use real step components with a fake network adapter at the service boundary. Select service/date/slot, enter name+phone, submit and assert confirmed state plus management URL.

- [ ] **Step 2: Write failing manual-deposit language test**

Submit a required Kaspi-manual service and assert the screen contains `Ожидает подтверждения предоплаты` and does not contain `Вы записаны`.

- [ ] **Step 3: Write failing conflict and accessibility tests**

Return `slot_unavailable`, assert focus moves to the error summary and refreshed slots render. Keyboard-select a slot and assert `aria-selected=true`.

- [ ] **Step 4: Run RED**

Run: `npm test -- --run src/components/booking/__tests__/PublicBookingFlow.test.tsx`

- [ ] **Step 5: Implement focused components**

Lazy-load flow when invoked. Preserve entered non-sensitive fields during retry. Remove client-side wallet mutation from `BookingBlock`; ledger facts are server-side only.

- [ ] **Step 6: Verify GREEN, lint and bundle**

Run: `npm test -- --run src/components/booking/__tests__/PublicBookingFlow.test.tsx src/components/blocks/__tests__/BlocksRendering.test.tsx`

Run: `npx eslint src/components/booking src/components/blocks/BookingBlock.tsx`

Run: `npm run build`

- [ ] **Step 7: Commit**

```bash
git add src/components/booking src/components/blocks/BookingBlock.tsx
git commit -m "feat: add recoverable public booking flow"
```

### Task 3: Add tokenized booking management page

**Files:**
- Create: `src/pages/BookingManagement.tsx`
- Create: `src/pages/__tests__/BookingManagement.test.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Produces: `/booking/manage/:token` route with read, confirm, cancel and reschedule actions.
- Consumes: `manageBookingWithToken` and public-safe booking context.

- [ ] **Step 1: Write failing safe-context test**

Render with a valid token response and assert service/date/time/status are shown while internal notes, owner ID and provider payload are absent.

- [ ] **Step 2: Write failing expired-token test**

Return `token_expired`; assert owner contact CTA is rendered and no booking facts are leaked.

- [ ] **Step 3: Write failing reschedule test**

Choose a new slot, send expected booking version plus mutation UUID, and assert refreshed state reflects new local time.

- [ ] **Step 4: Run RED**

Run: `npm test -- --run src/pages/__tests__/BookingManagement.test.tsx`

- [ ] **Step 5: Implement and route page**

Mount before the catch-all `:slug` route. Allowed action buttons come exclusively from server context.

- [ ] **Step 6: Verify and commit**

Run: `npm test -- --run src/pages/__tests__/BookingManagement.test.tsx`

```bash
git add src/pages/BookingManagement.tsx src/pages/__tests__/BookingManagement.test.tsx src/main.tsx
git commit -m "feat: add booking self service"
```

### Task 4: Wire transactional notifications and delivery facts

**Files:**
- Modify: `supabase/functions/send-booking-notification/index.ts`
- Modify: `supabase/functions/send-booking-reminder/index.ts`
- Modify: `supabase/functions/process-notifications/index.ts`
- Create: `supabase/functions/send-booking-notification/index_test.ts`
- Create: `supabase/functions/send-booking-reminder/index_test.ts`
- Create: `supabase/functions/process-notifications/index_test.ts`

**Interfaces:**
- Produces: stable notification payload and idempotency keys; delivery outcome revenue events.
- Consumes: booking management URL and notification queue.

- [ ] **Step 1: Write failing notification contract tests**

Assert owner/customer payloads include `booking_id`, `recipient_role`, `channel`, `template_key`, locale and safe variables; assert phone/email/token are absent from logs/event metadata.

- [ ] **Step 2: Write failing idempotency test**

Schedule the same 24-hour reminder twice and assert one queue row with key `booking:{id}:reminder_24h:{channel}:{window}`.

- [ ] **Step 3: Run RED**

Run: `deno test supabase/functions/send-booking-notification/index_test.ts supabase/functions/send-booking-reminder/index_test.ts supabase/functions/process-notifications/index_test.ts`

- [ ] **Step 4: Implement templates and delivery projection**

Use booking timezone for schedule calculation. A failed notification does not roll back booking. Terminal delivery writes one `reminder_delivered` or operational failure fact.

- [ ] **Step 5: Verify and commit**

Run: `deno test supabase/functions/send-booking-notification/index_test.ts supabase/functions/send-booking-reminder/index_test.ts supabase/functions/process-notifications/index_test.ts`

```bash
git add supabase/functions/send-booking-notification supabase/functions/send-booking-reminder supabase/functions/process-notifications
git commit -m "feat: make booking notifications durable"
```

### Task 5: Workstream D verification

**Files:**
- Modify: `docs/superpowers/plans/2026-08-29-revenue-core-d-booking-lifecycle.md`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: verified public booking lifecycle.

- [ ] **Step 1: Run public-flow test suite**

Run: `npm test -- --run src/components/booking src/pages/__tests__/BookingManagement.test.tsx src/components/blocks/__tests__/BlocksRendering.test.tsx`

- [ ] **Step 2: Run Edge Function tests**

Run: `deno test supabase/functions/send-booking-notification/index_test.ts supabase/functions/send-booking-reminder/index_test.ts supabase/functions/process-notifications/index_test.ts`

- [ ] **Step 3: Run gates**

Run: `npm run typecheck:strict && npm run i18n:check && npm run build`

- [ ] **Step 4: Commit plan progress**

```bash
git add docs/superpowers/plans/2026-08-29-revenue-core-d-booking-lifecycle.md
git commit -m "docs: record booking lifecycle completion"
```

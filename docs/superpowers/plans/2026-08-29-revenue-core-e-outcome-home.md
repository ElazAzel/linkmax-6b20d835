# Revenue Core E: Outcome Home and Operations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the creator dashboard explain completed paid outcomes, operational risks and the single next action that advances revenue.

**Architecture:** Compute all totals in one authorization-aware database RPC, expose it through one TanStack Query hook, and compose small dashboard components behind `outcome_home_v1`. Next-best-action selection is a pure deterministic domain function.

**Tech Stack:** PostgreSQL/Supabase, TypeScript, TanStack Query, React 18, Vitest, Testing Library, Recharts where existing Insights charts are reused.

**Spec:** `docs/superpowers/specs/2026-08-29-revenue-core-v1-design.md`

## Global Constraints

- Outcome Home uses ledger and booking facts, not PostHog totals.
- Decimal amounts are returned as strings.
- Home renders exactly one outcome strip and one next action.
- Claims use observed account data, never universal uplift percentages.
- Existing Home remains available when the feature flag is off.

---

### Task 1: Implement deterministic next-best-action rules

**Files:**
- Create: `src/domain/revenue/next-best-action.ts`
- Create: `src/domain/revenue/__tests__/next-best-action.test.ts`

**Interfaces:**
- Produces: `selectRevenueNextAction(input): RevenueNextAction`.
- Consumes: literal readiness/operation counts, no React or Supabase.

- [x] **Step 1: Write failing priority-table tests**

```ts
expect(selectRevenueNextAction({ hasKit: false, ...healthy })).toMatchObject({ id: 'start_revenue_kit' });
expect(selectRevenueNextAction({ ...healthy, pendingPaymentCount: 2 })).toMatchObject({ id: 'confirm_pending_deposit' });
expect(selectRevenueNextAction({ ...healthy, pastAppointmentsNeedingReview: 1 })).toMatchObject({ id: 'review_past_appointments' });
expect(selectRevenueNextAction(healthy)).toMatchObject({ id: 'open_outcome_insights' });
```

- [x] **Step 2: Run RED**

Run: `npm test -- --run src/domain/revenue/__tests__/next-best-action.test.ts`

- [x] **Step 3: Implement ordered pure rules**

Return one item with stable `id`, `href`, and `reasonCode`; do not return arrays or AI-generated text.

- [x] **Step 4: Verify GREEN and commit**

Run: `npm test -- --run src/domain/revenue/__tests__/next-best-action.test.ts`

```bash
git add src/domain/revenue/next-best-action.ts src/domain/revenue/__tests__/next-best-action.test.ts
git commit -m "feat: choose deterministic revenue actions"
```

### Task 2: Add the outcome summary RPC

**Files:**
- Create: `supabase/migrations/20260829125000_revenue_outcome_summary.sql`
- Create: `supabase/tests/revenue_outcome_summary.test.sql`

**Interfaces:**
- Produces: `get_revenue_outcome_summary(page_id, from, to)` matching `RevenueOutcomeSummary`.
- Consumes: bookings, payment projections, service offerings and attribution snapshots.

- [x] **Step 1: Write failing fixture totals test**

Create one paid completed booking, one fully refunded completed booking, one free completed booking, one no-show and one pending-payment booking. Assert paid count `1`, free count `1`, no-show count `1`, pending count `1`, and net collected equals the non-refunded paid booking.

- [x] **Step 2: Write failing authorization and source tests**

Assert another owner receives permission error; assert source grouping uses `unknown` when attribution source is absent.

- [ ] **Step 3: Run RED**

Run: `supabase test db supabase/tests/revenue_outcome_summary.test.sql`

- [x] **Step 4: Implement stable JSON contract**

Use page timezone for period boundaries and `numeric::text` for amounts. Mark the latest seven completion days provisional in the response metadata.

Static SQL contract verification is green. Steps 3 and 5 retain their database gate because this machine cannot start the Supabase PostgreSQL stack until WSL2 is available.

- [ ] **Step 5: Verify GREEN and commit**

Run: `supabase db reset && supabase test db supabase/tests/revenue_outcome_summary.test.sql`

```bash
git add supabase/migrations/20260829125000_revenue_outcome_summary.sql supabase/tests/revenue_outcome_summary.test.sql
git commit -m "feat: aggregate revenue outcomes"
```

### Task 3: Add outcome service and hook

**Files:**
- Create: `src/services/revenue-outcomes.ts`
- Create: `src/services/__tests__/revenue-outcomes.test.ts`
- Create: `src/hooks/revenue/useRevenueOutcomeSummary.ts`
- Create: `src/hooks/revenue/__tests__/useRevenueOutcomeSummary.test.tsx`

**Interfaces:**
- Produces: `fetchRevenueOutcomeSummary` and `useRevenueOutcomeSummary({ pageId, from, to })`.
- Consumes: outcome RPC and TanStack Query.

- [x] **Step 1: Write failing response-validation test**

Return malformed numeric values and assert `invalid_outcome_summary`; return a complete literal fixture and assert exact normalized contract.

- [x] **Step 2: Write failing query-state test**

Assert disabled query when page ID is absent, literal query key when present, and invalidation after a booking operation.

The disabled/key contract is covered here; outcome invalidation is exercised with the booking mutation in Task 5.

- [x] **Step 3: Run RED**

Run: `npm test -- --run src/services/__tests__/revenue-outcomes.test.ts src/hooks/revenue/__tests__/useRevenueOutcomeSummary.test.tsx`

- [x] **Step 4: Implement adapter and hook**

No client-side recomputation of money totals. Keep the last successful summary during background refresh.

- [x] **Step 5: Verify GREEN and commit**

Run: `npm test -- --run src/services/__tests__/revenue-outcomes.test.ts src/hooks/revenue/__tests__/useRevenueOutcomeSummary.test.tsx`

```bash
git add src/services/revenue-outcomes.ts src/services/__tests__/revenue-outcomes.test.ts src/hooks/revenue
git commit -m "feat: query revenue outcomes"
```

### Task 4: Build outcome Home components

**Files:**
- Create: `src/components/dashboard-v2/revenue/OutcomeStrip.tsx`
- Create: `src/components/dashboard-v2/revenue/NextRevenueAction.tsx`
- Create: `src/components/dashboard-v2/revenue/AttentionQueue.tsx`
- Create: `src/components/dashboard-v2/revenue/__tests__/OutcomeHome.test.tsx`
- Modify: `src/components/dashboard-v2/screens/HomeScreen.tsx`
- Modify: `src/pages/DashboardV2.tsx`

**Interfaces:**
- Produces: outcome-first composition behind `outcome_home_v1`.
- Consumes: outcome hook, feature flags and dashboard navigation callbacks.

- [x] **Step 1: Write failing unique-composition test**

Assert exactly one `revenue-outcome-strip`, one `revenue-next-action`, and one attention queue. Assert page views/SEO details appear only below the operational section.

- [x] **Step 2: Write failing empty/new-user state test**

With no kit and no outcomes, assert primary CTA is `Настроить запись`, not a zero-heavy financial dashboard.

- [x] **Step 3: Write failing pending/past operations test**

With pending deposits and past confirmed appointments, assert the higher-priority pending-deposit action and both operational groups in the queue.

- [x] **Step 4: Run RED**

Run: `npm test -- --run src/components/dashboard-v2/revenue/__tests__/OutcomeHome.test.tsx`

- [x] **Step 5: Implement small real components and flag composition**

Reuse existing Card/Button/Badge and typography tokens. Do not introduce a new dashboard style. Flag-off renders existing Home.

- [x] **Step 6: Verify GREEN and commit**

Run: `npm test -- --run src/components/dashboard-v2/revenue/__tests__/OutcomeHome.test.tsx src/pages/__tests__/Dashboard.test.tsx`

```bash
git add src/components/dashboard-v2/revenue src/components/dashboard-v2/screens/HomeScreen.tsx src/pages/DashboardV2.tsx
git commit -m "feat: make dashboard outcome first"
```

### Task 5: Add booking operations and detail drawer

**Files:**
- Create: `src/hooks/revenue/useBookingOperations.ts`
- Create: `src/hooks/revenue/__tests__/useBookingOperations.test.tsx`
- Create: `src/components/dashboard-v2/revenue/BookingDetailDrawer.tsx`
- Create: `src/components/dashboard-v2/revenue/__tests__/BookingDetailDrawer.test.tsx`
- Modify: `src/components/dashboard-v2/screens/ActivityScreen.tsx`

**Interfaces:**
- Produces: owner payment/transition mutations with UUID idempotency and optimistic version, state-aware drawer.
- Consumes: lifecycle service and outcome query invalidation.

- [x] **Step 1: Write failing operation mutation tests**

Assert completion sends amount/method/expected version, creates one mutation UUID, and invalidates booking plus outcome queries after success. Assert retries reuse the same UUID.

- [x] **Step 2: Write failing allowed-action tests**

Pending payment shows confirm/waive/cancel; confirmed past shows complete/no-show; completed shows no destructive primary action and displays history.

- [x] **Step 3: Run RED**

Run: `npm test -- --run src/hooks/revenue/__tests__/useBookingOperations.test.tsx src/components/dashboard-v2/revenue/__tests__/BookingDetailDrawer.test.tsx`

- [x] **Step 4: Implement hook, drawer and Activity integration**

Render service snapshot, local time, deposit/balance facts, transition history, attribution source and notification delivery state. Never render raw token/provider payload.

- [x] **Step 5: Verify GREEN and commit**

Run: `npm test -- --run src/hooks/revenue/__tests__/useBookingOperations.test.tsx src/components/dashboard-v2/revenue/__tests__/BookingDetailDrawer.test.tsx`

```bash
git add src/hooks/revenue src/components/dashboard-v2/revenue src/components/dashboard-v2/screens/ActivityScreen.tsx
git commit -m "feat: add booking revenue operations"
```

### Task 6: Add revenue insights

**Files:**
- Create: `src/components/dashboard-v2/analytics/RevenueFunnel.tsx`
- Create: `src/components/dashboard-v2/analytics/RevenueBySource.tsx`
- Create: `src/components/dashboard-v2/analytics/__tests__/RevenueInsights.test.tsx`
- Modify: `src/components/dashboard-v2/screens/InsightsScreen.tsx`

**Interfaces:**
- Produces: source → service → booking → paid → completed funnel and net-collected source table.
- Consumes: outcome summary and existing traffic analytics.

- [ ] **Step 1: Write failing funnel test**

Using literal counts, assert steps render in required order and rate denominators never divide by zero.

- [ ] **Step 2: Write failing source table test**

Assert `unknown` is displayed honestly and KZT values come from server decimal strings.

- [ ] **Step 3: Run RED**

Run: `npm test -- --run src/components/dashboard-v2/analytics/__tests__/RevenueInsights.test.tsx`

- [ ] **Step 4: Implement and replace unsupported recommendation copy**

Keep traffic overview available below Revenue. Do not show percentage uplift unless produced by a configured experiment with sample metadata.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- --run src/components/dashboard-v2/analytics/__tests__/RevenueInsights.test.tsx`

```bash
git add src/components/dashboard-v2/analytics src/components/dashboard-v2/screens/InsightsScreen.tsx
git commit -m "feat: add revenue outcome insights"
```

### Task 7: Workstream E verification

**Files:**
- Modify: `docs/superpowers/plans/2026-08-29-revenue-core-e-outcome-home.md`

**Interfaces:**
- Consumes: Tasks 1–6.
- Produces: verified outcome-first owner experience.

- [ ] **Step 1: Run outcome tests**

Run: `npm test -- --run src/domain/revenue/__tests__/next-best-action.test.ts src/services/__tests__/revenue-outcomes.test.ts src/hooks/revenue src/components/dashboard-v2/revenue src/components/dashboard-v2/analytics/__tests__/RevenueInsights.test.tsx`

- [ ] **Step 2: Run database summary tests**

Run: `supabase test db supabase/tests/revenue_outcome_summary.test.sql`

- [ ] **Step 3: Run full application gates**

Run: `npm test -- --run`

Run: `npm run typecheck:strict && npm run i18n:check && npm run lint:ratchet && npm run build`

- [ ] **Step 4: Commit plan progress**

```bash
git add docs/superpowers/plans/2026-08-29-revenue-core-e-outcome-home.md
git commit -m "docs: record outcome home completion"
```

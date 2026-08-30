# Revenue Core C: Beauty Revenue Kit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a solo nail, lash or brow specialist configure and publish a revenue-ready page through a resumable six-step flow.

**Architecture:** Define an immutable beauty manifest and pure preset builders, persist server drafts and apply the kit transactionally through one RPC. The wizard composes existing UI primitives and page blocks while normalized offerings remain authoritative.

**Tech Stack:** React 18, TypeScript, TanStack Query, i18next, Vitest, Testing Library, Supabase RPCs and native feature flags.

**Spec:** `docs/superpowers/specs/2026-08-29-revenue-core-v1-design.md`

## Global Constraints

- Only `nails`, `lashes`, and `brows` enter Beauty Revenue Kit v1.
- KZT is the kit currency and `Asia/Almaty` is the default timezone.
- The advanced editor remains available and unrelated blocks are preserved.
- Reapplying the kit never deletes inactive historical offerings.
- RU/KK/EN golden-path copy must contain no raw translation keys.

---

### Task 1: Define manifest and presets

**Files:**
- Create: `src/domain/revenue-kits/beauty-v1.ts`
- Create: `src/domain/revenue-kits/__tests__/beauty-v1.test.ts`

**Interfaces:**
- Produces: `BEAUTY_REVENUE_KIT`, `createBeautyPreset(niche)`, `RevenueKitDraft`.
- Consumes: revenue service-offering types.

- [x] **Step 1: Write failing manifest tests**

```ts
expect(BEAUTY_REVENUE_KIT.id).toBe('beauty-v1');
expect(BEAUTY_REVENUE_KIT.requiredBlockTypes).toEqual(['profile', 'pricing', 'booking', 'messenger']);
expect(createBeautyPreset('nails').services).toEqual(expect.arrayContaining([
  expect.objectContaining({ durationMinutes: 90, currency: 'KZT' }),
]));
expect(() => createBeautyPreset('coach' as never)).toThrow('unsupported_beauty_niche');
```

- [x] **Step 2: Run RED**

Run: `npm test -- --run src/domain/revenue-kits`

- [x] **Step 3: Implement immutable manifest and hand-checked presets**

Create three preset sets with realistic but explicitly editable prices/durations. Preset IDs are stable; user edits create offering values rather than mutate constants.

- [x] **Step 4: Run GREEN and lint**

Run: `npm test -- --run src/domain/revenue-kits`

Run: `npx eslint src/domain/revenue-kits`

- [x] **Step 5: Commit**

```bash
git add src/domain/revenue-kits
git commit -m "feat: define beauty revenue kit"
```

### Task 2: Add server draft and transactional apply RPC

**Files:**
- Create: `supabase/migrations/20260829124000_beauty_revenue_kit_rpc_and_flags.sql`
- Create: `supabase/tests/beauty_revenue_kit.test.sql`
- Create: `src/services/revenue-kit.ts`
- Create: `src/services/__tests__/revenue-kit.test.ts`

**Interfaces:**
- Produces: `revenue_kit_drafts`, `save_revenue_kit_draft`, `apply_revenue_kit_v1`, `loadRevenueKitDraft`, `applyRevenueKit`.
- Consumes: offerings, pages, blocks and feature flags.

- [x] **Step 1: Write failing SQL behavior tests**

Assert applying a valid draft creates offerings plus one linked pricing block and one linked booking block, applying twice is idempotent, and an unrelated text block remains unchanged.

- [x] **Step 2: Write failing service adapter tests**

Test that `applyRevenueKit(pageId, draft, mutationId)` sends exact RPC fields and returns typed offering/block IDs; malformed server response returns `invalid_response`.

- [ ] **Step 3: Run RED**

Run: `supabase test db supabase/tests/beauty_revenue_kit.test.sql`

Run: `npm test -- --run src/services/__tests__/revenue-kit.test.ts`

- [x] **Step 4: Implement migration and adapter**

Draft rows are owner-readable, keyed by `(user_id, page_id, kit_id)`, and store current step plus validated JSON. RPC validates ownership, uses one transaction, upserts by stable kit IDs and emits `revenue_kit_applied` once.

- [ ] **Step 5: Verify GREEN**

Run: `supabase db reset && supabase test db supabase/tests/beauty_revenue_kit.test.sql`

Run: `npm test -- --run src/services/__tests__/revenue-kit.test.ts`

- [x] **Step 6: Commit**

```bash
git add supabase/migrations/20260829124000_beauty_revenue_kit_rpc_and_flags.sql supabase/tests/beauty_revenue_kit.test.sql src/services/revenue-kit.ts src/services/__tests__/revenue-kit.test.ts
git commit -m "feat: persist and apply revenue kits"
```

### Task 3: Add wizard state hook

**Files:**
- Create: `src/hooks/revenue/useRevenueKit.ts`
- Create: `src/hooks/revenue/__tests__/useRevenueKit.test.tsx`

**Interfaces:**
- Produces: `useRevenueKit({ pageId })` with `draft`, `step`, `saveStep`, `apply`, `isSaving`, `error`.
- Consumes: `revenue-kit.ts` service and TanStack Query.

- [x] **Step 1: Write failing resume test**

Render the hook with a real QueryClient, return a saved draft at step `availability`, and assert the hook exposes that step rather than restarting at identity.

- [x] **Step 2: Write failing save serialization test**

Call `saveStep('services', literalDraft)` and assert the service receives a complete draft with version `1` and no UI-only fields.

- [x] **Step 3: Run RED**

Run: `npm test -- --run src/hooks/revenue/__tests__/useRevenueKit.test.tsx`

- [x] **Step 4: Implement minimal query/mutation hook**

Use query key `['revenue-kit', pageId, 'beauty-v1']`; invalidate page, offerings and kit queries after apply.

- [x] **Step 5: Verify GREEN and commit**

Run: `npm test -- --run src/hooks/revenue/__tests__/useRevenueKit.test.tsx`

```bash
git add src/hooks/revenue
git commit -m "feat: add resumable revenue kit state"
```

### Task 4: Build the six-step wizard

**Files:**
- Create: `src/components/onboarding/revenue-kit/RevenueKitWizard.tsx`
- Create: `src/components/onboarding/revenue-kit/IdentityStep.tsx`
- Create: `src/components/onboarding/revenue-kit/ServicesStep.tsx`
- Create: `src/components/onboarding/revenue-kit/AvailabilityStep.tsx`
- Create: `src/components/onboarding/revenue-kit/DepositPolicyStep.tsx`
- Create: `src/components/onboarding/revenue-kit/TrustPreviewStep.tsx`
- Create: `src/components/onboarding/revenue-kit/PublishDistributeStep.tsx`
- Create: `src/components/onboarding/revenue-kit/__tests__/RevenueKitWizard.test.tsx`

**Interfaces:**
- Produces: feature-flagged guided setup UI.
- Consumes: `useRevenueKit`, existing form primitives, editor preview and publish callbacks.

- [ ] **Step 1: Write failing identity/services flow test**

Render the real wizard, enter identity, continue, choose nails presets, edit one literal price and assert the saved draft contains that price as a decimal string.

- [ ] **Step 2: Write failing validation tests**

Assert no active service blocks progression, invalid working-hour range blocks progression, fixed deposit above price blocks progression, and missing payment instruction blocks manual-deposit progression.

- [ ] **Step 3: Write failing resume/publish test**

Start with persisted `trust-preview`; assert earlier data is present, apply succeeds once, and publish CTA receives returned page/block IDs.

- [ ] **Step 4: Run RED**

Run: `npm test -- --run src/components/onboarding/revenue-kit/__tests__/RevenueKitWizard.test.tsx`

- [ ] **Step 5: Implement the shell and focused step components**

Every step owns only its inputs and validation message. The shell owns navigation, persistence and submit. Preview uses the existing design system inside a fixed 360 px viewport; no new visual language is introduced.

- [ ] **Step 6: Add RU/KK/EN keys and verify**

Run: `npm run i18n:check`

Run: `npm test -- --run src/components/onboarding/revenue-kit/__tests__/RevenueKitWizard.test.tsx`

- [ ] **Step 7: Commit**

```bash
git add src/components/onboarding/revenue-kit src/i18n/locales/ru.json src/i18n/locales/kk.json src/i18n/locales/en.json
git commit -m "feat: add beauty revenue kit wizard"
```

### Task 5: Integrate flags and linked block types

**Files:**
- Modify: `src/pages/DashboardV2.tsx`
- Modify: `src/types/blocks/commerce.ts`
- Modify: `src/components/block-editors/BookingBlockEditor.tsx`
- Modify: `src/components/blocks/PricingBlock.tsx`
- Modify: `src/services/feature-flags.ts`
- Create: `src/pages/__tests__/Dashboard.revenue-kit.test.tsx`

**Interfaces:**
- Produces: `serviceOfferingId?: string` on pricing items, `serviceOfferingIds?: string[]` on booking blocks, cohort-specific first-run wizard.
- Consumes: native feature flag evaluation and current dashboard onboarding state.

- [ ] **Step 1: Write failing flag-off compatibility test**

Assert existing `AIBuilderWizard` remains selected when `beauty_revenue_kit_v1` is false.

- [ ] **Step 2: Write failing flag-on cohort test**

Assert a nails user with the flag sees `RevenueKitWizard`, while an expert user with the same flag remains on the existing wizard.

- [ ] **Step 3: Run RED**

Run: `npm test -- --run src/pages/__tests__/Dashboard.revenue-kit.test.tsx`

- [ ] **Step 4: Implement feature-gated composition and block linkage**

Do not change the default catch-all route. Pricing CTA passes the offering ID into the booking flow; unlinked legacy items retain their current behavior.

- [ ] **Step 5: Verify and commit**

Run: `npm test -- --run src/pages/__tests__/Dashboard.revenue-kit.test.tsx src/components/blocks/__tests__/BlocksRendering.test.tsx`

Run: `npm run typecheck:strict`

```bash
git add src/pages/DashboardV2.tsx src/pages/__tests__/Dashboard.revenue-kit.test.tsx src/types/blocks/commerce.ts src/components/block-editors/BookingBlockEditor.tsx src/components/blocks/PricingBlock.tsx src/services/feature-flags.ts
git commit -m "feat: integrate beauty revenue kit"
```

### Task 6: Workstream C verification

**Files:**
- Modify: `docs/superpowers/plans/2026-08-29-revenue-core-c-beauty-kit.md`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: pilot-ready, feature-flagged kit.

- [ ] **Step 1: Run all kit tests**

Run: `npm test -- --run src/domain/revenue-kits src/services/__tests__/revenue-kit.test.ts src/hooks/revenue/__tests__/useRevenueKit.test.tsx src/components/onboarding/revenue-kit src/pages/__tests__/Dashboard.revenue-kit.test.tsx`

- [ ] **Step 2: Run database and application gates**

Run: `supabase test db supabase/tests/beauty_revenue_kit.test.sql`

Run: `npm run typecheck:strict && npm run i18n:check && npm run build`

- [ ] **Step 3: Commit plan progress**

```bash
git add docs/superpowers/plans/2026-08-29-revenue-core-c-beauty-kit.md
git commit -m "docs: record beauty kit completion"
```

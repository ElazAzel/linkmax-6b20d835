# Revenue Core A: Production Trust Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make LinkMAX's public conversion path internally consistent, canonical, duplicate-free, and safe to use as the entry point for Revenue Core.

**Architecture:** Centralize exact charge totals in the billing domain and derive display-only monthly prices, add an edge-level permanent demo redirect plus an in-app fallback before the catch-all public-page route, and protect key surfaces with behavior-based tests. Existing page rendering and dashboard composition remain intact except for targeted duplicate/copy fixes.

**Tech Stack:** React 18, TypeScript, React Router 6, Vitest, Testing Library, Vite, ESLint, i18next.

**Spec:** `docs/superpowers/specs/2026-08-29-revenue-core-v1-design.md`

## Global Constraints

- Canonical demo URL is `/demo-nails`; `/demo_nails` permanently redirects to it.
- Revenue Core v1 does not change prices or commission rates.
- RU and KK are release-blocking; EN must not regress.
- New and modified Revenue Core files must have zero ESLint warnings.
- Unsupported universal conversion-uplift claims are not displayed.
- Existing advanced modules remain available.

---

### Task 1: Centralize the billing catalog

**Files:**
- Create: `src/domain/billing/catalog.ts`
- Create: `src/domain/billing/__tests__/catalog.test.ts`
- Modify: `src/domain/billing/tiers.ts`
- Modify: `src/hooks/useCurrencyRate.ts`
- Modify: `src/components/landing/SimplePricingSection.tsx`
- Modify: `src/components/landing/SEOLandingHead.tsx`

**Interfaces:**
- Produces: `BILLING_CATALOG`, `BillingPeriodMonths`, `getProPrice(period)`, `getPlanCommissionRate(tier)`.
- Consumes: existing `AppPremiumTier` and `DatabasePremiumTier` names.

- [ ] **Step 1: Write the failing billing catalog tests**

```ts
import { describe, expect, it } from 'vitest';
import { getPlanCommissionRate, getProPrice } from '../catalog';

describe('billing catalog', () => {
  it('returns hand-checked KZT totals for every billing period', () => {
    expect(getProPrice(3)).toEqual({ months: 3, monthlyKzt: 4350, totalKzt: 13050 });
    expect(getProPrice(6)).toEqual({ months: 6, monthlyKzt: 3698, totalKzt: 22185 });
    expect(getProPrice(12)).toEqual({ months: 12, monthlyKzt: 3045, totalKzt: 36540 });
  });

  it('keeps current commission policy unchanged', () => {
    expect(getPlanCommissionRate('identity')).toBe(0);
    expect(getPlanCommissionRate('starter')).toBe(0.07);
    expect(getPlanCommissionRate('pro')).toBe(0.01);
    expect(getPlanCommissionRate('business')).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run src/domain/billing/__tests__/catalog.test.ts`

Expected: FAIL because `../catalog` does not exist.

- [ ] **Step 3: Implement the minimal catalog**

```ts
export type BillingPeriodMonths = 3 | 6 | 12;

const PRO_TOTAL_KZT = { 3: 13050, 6: 22185, 12: 36540 } as const;

const COMMISSION = { identity: 0, free: 0, starter: 0.07, pro: 0.01, business: 0 } as const;

export function getProPrice(period: BillingPeriodMonths) {
  const totalKzt = PRO_TOTAL_KZT[period];
  return { months: period, monthlyKzt: Math.round(totalKzt / period), totalKzt };
}

export function getPlanCommissionRate(tier: keyof typeof COMMISSION): number {
  return COMMISSION[tier];
}
```

- [ ] **Step 4: Replace duplicated runtime constants**

Use `getProPrice()` in `useCurrencyRate.ts`, `SimplePricingSection.tsx`, and SEO structured data. Make `tiers.ts` delegate to `getPlanCommissionRate()` while preserving its public API.

- [ ] **Step 5: Run focused tests and lint**

Run: `npm test -- --run src/domain/billing/__tests__/catalog.test.ts src/services/__tests__/user.test.ts src/services/__tests__/fintech.test.ts`

Run: `npx eslint src/domain/billing/catalog.ts src/domain/billing/__tests__/catalog.test.ts src/domain/billing/tiers.ts src/hooks/useCurrencyRate.ts src/components/landing/SimplePricingSection.tsx src/components/landing/SEOLandingHead.tsx`

Expected: all tests pass; ESLint exits 0 with no output for errors.

- [ ] **Step 6: Commit**

```bash
git add src/domain/billing src/hooks/useCurrencyRate.ts src/components/landing/SimplePricingSection.tsx src/components/landing/SEOLandingHead.tsx
git commit -m "refactor: centralize billing catalog"
```

### Task 2: Canonicalize the demo route

**Files:**
- Create: `src/components/routing/CanonicalDemoRedirect.tsx`
- Create: `src/components/routing/__tests__/CanonicalDemoRedirect.test.tsx`
- Create: `cloudflare-worker/__tests__/canonical-demo-redirect.test.ts`
- Modify: `src/main.tsx`
- Modify: `cloudflare-worker/prerender-worker.js`
- Modify: `docs/gtm/FOUNDER_GTM_PLAYBOOK.md`
- Modify: `scripts/generate-sitemap.mjs`

**Interfaces:**
- Produces: an HTTP 301 at the Cloudflare edge and `<CanonicalDemoRedirect />` as an origin/preview fallback, mounted at `demo_nails` before `:slug`.
- Consumes: the production Cloudflare Worker, React Router `Navigate`, and current router definition.

- [ ] **Step 1: Write the failing redirect test**

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CanonicalDemoRedirect } from '../CanonicalDemoRedirect';

it('resolves the legacy demo path to the canonical path in-app', () => {
  render(
    <MemoryRouter initialEntries={['/demo_nails']}>
      <Routes>
        <Route path="demo_nails" element={<CanonicalDemoRedirect />} />
        <Route path="demo-nails" element={<div>canonical-demo</div>} />
      </Routes>
    </MemoryRouter>,
  );
  expect(screen.getByText('canonical-demo')).toBeInTheDocument();
});
```

Add a worker contract test that calls the exported worker `fetch()` handler with `https://lnkmx.my/demo_nails?utm_source=test` and expects status `301` plus `Location: https://lnkmx.my/demo-nails?utm_source=test`. This is the authoritative permanent-redirect assertion; the React test only covers the SPA fallback.

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run src/components/routing/__tests__/CanonicalDemoRedirect.test.tsx cloudflare-worker/__tests__/canonical-demo-redirect.test.ts`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement and mount the redirect**

```tsx
import { Navigate } from 'react-router-dom';

export function CanonicalDemoRedirect() {
  return <Navigate to="/demo-nails" replace />;
}
```

Before any environment-dependent branch in `handleRequest()`, return `Response.redirect()` with status `301` when the platform-domain pathname is exactly `/demo_nails`, preserving the query string. Add `{ path: "demo_nails", element: <CanonicalDemoRedirect /> }` before `{ path: ":slug", ... }` in `main.tsx` as a fallback for previews or origin access that bypasses the Worker. Update GTM and sitemap generation to emit only `/demo-nails`.

- [ ] **Step 4: Verify route behavior**

Run: `npm test -- --run src/components/routing/__tests__/CanonicalDemoRedirect.test.tsx cloudflare-worker/__tests__/canonical-demo-redirect.test.ts`

Run: `npm run build`

Expected: test and build exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/components/routing src/main.tsx cloudflare-worker/prerender-worker.js cloudflare-worker/__tests__ docs/gtm/FOUNDER_GTM_PLAYBOOK.md scripts/generate-sitemap.mjs public/sitemap.xml
git commit -m "fix: canonicalize demo route"
```

### Task 3: Remove unsupported claims and duplicate dashboard regions

**Files:**
- Create: `src/components/dashboard-v2/screens/__tests__/HomeScreen.regression.test.tsx`
- Modify: `src/components/dashboard-v2/screens/HomeScreen.tsx`
- Modify: `src/components/analytics/AIInsightsPanel.tsx`
- Modify: `src/components/dashboard-v2/screens/InsightsScreen.tsx`
- Modify: `src/i18n/locales/ru.json`
- Modify: `src/i18n/locales/kk.json`
- Modify: `src/i18n/locales/en.json`

**Interfaces:**
- Produces: one `data-testid="home-performance-region"` and one `data-testid="home-next-action-region"` per Home render.
- Consumes: current Home props and current analytics hooks.

- [ ] **Step 1: Write a regression test that catches duplicate regions**

Create a realistic `PageData` fixture and render the real `HomeScreen` with query/auth providers. Assert:

```tsx
expect(screen.getAllByTestId('home-performance-region')).toHaveLength(1);
expect(screen.getAllByTestId('home-next-action-region')).toHaveLength(1);
expect(screen.queryByText(/получают на 40%/i)).not.toBeInTheDocument();
expect(screen.queryByText(/повышают.*25%/i)).not.toBeInTheDocument();
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- --run src/components/dashboard-v2/screens/__tests__/HomeScreen.regression.test.tsx`

Expected: FAIL because regions are not uniquely identified and unsupported claims are still reachable.

- [ ] **Step 3: Make Home composition unique**

Wrap the sole metrics/funnel composition in `home-performance-region`. Render one deterministic recommendation region and remove the second composition path that currently repeats widgets in full-page production captures.

- [ ] **Step 4: Replace universal uplift copy**

Use neutral RU/KK/EN copy: `Добавьте цены, чтобы клиент мог принять решение до обращения`, `Добавьте проверенные отзывы после завершённых записей`, and `Добавьте форму или запись, чтобы принимать обращения`.

- [ ] **Step 5: Verify component tests and lint**

Run: `npm test -- --run src/components/dashboard-v2/screens/__tests__/HomeScreen.regression.test.tsx src/pages/__tests__/Dashboard.test.tsx`

Run: `npx eslint src/components/dashboard-v2/screens/HomeScreen.tsx src/components/analytics/AIInsightsPanel.tsx src/components/dashboard-v2/screens/InsightsScreen.tsx src/components/dashboard-v2/screens/__tests__/HomeScreen.regression.test.tsx`

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard-v2 src/components/analytics src/i18n/locales/ru.json src/i18n/locales/kk.json src/i18n/locales/en.json
git commit -m "fix: remove duplicated outcome regions"
```

### Task 4: Establish the quality ratchet

**Files:**
- Modify: `src/components/dashboard-v2/widgets/DigitalGoodsManager.tsx`
- Create: `scripts/eslint-warning-ratchet.mjs`
- Create: `scripts/__tests__/eslint-warning-ratchet.test.mjs`
- Modify: `package.json`
- Modify: `config/quality-baseline.json`

**Interfaces:**
- Produces: `npm run lint:ratchet`, which fails when the total warning count increases above the committed baseline and always fails on errors.
- Consumes: ESLint JSON formatter output.

- [ ] **Step 1: Write the failing ratchet script test**

Use a temporary JSON fixture containing one error and two warnings. Invoke the script with `--input fixture --max-warnings 2` and assert non-zero exit because errors are never allowed. Use a second warning-only fixture with three warnings and assert non-zero exit above the baseline.

- [ ] **Step 2: Run and verify RED**

Run: `node --test scripts/__tests__/eslint-warning-ratchet.test.mjs`

Expected: FAIL because the script does not exist.

- [ ] **Step 3: Implement the parser and fix the current lint error**

The script sums `errorCount` and `warningCount` from ESLint JSON. Remove the unnecessary escape in `DigitalGoodsManager.tsx` so error count becomes zero.

- [ ] **Step 4: Add package scripts**

```json
"lint:json": "eslint . -f json -o tmp/eslint-results.json",
"lint:ratchet": "npm run lint:json && node scripts/eslint-warning-ratchet.mjs --input tmp/eslint-results.json --max-warnings 1238"
```

Update `quality:check` to invoke `lint:ratchet` instead of the unbounded lint command.

- [ ] **Step 5: Verify quality behavior**

Run: `node --test scripts/__tests__/eslint-warning-ratchet.test.mjs`

Run: `npm run lint:ratchet`

Expected: tests pass; ratchet exits 0 with zero errors and warning count at or below baseline.

- [ ] **Step 6: Commit**

```bash
git add src/components/dashboard-v2/widgets/DigitalGoodsManager.tsx scripts package.json config/quality-baseline.json
git commit -m "chore: enforce eslint warning ratchet"
```

### Task 5: Workstream A verification

**Files:**
- Modify: `docs/superpowers/plans/2026-08-29-revenue-core-a-trust-baseline.md` (check completed boxes)

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: verified trust-baseline commit series.

- [ ] **Step 1: Run targeted test suite**

Run: `npm test -- --run src/domain/billing/__tests__/catalog.test.ts src/components/routing/__tests__/CanonicalDemoRedirect.test.tsx src/components/dashboard-v2/screens/__tests__/HomeScreen.regression.test.tsx`

- [ ] **Step 2: Run repository gates**

Run: `npm run typecheck:strict`

Run: `npm run lint:ratchet`

Run: `npm run build`

- [ ] **Step 3: Inspect diff and commit plan progress**

Run: `git diff --check` and `git status --short`.

```bash
git add docs/superpowers/plans/2026-08-29-revenue-core-a-trust-baseline.md
git commit -m "docs: record trust baseline completion"
```

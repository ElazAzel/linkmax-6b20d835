# Project Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** Make the repository's required local quality, type, unit, build, localization, and Chromium E2E checks deterministic and green on Windows without hiding genuine application failures.

**Architecture:** Keep production changes narrow: make chart callback types match Recharts' public contract and restore the Radix dialog accessibility relationship. Make contract tests platform-independent, centralize E2E credential detection, and separate public scenarios from tests that genuinely require an authenticated seeded account. Remove persisted browser authentication from version control and create it only during authenticated setup.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, Radix UI, Recharts, Playwright, Supabase SQL migrations.

---

### Task 1: Reproduce and repair deterministic unit/type failures

**Files:**
- Modify: `src/components/ui/dialog.tsx`
- Test: `src/components/ui/__tests__/Dialog.keyboard.test.tsx`
- Modify: `src/domain/revenue/__tests__/booking-sql-contract.test.ts`
- Modify: `src/domain/revenue/__tests__/public-booking-sql-contract.test.ts`
- Modify: `src/components/dashboard-v2/analytics/BlockPerformance.tsx`
- Modify: `src/components/dashboard-v2/analytics/TrafficSourcesChart.tsx`
- Modify: `src/components/zones/ZoneAnalyticsScreen.tsx`
- Modify: `src/components/zones/ZoneDashboard.tsx`

1. Run the three focused Vitest files and strict TypeScript to confirm the known failures.
2. Fix Dialog title/description child detection so the existing keyboard/accessibility test observes the real `aria-describedby` relationship.
3. Normalize migration newlines in SQL contract fixtures and point the public availability assertion at the component that owns the RPC call.
4. Broaden Recharts formatter callback parameters to the library's supported value/name types without runtime casts.
5. Re-run focused tests and strict TypeScript until green.

### Task 2: Make authenticated E2E coverage explicit and safe

**Files:**
- Add: `e2e/support/auth.ts`
- Modify: `e2e/auth.setup.ts`
- Modify: `e2e/add-block-sheet.spec.ts`
- Modify: `e2e/crm-workflow.spec.ts`
- Modify: `e2e/fintech-flow.spec.ts`
- Modify: `e2e/zone-upgrade.spec.ts`
- Modify: `.gitignore`
- Delete: `playwright/.auth/user.json`

1. Add a small credential predicate shared by setup and authenticated specs.
2. Skip authenticated suites when credentials are absent, with one explicit reason, instead of letting dependent projects execute against an empty/stale state.
3. Ensure the auth-state directory is created before Playwright writes it.
4. Ignore generated auth state and remove the tracked copy.
5. Verify test discovery reports authenticated cases as skipped when credentials are absent.

### Task 3: Repair deterministic public/editor E2E scenarios

**Files:**
- Modify: `e2e/editor-add-block-sheet.spec.ts`
- Modify: `e2e/language-switch.spec.ts`
- Modify: `e2e/visual-regression.spec.ts`
- Modify production locale/switcher code only if the focused browser reproduction proves an application defect.

1. Select the add-block dialog by its accessible identity and dismiss cookie consent before interaction.
2. Reproduce language persistence failures in isolation; fix the application only if storage/event behavior is wrong, otherwise remove race-prone test setup.
3. Make visual screenshots target a stable public region and viewport rather than an environment-dependent full-page height.
4. Run the focused Chromium specs serially.

### Task 4: Close localization and repository hygiene gaps

**Files:**
- Modify locale resources identified by `npm run i18n:check`.
- Modify only generated/baseline files required by project scripts.

1. Enumerate missing Uzbek keys and merge complete translations or an explicit maintained fallback following the repository's locale structure.
2. Run runtime locale structure and coverage checks.
3. Confirm no generated reports, credentials, or temporary lockfiles are tracked.

### Task 5: Full verification and handoff

**Files:**
- Verify all changed files.

1. Run strict TypeScript, unit tests with coverage, script tests, ESLint ratchet, quality baseline, dependency rules, Knip baseline, i18n checks, and production build.
2. Run the full Chromium Playwright project with one worker; distinguish credential-gated skips from failures.
3. Review the final diff for accidental scope expansion and secrets.
4. Report remaining non-blocking baseline warnings separately; do not claim they were introduced by this remediation.

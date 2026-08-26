---
name: testing
description: Vitest unit testing, Playwright E2E suites, accessibility (a11y) checks, and visual regression.
---

# Testing & Quality Assurance

Use for writing, updating, and executing unit tests (Vitest), end-to-end tests (Playwright), accessibility verification, and code coverage analysis.

## When to Use
- Writing unit tests for new services, hooks, utilities, or domain logic (`src/**/__tests__/*.test.ts`).
- Creating component interaction and accessibility tests (`src/**/__tests__/*.test.tsx`).
- Adding end-to-end user journey tests in `e2e/`.
- Validating coverage thresholds and verifying regression prevention.

## Core Workflows

### 1. Writing Unit & Service Tests (Vitest)
1. Colocate test files inside `__tests__/` directory next to the subject file.
2. Mock external dependencies (e.g. Supabase client, fetch, navigator) using standard mocks in `src/testing/setup.ts`.
3. Assert both successful outcome and error handling branches.
4. Run focused tests during development:
   ```bash
   npm run test -- path/to/my-module.test.ts
   ```

### 2. Testing Accessible UI Components
1. Test keyboard interactions: verify `Enter`, `Space`, `Escape`, and `Tab` focus trapping in modals and sheets (`src/components/ui/__tests__/overlay-focus.a11y.test.tsx`).
2. Test semantic HTML elements, ARIA attributes, and accessible labels.

### 3. Playwright End-to-End Tests
1. Add spec in `e2e/<feature>.spec.ts`.
2. Target Chromium and Mobile Safari profiles.
3. Test realistic journeys: registration, page creation, block addition, reordering, and public preview.
4. Run locally:
   ```bash
   npm run e2e
   ```

## Key Files & Configs
- **Configs**: `vitest.config.ts`, `playwright.config.ts`
- **Setup & Mocks**: `src/testing/setup.ts`, `src/testing/mocks/`
- **E2E Specs**: `e2e/`, `playwright/`

## Commands & Quality Gates
```bash
npm run test:ci          # Run all unit tests with coverage thresholds
npm run quality:check    # Full gate: lint + i18n + strict ts + quality baseline + quality gate
```

## Best Practices & Guardrails
- **Deterministic Tests**: Never write tests with arbitrary `sleep()` timers; use `waitFor` or event listeners.
- **Isolate State**: Clear mocks, localStorage, and query client cache between test runs in `beforeEach`/`afterEach`.
- **Maintain Coverage**: Maintain >=80% statement coverage for business-critical modules in `src/services/` and `src/domain/`.

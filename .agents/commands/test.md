---
description: Run automated tests
---
# Test Command

This command runs the automated test suites for the project.

## Unit/Integration Tests (Vitest)
1.  Run all tests: `npm run test`
2.  Run tests in watch mode (for TDD): `npm run test:watch` (if configured in package.json)
3.  Run tests with coverage: `npm run coverage`

## End-to-End Tests (Playwright/Cypress - if configured)
1.  Ensure local dev server is running (`npm run dev`).
2.  Run E2E tests: e.g., `npx playwright test`

## Verification
-   All tests should report "PASS".
-   No tests should be skipped (`.skip`) unless there is a linked issue tracking the fix.

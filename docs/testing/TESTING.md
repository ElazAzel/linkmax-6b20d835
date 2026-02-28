# Testing Strategy

This document outlines the testing strategies and tools used in the lnkmx platform to ensure reliability and maintainability.

## Overview

We use a multi-layered testing approach:
1.  **Static Analysis**: TypeScript & ESLint for compile-time safety.
2.  **Unit/Integration Tests**: Vitest for utility functions and isolated component logic.
3.  **End-to-End (E2E) Tests**: Playwright for critical user journeys.

---

## 1. Static Analysis

### TypeScript
We run strict type checking to catch errors before runtime.

```bash
# Run type checking
npm run typecheck
```
*Run this command frequently during development.*

### Linting
We use ESLint to enforce code style and best practices.

```bash
# Check for linting errors
npm run lint

# Fix auto-fixable errors
npm run lint -- --fix
```

### Dependency Analysis
We use `dependency-cruiser` to ensure our architectural boundaries (e.g., Domain layer shouldn't depend on UI) are respected.

```bash
# Check for circular dependencies
npm run analyze:cycles
```

---

## 2. Unit & Integration Testing

We use **Vitest** for unit testing. It is fast, compatible with Vite, and offers a Jest-like API.

### What to Test
- Utility functions in `src/lib/`
- Hooks with complex logic in `src/hooks/`
- Domain logic in `src/domain/`

### Running Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (dev)
npm run test -- --watch
```

### Writing a Test
Create a file named `Filename.test.ts` next to the source file.

```ts
import { describe, it, expect } from 'vitest';
import { sum } from './math';

describe('math', () => {
  it('adds two numbers', () => {
    expect(sum(1, 2)).toBe(3);
  });
});
```

---

## 3. End-to-End (E2E) Testing

We use **Playwright** for testing full user flows. These tests run against a real browser instance.

### What to Test
- Sign up / Login flows
- Page creation and editing
- Public page rendering
- CRM lead captures

### Running Tests

```bash
# Run E2E tests (headless)
npm run e2e

# Run E2E tests with UI runner
npm run e2e -- --ui
```

### Configuration
Playwright config is located at `playwright.config.ts`. It is configured to run tests in parallel and capture screenshots on failure.

---

## 4. Continuous Integration (CI)

Our CI pipeline (Github Actions) runs the following checks on every Pull Request:
1.  `npm install`
2.  `npm run lint`
3.  `npm run typecheck`
4.  `npm run test`
5.  `npm run e2e` (smoke tests only)

> **Note:** PRs cannot be merged unless all checks pass.

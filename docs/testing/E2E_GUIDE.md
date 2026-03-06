# E2E Testing Guide (inkmax)

## Overview

We use Playwright for End-to-End testing. Our strategy focuses on "Smoke Tests" for critical business flows.

## Critical Flows

1. **User Onboarding**: Signup -> Profile -> First Zone.
2. **Project Creation**: New Project -> Select Template -> Save.
3. **Monetization**: Select Plan -> Checkout (RoboKassa) -> Fulfillment.

## Running Tests

```bash
npx playwright test
```

## Writing Tests

Tests should be located in `tests/e2e/`. Use the Page Object Model (POM) pattern.

Example structure:

```typescript
import { test, expect } from '@playwright/test';

test('create new project', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=New Project');
  // ...
});
```

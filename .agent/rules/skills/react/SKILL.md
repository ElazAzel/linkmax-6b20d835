---
name: react
description: React, TypeScript, routing, state, i18n, accessibility, and UI changes in LinkMAX.
---

# React

Use for routes, components, hooks, client state, and user-visible behavior.

## Procedure

1. Read the nearest component, route, hook, and existing test before adding abstraction.
2. Reuse project UI primitives and Lucide icons; preserve responsive layout and keyboard behavior.
3. Keep user-visible strings in i18n resources. Do not silence i18n checks with arbitrary baselines.
4. Handle loading, empty, error, and disabled states for asynchronous UI.
5. Add focused tests for changed behavior and a Playwright flow for critical journeys.

## Verification

```bash
npm run lint
npm run typecheck:strict
npm run i18n:check
npm run lint:i18n
npx playwright test e2e/<spec>.ts --project=chromium
```

## Guardrails

- Never make authorization decisions only in the client.
- Avoid direct browser storage access when the repository storage utility already owns the concern.
- Do not introduce hard-coded production copy without a deliberate i18n exception.

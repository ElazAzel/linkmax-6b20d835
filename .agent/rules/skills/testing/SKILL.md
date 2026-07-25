---
name: testing
description: Unit, integration, Playwright, build, and release verification for LinkMAX.
---

# Testing

Use after behavioral, schema, workflow, dependency, or security changes.

## Select Tests by Risk

- Pure logic, hooks, and components: Vitest.
- Auth, editor, checkout, routing, or public page flows: focused Playwright test.
- Schema/RLS/Edge Function: migration and authorization review plus integration or smoke coverage.
- Toolchain/configuration: `npm ci`, quality gate, build, and affected browser flow.

## Commands

```bash
npm run lint
npm run typecheck:strict
npm run test:ci
npm run e2e:ci
npm run build
npm run quality:check
```

## Reporting

Report exact commands, pass/fail result, skipped checks, and residual risk. A test is not evidence if it uses a personal session, production credential, or a skipped assertion.

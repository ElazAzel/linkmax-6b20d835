# Testing Strategy

**Last reviewed:** 2026-07-25

## Test Layers

| Layer | Tool | Scope |
|---|---|---|
| Static analysis | ESLint, TypeScript, dependency-cruiser, Knip | Source correctness, dependency direction, unused code baselines. |
| Unit and integration | Vitest | Domain logic, hooks, utilities, and isolated components. |
| Browser E2E | Playwright | Authentication, editor, public page, and other critical user journeys. |
| Build | Vite | Production bundle, route imports, and build-time configuration. |

## Commands

```bash
npm run lint
npm run typecheck:strict
npm run test:ci
npm run e2e:ci
npm run build
```

The complete repository gate is:

```bash
npm run quality:check
```

It runs ESLint, literal/i18n validation, locale structure checks, strict TypeScript, quality baselines, dependency cycles, layer rules, and unused-export checks.

## Playwright

Playwright configuration is in `playwright.config.ts`. It starts `npm run dev` automatically on port 8080, runs Chromium, Firefox, and Mobile Chrome projects, and stores failed-test screenshots/traces according to the config.

On a clean machine:

```bash
npx playwright install
```

Run a focused flow while developing:

```bash
npx playwright test e2e/<spec>.ts --project=chromium
```

Authentication-dependent tests use the repository setup project and stored test state. Do not commit personal user sessions or real production credentials.

## Change-to-Test Mapping

- UI interaction or route change: component/unit coverage plus a focused Playwright spec when the journey is critical.
- Supabase schema, RLS, RPC, or Edge Function change: migration review, authorization tests where feasible, and an integration/smoke test.
- i18n change: `npm run i18n:check` and `npm run lint:i18n`.
- Dependency or Vite configuration change: `npm ci`, `npm run quality:check`, `npm run build`, and affected E2E flow.

## Acceptance Evidence

Pull requests should state the commands run and their result. A skipped check needs a concrete reason and the remaining risk; it is not equivalent to a passing check.

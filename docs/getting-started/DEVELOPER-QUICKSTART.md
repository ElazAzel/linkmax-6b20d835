# Developer Quickstart

**Last reviewed:** 2026-07-25
**Runtime:** Node.js 22

## 1. Install

```bash
nvm use
npm ci
```

`npm ci` is required for a reproducible install. Use `npm install` only when intentionally changing dependencies and commit the resulting `package-lock.json`.

## 2. Configure browser-safe variables

Copy `.env.example` to `.env` and set only values that are safe to expose in a browser bundle:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-or-anon-key>
```

Do not put a Supabase service-role key, payment secret, OAuth client secret, Sentry auth token, Cloudflare API token, or Supabase access token in `VITE_*` variables.

## 3. Start the app

```bash
npm run dev
```

Open `http://localhost:8080`. The application uses the configured remote Supabase project unless you separately start and configure the local Supabase stack.

## 4. Run the smallest useful verification

```bash
npm run lint
npm run typecheck:strict
npm run test:ci
npm run build
```

For editor, auth, route, or other browser-flow changes run Playwright too:

```bash
npm run e2e:ci
```

`npm run quality:check` runs the complete local gate. See [Testing](../testing/TESTING.md) for the exact scope and [Local development](../deployment/runbooks/LOCAL_DEVELOPMENT.md) for Supabase and mobile workflows.

## Common Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite on port 8080. |
| `npm run build` | Generate the production bundle in `dist/`. |
| `npm run start` | Preview the production bundle locally. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck:strict` | Run strict TypeScript validation. |
| `npm run test:ci` | Run Vitest with coverage. |
| `npm run e2e:ci` | Run Playwright in CI-style reporting mode. |
| `npm run quality:check` | Run the repository quality gate. |
| `npm run mobile:sync` | Build then sync Capacitor native projects. |
| `npm run docs:check` | Validate local Markdown links. |

## Before Opening a Pull Request

1. Keep migrations in `supabase/migrations/`; never alter an already-applied migration.
2. Update affected current documentation and translations.
3. Run the checks that cover the changed behavior.
4. Do not commit `.env`, build output, credentials, or generated screenshots unless they are intentionally versioned test fixtures.

# Local Development Runbook

**Last reviewed:** 2026-07-25

## Frontend

```bash
nvm use
npm ci
cp .env.example .env
npm run dev
```

Vite serves the app at `http://localhost:8080`. `predev` and `prebuild` regenerate `public/sitemap.xml`; treat resulting changes as generated output and inspect them before committing.

## Supabase

The browser can use the hosted Supabase project through `.env`. To work against the local stack, install Docker and the Supabase CLI, then:

```bash
npx supabase start
npx supabase db reset
npx supabase status
```

Supabase Studio is normally exposed at `http://localhost:54323`. Configure local frontend variables from `supabase status` before using the local API.

Create a new migration with a descriptive timestamped name. Review the SQL and RLS policies, then apply it locally:

```bash
npx supabase migration new <feature_name>
npx supabase db reset
```

Do not run `supabase db push` against production casually. The `deploy-supabase.yml` workflow applies reviewed migrations from `main` using `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID`.

## Edge Functions

```bash
npx supabase functions serve <function-name> --env-file supabase/.env.local
npx supabase functions logs <function-name>
```

`supabase/.env.local` is local-only. It may contain function secrets and must never be committed.

## Tests and Build

```bash
npm run quality:check
npm run e2e:ci
npm run build
```

Playwright starts the Vite server automatically through `playwright.config.ts`. On a new machine install browser binaries once:

```bash
npx playwright install
```

## Mobile

```bash
npm run mobile:sync
npm run mobile:open:android
npm run mobile:open:ios
```

The sync command rebuilds the web bundle first. Do not hand-edit generated web assets inside native projects.

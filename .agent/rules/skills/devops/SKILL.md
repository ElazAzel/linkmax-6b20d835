---
name: devops
description: CI/CD workflows, Supabase migrations, Edge Functions deployment, Cloudflare SSR Worker, and release operations.
---

# DevOps & Infrastructure

Use for GitHub Actions workflows, Supabase database migrations, Edge Function deployments, Cloudflare Worker SSR, and production release pipelines.

## When to Use
- Managing GitHub Actions pipelines (`.github/workflows/`).
- Creating and testing Supabase migrations and RLS policies (`supabase/migrations/`).
- Deploying and updating Supabase Edge Functions (`supabase/functions/`).
- Managing Cloudflare Worker SSR and bot rendering (`cloudflare-worker/`).
- Running local quality gates and release validation.

## Core Workflows

### 1. Supabase Database Migrations
1. Create new migration via `npx supabase migration new <name>`.
2. Write idempotent SQL: use `IF NOT EXISTS`, add indexes concurrently where needed, and define RLS policies explicitly.
3. Test migration locally with `npx supabase db reset` or verify against active schema.
4. Never modify existing, already-deployed migration files.

### 2. Edge Function Deployments
1. Develop function under `supabase/functions/<function-name>/index.ts`.
2. Use shared utilities from `supabase/functions/_shared/`.
3. Validate environment secrets via `Deno.env.get()`.
4. Deploy using `supabase functions deploy <function-name>` or push to `main` via `deploy-supabase.yml`.

### 3. Cloudflare Worker SSR
1. Worker logic resides in `cloudflare-worker/worker.ts`.
2. Injects meta tags, title, and OpenGraph images for crawler bots (Googlebot, TelegramBot, TwitterBot).
3. Test locally or via `scripts/test-ssr.sh` / `scripts/verify-ssr.js`.
4. Deploy via `.github/workflows/deploy-cloudflare-worker.yml`.

## Key Files & Configs
- **Workflows**: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `.github/workflows/deploy-supabase.yml`
- **Supabase Config**: `supabase/config.toml`, `supabase/migrations/`
- **Worker**: `cloudflare-worker/worker.ts`, `cloudflare-worker/wrangler.toml`
- **Documentation**: `docs/deployment/`, `docs/operations/`

## Commands & Verification
```bash
npm run quality:check
npm run test:ci
npm run build
```

## Best Practices & Guardrails
- **Secret Separation**: Never expose `SUPABASE_SERVICE_ROLE_KEY` to client apps or `VITE_*` env vars.
- **Append-Only Migrations**: Preserve all historical migration sequence integrity.
- **Fail-Fast CI**: Ensure all quality gates (Lint, i18n, Typecheck, Tests, Cycles) pass before deploying.

---
name: devops
description: CI/CD, Supabase migrations and Edge Functions, Cloudflare Worker, runtime configuration, and delivery recovery for LinkMAX.
---

# DevOps

Use for workflow, deployment, environment, migration, or operational changes.

## Source of Truth

- Workflows: `.github/workflows/ci.yml`, `deploy.yml`, `deploy-cloudflare-worker.yml`, `deploy-supabase.yml`.
- Runtime details: `docs/deployment/GITHUB_ACTIONS_SETUP.md`.
- Local process: `docs/deployment/runbooks/LOCAL_DEVELOPMENT.md`.

## Procedure

1. Verify Node 22 and run `npm ci`.
2. Make schema changes in a new append-only file under `supabase/migrations/`.
3. Test locally where possible; review RLS and Edge Function authorization.
4. Run `npm run quality:check`, affected tests, and `npm run build`.
5. Confirm required GitHub secrets by name only. Never print values.
6. After deploy, smoke-test the affected endpoint and inspect provider logs.

## Guardrails

- Do not edit an applied migration or deploy unreviewed database changes.
- `SUPABASE_ACCESS_TOKEN` and `CLOUDFLARE_API_TOKEN` are CI secrets, never `VITE_*` variables.
- Treat missing provider credentials as a delivery blocker, not a reason to bypass a workflow.

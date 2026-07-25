# GitHub Actions and Deployment Setup

**Last reviewed:** 2026-07-25

## Workflows

| Workflow | Trigger | Responsibility |
|---|---|---|
| `ci.yml` | PRs and pushes to `main` | Quality gate, Vitest, Playwright, build. |
| `deploy.yml` | Pushes to `main`, manual dispatch | Build and Cloudflare Worker deployment. |
| `deploy-cloudflare-worker.yml` | Worker-only changes, manual dispatch | Cloudflare Worker deployment. |
| `deploy-supabase.yml` | Supabase functions or migrations on `main`, manual dispatch | Apply migrations and deploy Edge Functions. |

All workflow jobs use Node.js 22. CI is a merge gate; a deployment workflow is not a substitute for passing CI.

## Required GitHub Secrets

| Secret | Used by | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | build and E2E | Browser-safe project URL. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | build | Browser-safe Supabase publishable/anon key. |
| `VITE_SUPABASE_ANON_KEY` | E2E where configured | Browser-safe key for test flows. |
| `SUPABASE_PROJECT_ID` | Supabase deploy | Project reference, not a credential. |
| `SUPABASE_ACCESS_TOKEN` | Supabase deploy | Supabase personal access token with deployment access. |
| `CLOUDFLARE_API_TOKEN` | Cloudflare workflows | Least-privilege token with Worker deployment permissions. |
| `CLOUDFLARE_ACCOUNT_ID` | Worker-only workflow | Cloudflare account identifier. |
| `CF_WORKER_SUPABASE_PROJECT` | Worker-only workflow | Project reference passed to the Worker. |
| `CF_WORKER_SUPABASE_ANON_KEY` | Worker-only workflow | Browser-safe Supabase key passed as Worker secret. |

Add secrets in GitHub: **Settings -> Secrets and variables -> Actions -> New repository secret**. Never put their values in workflow YAML, `.env.example`, docs, issues, or logs.

## Deployment Procedure

1. Open a pull request and wait for `ci.yml` to pass.
2. Review migrations, Edge Function changes, and generated sitemap changes separately.
3. Merge to `main`.
4. Confirm the relevant deploy workflow completed successfully.
5. Run a smoke check against `https://lnkmx.my/` and inspect Sentry/Supabase logs for regression signals.

## Failure Triage

| Symptom | Check |
|---|---|
| `supabase` authentication failure | `SUPABASE_ACCESS_TOKEN` exists, is current, and can access `SUPABASE_PROJECT_ID`. |
| Cloudflare authentication failure | `CLOUDFLARE_API_TOKEN` exists, is active, and has Worker deployment permission for the configured account. |
| Build lacks Supabase configuration | `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are present in the workflow environment. |
| Migration fails | Inspect migration order and SQL in a temporary/local Supabase project before retrying production. Do not edit an already-applied migration. |
| CI quality gate fails | Reproduce the named npm command locally; do not suppress the check without an explicit baseline change and review. |

## Rotation and Access

- Use least privilege and separate tokens for people, CI, and local development.
- Rotate deployment tokens immediately after suspected exposure and at a defined operational interval.
- Remove secrets and environment access when a maintainer no longer needs deployment rights.
- Record any manual production recovery in the pull request or incident record, without copying secret values.

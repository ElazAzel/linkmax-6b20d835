# GitHub Actions and deployment setup

**Last reviewed:** 2026-09-01

## Workflows

| Workflow | Trigger | Responsibility |
|---|---|---|
| `ci.yml` | Pull requests and pushes to `main` | Quality, audits, unit coverage, build, Worker dry run, Playwright, local Supabase, Android, and iOS validation. |
| `codeql.yml` | Pull requests, `main`, weekly | JavaScript/TypeScript security analysis. |
| `deploy-staging.yml` | Successful CI run on `main`, manual dispatch | Build and deploy the isolated Supabase/Cloudflare staging stack. |
| `release.yml` | Manual dispatch with production approval | Build once, preview, migrate, promote, smoke-test, then create the tag and GitHub Release. |

Every external action is pinned to a full commit SHA. Node is pinned to major version 22, Wrangler to `4.127.1`, and Supabase CLI to `2.116.0`.

## GitHub environments

Create `staging` and `production` environments. Use separate projects, tokens, Worker names, and E2E users. Add required reviewers and prevent self-review on `production`.

Each environment requires these secrets:

| Secret | Purpose |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Deploy migrations and Edge Functions. |
| `SUPABASE_PROJECT_ID` | Environment-specific project reference. |
| `SUPABASE_DB_PASSWORD` | Apply linked database migrations. |
| `VITE_SUPABASE_URL` | Browser-safe build and health-check URL. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser-safe publishable/anon key. |
| `CLOUDFLARE_API_TOKEN` | Least-privilege Worker Scripts deployment token. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account identifier. |
| `CF_WORKER_SUPABASE_PROJECT` | Project reference bound to the Worker as a secret. |
| `CF_WORKER_SUPABASE_ANON_KEY` | Browser-safe key bound to the Worker as a secret. |
| `E2E_TEST_EMAIL` | Dedicated account in the staging Supabase project. |
| `E2E_TEST_PASSWORD` | Password for the isolated staging test account. |

Enter values through GitHub environment settings. Do not paste them into logs, workflow dispatch inputs, issues, documentation, or committed `.env` files.

## Main protection

Use a repository ruleset for `main`:

- require pull requests and one approval;
- dismiss stale approvals and require conversation resolution;
- require strict, up-to-date checks: `Quality`, `Unit`, `Build`, `E2E`, `Database`, `Android`, `iOS`, and `Analyze`;
- block force-pushes and deletion;
- allow squash merge only and delete merged branches automatically.

Enable Dependabot security updates, CodeQL default/setup analysis, secret scanning, and push protection. Require full-length commit SHA pinning for Actions when the repository plan supports that policy.

## Deployment order

Staging runs automatically only after green `main`. Both staging and production use this order:

1. validate credentials without printing values;
2. build the web assets once;
3. inspect migration history;
4. apply database migrations;
5. deploy Edge Functions;
6. verify Supabase health;
7. upload and smoke-test an immutable Worker version;
8. promote the exact Worker version.

Production additionally requires a backup/PITR confirmation, Lovable mirror identifier, production reviewer approval, artifact checksums, CycloneDX SBOM, and build provenance. The tag and GitHub Release are the final operation.

## Recovery

- Failed production smoke tests invoke Cloudflare rollback.
- Supabase recovery uses a reviewed forward migration; never edit an applied migration.
- A failed release publication removes an orphaned tag.
- Rotate any token immediately after suspected exposure and document only the rotation event, never the value.

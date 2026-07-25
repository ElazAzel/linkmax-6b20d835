# Deployment Runbook

**Last reviewed:** 2026-07-25

## Before Merge

```bash
npm ci
npm run quality:check
npm run test:ci
npm run build
```

Review migrations, RLS, Edge Function authorization, generated sitemap changes, and documentation updates. Merge only after required CI checks pass.

## Automated Delivery

- `deploy.yml` builds the web application and deploys the Cloudflare Worker after pushes to `main`.
- `deploy-cloudflare-worker.yml` handles worker-only changes.
- `deploy-supabase.yml` applies migrations and deploys Edge Functions when `supabase/functions/` or `supabase/migrations/` changes.

Secret requirements are documented in `docs/deployment/GITHUB_ACTIONS_SETUP.md`. A missing deployment secret is an operational blocker; do not substitute it with a committed value.

## Post-deploy Checks

1. Confirm the relevant workflow is successful.
2. Open `https://lnkmx.my/`, `/auth`, and a representative public page.
3. Verify the changed function or worker route.
4. Inspect Sentry and Supabase/Cloudflare logs for errors.

## Recovery

1. Contain impact by disabling the affected provider integration or feature flag where available.
2. Revert the offending application commit through a reviewed pull request.
3. For database issues, create a corrective forward migration or restore through the approved provider backup process. Never edit an already-applied migration.
4. Rotate any credential suspected of exposure and document the incident without its secret values.

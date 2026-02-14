# Runbook: Deployment

> **Goal:** Deploy the `inkmax` application to production safely.

## Pre-Deployment Checklist

- [ ] All tests pass (`npm run test`)
- [ ] Type check passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Changelog updated (`docs/CHANGELOG.md`)

## Deployment Process

The project is configured for automatic deployment via **Lovable Cloud** when pushing to the `main` branch.

1. **Merge to Main**
   - Ensure your PR is approved and checks pass.
   - Squash and merge to `main`.

2. **Monitor Build**
   - Check the Lovable Cloud dashboard (or GitHub Actions if applicable) to verify the build and deployment status.

3. **Post-Deployment Verification**
   - Visit the production URL: [lnkmx.my](https://lnkmx.my)
   - Verify critical flows (Sign up/Login, Page loading, Editor).

## Rollback Plan

If a critical issue is found after deployment:

1. **Identify the Issue**: Check logs and error reports.
2. **Revert**: Revert the bad commit on `main` via GitHub.
   - `git revert <commit-hash>`
   - Push the revert commit to `main`.
3. **Verify Rollback**: Ensure the previous version is deployed and functioning.

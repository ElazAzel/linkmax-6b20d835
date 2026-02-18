# Runbook: Deployment

> **Goal:** Deploy the `inkmax` application to production safely.

## Pre-Deployment Checklist

- [ ] All tests pass (`npm run test`)
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Build succeeds locally (`npm run build`)
- [ ] Changelog updated (`docs/CHANGELOG.md`)
- [ ] Edge functions tested locally if modified

## Frontend Deployment

The frontend is deployed via **Lovable Cloud** when pushing to `main`.

1. **Merge to Main**
   - Ensure your PR is approved and checks pass.
   - Squash and merge to `main`.

2. **Monitor Build**
   - Check the deployment dashboard to verify build status.

3. **Post-Deployment Verification**
   - Visit production: [lnkmx.my](https://lnkmx.my)
   - Verify: Sign up/Login, Page loading, Editor, Public page rendering.

## Edge Function Deployment

Edge functions are deployed separately via Supabase CLI.

```bash
# Deploy specific functions
supabase functions deploy pixel-proxy
supabase functions deploy seo-ssr
supabase functions deploy telegram-bot-webhook
supabase functions deploy create-lead

# Deploy all functions
supabase functions deploy --all

# Set secrets (if adding new API keys)
supabase secrets set KEY_NAME=value
```

## Database Migrations

```bash
# Apply pending migrations
supabase db push

# Or run migration SQL directly in Supabase SQL Editor
```

## Rollback Plan

If a critical issue is found after deployment:

1. **Frontend**: Revert the bad commit on `main`:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Edge Functions**: Redeploy previous version:
   ```bash
   git checkout HEAD~1 -- supabase/functions/<function-name>/
   supabase functions deploy <function-name>
   ```

3. **Database**: Roll back migration (if reversible):
   ```bash
   # Restore from Supabase backup or apply inverse migration
   ```

4. **Verify Rollback**: Confirm previous version is live and functioning.

---

*Last updated: 2026-02-18*

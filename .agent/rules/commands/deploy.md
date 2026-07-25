---
description: Build, CI, Supabase, and Cloudflare deployment references
---

# Deployment Commands

## Pre-deploy

```bash
npm ci
npm run quality:check
npm run test:ci
npm run build
```

## Delivery Paths

- Web build and Cloudflare Worker: `.github/workflows/deploy.yml`.
- Worker-only changes: `.github/workflows/deploy-cloudflare-worker.yml`.
- Supabase migrations and Edge Functions: `.github/workflows/deploy-supabase.yml`.

Use provider dashboards/CLI only with the least-privilege credentials for the intended environment. Required secret names and failure recovery are documented in `docs/deployment/GITHUB_ACTIONS_SETUP.md`.

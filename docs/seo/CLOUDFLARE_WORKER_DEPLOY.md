# Cloudflare Worker Deployment

**Last reviewed:** 2026-07-25

The Worker source and configuration are in `cloudflare-worker/`. It supports bot-facing SSR/prerender and sitemap-related delivery paths. Treat the code and `wrangler.toml` as the authoritative runtime configuration.

## Automated Paths

- `deploy.yml` deploys after a successful build on `main`.
- `deploy-cloudflare-worker.yml` deploys when only Worker files or its workflow change.

Both paths require least-privilege Cloudflare credentials. Required secret names are listed in [GitHub Actions setup](../deployment/GITHUB_ACTIONS_SETUP.md).

## Local Check

```bash
npm ci
npm run build
cd cloudflare-worker
npx wrangler deploy --dry-run
```

Use the environment and account intended for the deployment. Do not copy a token into `wrangler.toml`, frontend environment variables, documentation, or terminal output.

## Post-deploy Check

1. Confirm the GitHub Actions workflow and Cloudflare deployment record succeed.
2. Request the expected public URL and inspect its status, headers, and rendered metadata.
3. Confirm sitemap behavior and one representative bot-facing route.
4. Inspect Worker logs; redact any sensitive request data in incident reports.

## Recovery

Revert a faulty Worker change through a reviewed pull request, redeploy from the known-good revision, then investigate configuration and logs. Rotate `CLOUDFLARE_API_TOKEN` if exposure is suspected.

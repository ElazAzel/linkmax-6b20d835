# Runbook: Deployment

This document describes the process of deploying LinkMAX to production.

## Prerequisites
- Access to the GitHub repository.
- Permissions to trigger Vercel deployments.
- Supabase CLI installed and logged in (for Edge Functions).

## Automated Deployment (Vercel)
The frontend is automatically deployed when code is merged into the `main` branch.

1.  **Pull Request**: Open a PR to `main`.
2.  **CI Checks**: Ensure all checks pass (Lint, Typecheck, Tests).
3.  **Preview**: Verify the Vercel Preview URL.
4.  **Merge**: Once approved and tested, merge to `main`.
5.  **Production**: Vercel will trigger a production build.

## Manual Edge Function Deployment (Supabase)
If you changed Edge Functions in `supabase/functions/`:

1.  **Login**: `supabase login`
2.  **Deploy**: `supabase functions deploy [function-name] --project-ref [project-id]`
3.  **Verify**: Check Supabase Dashboard for the new version.

## Post-Deployment Checklist
- [ ] Check Sentry for new errors.
- [ ] Perform a smoke test (Login -> Create Page -> View Public).
- [ ] Verify environment variables if any were added.

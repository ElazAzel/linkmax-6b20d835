# Runbook: Rollback

This document describes how to quickly revert the platform to a stable state in case of a failed deployment.

## Frontend Rollback (Vercel)
Vercel allows instant rollbacks to a previous successful deployment.

1.  Go to the **Vercel Dashboard** -> **Deployments**.
2.  Locate the last **stable** deployment (before the current failed one).
3.  Click the three dots (...) and select **Instant Rollback**.
4.  Confirm the rollback. Site will revert in seconds.

## Database / Edge Functions Rollback
Supabase does not support "instant" rollback for schema/functions via CLI yet.

1.  **Git Revert**: Use `git revert [COMMIT_HASH]` on the `main` branch.
2.  **Redeploy**: Merge the revert commit or push it to trigger the CI/CD pipeline.
3.  **Edge Functions**: Manually redeploy the previous stable version from your local environment if CI is blocked.

## When to Rollback?
- **SEV-1**: Application is completely inaccessible.
- **Data Loss**: Critical data is being corrupted.
- **Security**: Exploited vulnerability discovered.

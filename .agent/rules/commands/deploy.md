---
description: Deploy application and edge functions
---
# Deploy Command

This outlines the steps to deploy different parts of the lnkmx.my application.

## Frontend Deployment (Usually CI/CD)
The frontend is typically deployed via a platform like Vercel or Cloudflare Pages linked to the `main` branch.
-   **Manual Build**: `npm run build`

## Supabase Edge Functions Deployment
To deploy Edge Functions to the Supabase project:
1.  Ensure you are logged into Supabase CLI: `npx supabase login`
2.  Link to the project if not already linked: `npx supabase link --project-ref <project-id>`
3.  Deploy a specific function: `npx supabase functions deploy <function-name> --no-verify-jwt` (if public like a webhook)
    - *Example*: `npx supabase functions deploy robokassa-webhook --no-verify-jwt`
4.  Deploy all functions: `npx supabase functions deploy`

## Supabase Schema/Migrations
To push local database migrations to the remote Supabase project:
1.  Verify local changes: `npx supabase status`
2.  Push migrations: `npx supabase db push`

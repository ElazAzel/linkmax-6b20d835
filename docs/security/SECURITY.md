# Security Baseline

**Last reviewed:** 2026-07-25
**Scope:** application repository, Supabase configuration in migrations/functions, deployment workflows, and browser bundle.

This document is an operating baseline, not a certification. A control is considered implemented only when it can be traced to code, configuration, migration, or an automated check. Historical findings belong in `docs/audits/`.

## Security Responsibilities

| Area | Required control |
|---|---|
| Authentication | Use Supabase Auth; validate the active session server-side for protected actions. |
| Authorization | Enforce ownership and least privilege with RLS, RPC checks, and Edge Function authorization. |
| Data validation | Validate untrusted inputs at the system boundary; parameterize database access. |
| Browser content | Sanitize user-supplied HTML and keep custom code isolated with the narrowest sandbox. |
| Secrets | Keep privileged values server-side or in GitHub/Supabase/Cloudflare secret stores. |
| Dependencies | Review `npm audit` results and apply non-breaking patches; plan major upgrades with testing. |
| Observability | Send actionable runtime failures to Sentry without credentials or unnecessary PII. |

## Authentication and Account Linking

- The application supports email/password and OAuth through Supabase Auth.
- Google and Apple provider setup, redirect allow-list entries, and account-linking behavior must be configured in the Supabase project, not inferred from frontend code.
- Treat an email match across providers as an account-linking case only through the supported Supabase Auth flow. Do not merge accounts from client-provided identity claims.
- Redirect destinations must be application-owned allow-listed URLs. Do not pass arbitrary `returnTo` values through OAuth redirects.
- Do not expose whether an email address is registered in user-facing error messages beyond the agreed authentication UX.

## Supabase and Database Changes

- Every new table must have RLS enabled and policies reviewed before deployment.
- Migration SQL is append-only after production application. Create a corrective migration instead of editing history.
- Service-role clients belong only in trusted server code. Never import their credentials into the browser.
- RPCs and Edge Functions that mutate user data must authenticate and verify authorization/ownership independently of client UI checks.
- Test RLS with a non-owner session for every new sensitive resource.

## Browser and API Controls

- Use Zod or equivalent explicit validation for external request payloads.
- Sanitize rich text and never rely on React escaping when rendering explicitly allowed HTML.
- Keep CORS origin and method lists as narrow as each public endpoint permits.
- Apply rate limits and bot protection to public write endpoints; an in-memory limit alone is not durable across Edge Function instances.
- Use content security policy and review every new third-party script, connection target, or frame source.

## Secrets and Environments

Browser-safe variables may be prefixed `VITE_`. This includes the Supabase URL and publishable/anon key. The prefix is not suitable for:

- Supabase service-role key or personal access token;
- Cloudflare API token;
- payment, OAuth client, AI provider, Telegram, Sentry auth, or Turnstile secrets.

Store privileged values in the relevant provider secret manager. Update `.env.example` with variable names and descriptions only. Rotate a secret immediately after exposure and invalidate the old value.

## CI and Release Checks

Before merging security-sensitive work, run the applicable checks:

```bash
npm run quality:check
npm run test:ci
npm run e2e:ci
npm audit --omit=dev
```

For migrations and Edge Functions, additionally review RLS/authorization paths and verify the deployment workflow has the required secrets. The full current secret inventory is in [GitHub Actions setup](../deployment/GITHUB_ACTIONS_SETUP.md).

## Incident Response

1. Contain: revoke compromised tokens, disable affected integration, and preserve relevant logs.
2. Assess: identify exposed data, affected accounts, and the first unsafe deployment or request.
3. Remediate: deploy a minimal corrective change, add a regression test or policy, and rotate credentials.
4. Communicate: document facts, impact, recovery, and follow-up owners without placing secrets in the repository.

Report security issues privately to `admin@lnkmx.my`.

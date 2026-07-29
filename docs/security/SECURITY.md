# Security Baseline

**Last reviewed:** 2026-07-29
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

## OWASP Top 10 Review (2026-07-29)

| Category | Repository control | Current result |
| --- | --- | --- |
| A01 Broken Access Control | Supabase RLS, ownership checks, organization scoping | No new access-control surface in the Creative OS change |
| A02 Security Misconfiguration | CSP, narrow Edge Function CORS, environment separation | Retain deployment-time origin validation |
| A03 Software Supply Chain | Lockfile, Dependabot, `npm audit --omit=dev` | No critical advisory; major dependency upgrades remain tracked below |
| A04 Cryptographic Failures | Supabase TLS/session handling, server-side secrets | No custom cryptography introduced |
| A05 Injection | React escaping, DOMPurify, Zod, parameterized Supabase APIs | Unified auth input is schema validated |
| A06 Insecure Design | Explicit legacy theme migration and account isolation | No automatic cross-account or published-theme mutation |
| A07 Authentication Failures | Supabase Auth, provider linking, device-session vault | Network errors cannot trigger account creation; normal login returns to dashboard |
| A08 Integrity Failures | Versioned theme import with field allow-listing | Unknown theme fields are discarded |
| A09 Logging Failures | Sentry/logger and consent-aware analytics | Auth analytics excludes credentials |
| A10 Exceptional Conditions | Loading/error states and fail-closed redirect validation | Backslash, encoded separator and protocol-relative redirects are rejected |

Dependency audit currently reports advisories in `react-router-dom@6`, `exceljs` transitive archive packages and `@lovable.dev/mcp-js` development tooling. Automated remediation proposes breaking framework changes or an `exceljs` downgrade, so it is not applied without a migration test cycle. Application redirects are independently allow-listed by `getSafeReturnTo`; MCP/esbuild development dependencies are not shipped as production runtime code. Track replacement or major upgrades in the next dependency maintenance release.

## Incident Response

1. Contain: revoke compromised tokens, disable affected integration, and preserve relevant logs.
2. Assess: identify exposed data, affected accounts, and the first unsafe deployment or request.
3. Remediate: deploy a minimal corrective change, add a regression test or policy, and rotate credentials.
4. Communicate: document facts, impact, recovery, and follow-up owners without placing secrets in the repository.

Report security issues privately to `admin@lnkmx.my`.

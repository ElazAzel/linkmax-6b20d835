# 0028. Consolidated Architecture & Security Hardening

Date: 2026-03-23

## Status

Accepted

## Context

The platform had redundant entry points for Supabase (`src/integrations/supabase/` and `src/platform/supabase/`), leading to import confusion and potential maintenance overhead. Additionally, the lack of runtime validation for environment variables caused silent failures in production when configuration was missing. Sentry noise from browser extensions was also consuming error quotas.

## Decision

1.  **Consolidate Supabase Client**: Unified all Supabase logic into `src/platform/supabase/`. Removed the redundant `integrations/` directory.
2.  **Barrel Files**: Implemented `index.ts` exports for `services/`, `hooks/`, and `lib/errors/` to simplify imports and reduce coupling.
3.  **Runtime Env Validation**: Used **Zod** to validate critical environment variables (`VITE_SUPABASE_URL`, etc.) in `main.tsx`.
4.  **Sentry Shielding**: Added strict `beforeSend` filters to suppress noise from browser extensions (`chrome-extension://`, etc.).

## Consequences

- **Pros**:
  - Cleaner import paths (Source of Truth for Supabase).
  - Faster detection of configuration errors (fail-fast).
  - Reduced noise in Sentry monitoring.
- **Cons**:
  - Requires developers to follow the new barrel export pattern.
  - Deployment will fail explicitly if ENV variables are missing.

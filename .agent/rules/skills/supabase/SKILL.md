---
name: supabase
description: Supabase Auth, PostgreSQL, RLS, Storage, RPC, migrations, and Edge Functions for LinkMAX.
---

# Supabase

Use for any change crossing the client-to-database boundary.

## Procedure

1. Identify the actor, resource, ownership rule, and failure behavior.
2. Create an append-only migration for schema, index, trigger, RLS, or RPC changes.
3. Enable RLS and write policies before exposing a table through PostgREST.
4. Validate Edge Function input, verify session/authorization, and keep service-role clients server-only.
5. Test with owner and non-owner sessions; then run relevant TypeScript and browser tests.

## Commands

```bash
npx supabase start
npx supabase migration new <feature_name>
npx supabase db reset
npx supabase functions serve <function-name> --env-file supabase/.env.local
```

Use `supabase db push` only for an explicitly targeted remote project after review. CI deploys reviewed migrations from `main`.

## Guardrails

- Never put service-role credentials in browser code or `VITE_*` variables.
- Client checks improve UX but do not replace RLS or server authorization.
- Do not change a historical migration after it has been applied remotely.

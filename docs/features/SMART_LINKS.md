# Smart Links

Smart Links provide a branded `/s/<slug>` redirect with UTM attribution and a click counter. Public redirects are resolved by the `smartlink-redirect` Edge Function, which calls `increment_smart_link_click` using the service role.

## Lifecycle

Each smart link can have an optional start time, expiry time, and click limit. The database RPC enforces all three conditions atomically while incrementing the counter. A client cannot consume the counter directly because public execution of the RPC is revoked.

The redirect returns `404` for an inactive, not-yet-active, expired, or exhausted link. This deliberately avoids exposing lifecycle state to visitors.

## Safety

- Dashboard creation accepts only `http:` and `https:` targets.
- The edge function appends UTM parameters only when the target does not already define the same key.
- The target URL is not fetched by the platform, so a redirect does not turn into a server-side request.
- Owner CRUD stays protected by the `smart_links` RLS policy.

## Validation

```powershell
npx vitest run src/lib/growth/__tests__/smart-links.test.ts
npm run typecheck:strict
```

Database migration: `supabase/migrations/20260725190000_smart_link_lifecycle.sql`.

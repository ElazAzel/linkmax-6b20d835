# LinkMAX standalone runtime and restore rehearsal

The current production backend remains in Lovable. These tools do not export, execute SQL, deploy functions, create projects, or switch traffic. A successful comparison of supplied files is not proof that an export was complete.

## Runtime

Use Node 24 and the committed `bun.lock` (`bun install --frozen-lockfile` on a clean machine). `npm run build` and `vite.config.ts` retain the Lovable wrapper. `npm run build:standalone` uses a separate Vite plugin graph with TanStack Start, React, Tailwind, tsconfig paths and Nitro's `node-server` preset exactly once. It preserves `src/server.ts`, the existing router, SSR and browser bootstrap. Start with `npm run start:standalone`; `HOST`/`PORT` configure the listener (default port 3000).

Set these **public build-time** values in the build environment or a local `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_APP_DOMAIN=https://your-domain.example
```

An anon JWT is also accepted, but service-role JWTs and secret keys are rejected. Public pages do not require admin credentials. Optional public values are `VITE_SUPABASE_PROJECT_ID` and `VITE_ENABLE_REMOTE_TRANSLATIONS=true`. Only this allowlist is injected; changing the backend or origin requires rebuilding. Server secrets must never use a `VITE_` name. No Sentry upload token, provider token, or database password is needed for the app build. Standalone selects `VITE_RUNTIME_MODE=standalone`, disables Lovable error hooks, and omits the wrapper's preview assets proxy and runtime injection.

Docker uses the committed Bun lock, builds on Node 24, and runs the self-contained Nitro output as the unprivileged `node` user:

```
docker build --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... --build-arg VITE_APP_DOMAIN=https://your-domain.example -t linkmax .
docker run --rm -p 3000:3000 linkmax
```

Docker excludes local environment files, Git, build outputs and temporary exports. Docker itself must be installed separately. Bundled public assets and backend Storage objects still need to be audited for availability at the target origin; no automatic URL rewriting is performed.

## Backend and provider boundary

The app continues to call the configured Supabase backend and its existing edge function URLs. External webhook/cron/MCP endpoints and prices are unchanged. Standalone hosting does not itself migrate these functions. Several backend functions, including `ai-content-generator` and `chatbot-stream`, currently require `LOVABLE_API_KEY` and call the Lovable AI gateway. Full independence for those features is **blocked** until direct-provider credentials, model mapping, server-only adapters, billing/rate limits and contract tests are supplied. This build does not pretend those gateway integrations have been replaced. OAuth provider credentials, SMTP, payment/webhook secrets, bot tokens and scheduled jobs also require a separately authorized backend deployment. None belong in browser variables.

## Ordered schema inventory and replay safety

```
node scripts/portability.mjs inventory > migration-inventory.json
node scripts/portability.mjs plan applied-ledger.json > pending-plan.json
```

The inventory hashes exact SQL bytes with SHA-256. Timestamp Supabase migrations and Drizzle journal entries are ordered together by UTC timestamp (Supabase first on ties), preserving Drizzle journal index ordering. A Drizzle journal/file mismatch fails. Unordered manual repair SQL is listed with checksums under `quarantined`, never automatically included. These scripts include old security-policy repair files; do not apply them blindly to a fresh backend.

The applied ledger is an array of `{ "id": "supabase:...", "sha256": "..." }` records captured and reviewed against the source backend's actual migration history. Unknown entries, altered checksums, duplicate IDs/byte-identical SQL and gaps in applied history fail closed. An empty ledger is valid only for an explicitly verified empty target. The plan is always `executable: false`: chronological order cannot prove semantic independence. Supabase and Drizzle can modify the same objects with different SQL. Review overlap against a full schema export, choose a single baseline, and record which historical entries it subsumes. Never restore a full schema and then replay both histories. Do not run an automatic concatenated SQL bundle.

Fresh-backend reproducibility requires a complete schema baseline, extensions, roles, grants/RLS, triggers/functions, Auth configuration and both migration ledgers. The repository alone is not certified as a complete production schema. Restore the reviewed baseline into an isolated target, then apply only reviewed post-baseline migrations using the normal migration runner. Repeat from empty target and compare canonical schema dumps before considering production.

## Offline data reconciliation

Obtain authorized complete exports first: all application schemas/tables (including IDs and ownership), `auth.users` and identities/password metadata, Storage bucket metadata and actual object bytes, plus a canonical schema dump. Export with appropriate tooling outside this script. A normal application-table CSV export is insufficient. Preserve Auth UUIDs and relationships; copying `public.profiles` cannot migrate logins.

For each export directory provide `manifest.json`, using every table from an independently checked database catalog:

```json
{
  "complete": true,
  "schema": "schema.sql",
  "tables": {"public.pages": "pages.json", "auth.users": "users.json", "auth.identities": "identities.json"},
  "media": [{"bucket": "media", "key": "owner/file.mp3", "file": "objects/file.mp3"}]
}
```

Table files contain full JSON row arrays. Include empty tables and every Storage object. `complete` is an operator attestation after comparing table/bucket catalogs, never inferred by this tool. Canonical schema dumps must use identical options and remove volatile dump metadata in a reviewed, consistent way. Snapshots contain sensitive Auth and user data: keep them in a restricted temporary directory outside source control and remove them according to the export retention policy.

```
node scripts/portability.mjs snapshot /secure/source-export > /secure/source.json
node scripts/portability.mjs snapshot /secure/restored-export > /secure/restored.json
node scripts/portability.mjs reconcile /secure/source.json /secure/restored.json
```

Snapshot generation reads only local files and hashes actual media bytes. Reconciliation compares table presence, counts and canonical full-row hashes (including IDs and ownership), schema hash, bucket/key/size and media hashes, irrespective of row ordering. Missing data or mismatches exit nonzero. `ready: true` means only that supplied snapshots match; it does not authorize cutover. Also verify login flows, RLS/access checks, signed media URLs, public pages, scheduled jobs, integrations and rollback on the isolated restored target. Keep traffic on Lovable until export completeness, restore repetition, reconciliation and operational checks are independently signed off.

Official references checked for this implementation: [TanStack Start hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting), [Nitro Node runtime](https://nitro.build/deploy/runtimes/node), [Lovable hosting and ownership](https://docs.lovable.dev/tips-tricks/deployment-hosting-ownership). The installed Lovable wrapper already registers its framework plugins; the standalone config deliberately does not import it.

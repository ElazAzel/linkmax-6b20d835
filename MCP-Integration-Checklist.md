# LinkMAX MCP integration

## Endpoint and authentication

- Supabase Edge Function: `/functions/v1/mcp`
- OAuth issuer: the configured LinkMAX Supabase project `/auth/v1`
- Accepted audience: `authenticated`
- Every tool forwards the verified bearer token to Supabase, so RLS remains the final authorization boundary.
- The MCP server never uses the service-role key.

## Available tools (v0.3)

Pages are edited through the same private draft the editor uses
(`load_page_draft` / `save_page_draft` / `publish_page_draft`): changes show up
in the owner's editor and go live only on `publish_page`. Saves pass the loaded
revision and the existing chatbot context, so a concurrent editor tab gets a
`draft_conflict` instead of a silent overwrite.

1. `list_my_pages` — the signed-in user's pages and `view_count`.
2. `create_page` — new page via `mcp_create_user_page` (reserved app routes refused), plus a profile block in its draft.
3. `get_block_catalog` — block types an agent may add, required fields, translatable paths, examples, grid sizes.
4. `get_page` — the current draft: page settings and every block with id, type, size and content.
5. `edit_page` — atomic batch of `set_page`, `add_block`, `update_block`, `remove_block`, `move_block` on the draft.
6. `publish_page` — publish the draft (needs a profile block).
7. `get_translation_gaps` — visitor-facing texts missing in the requested languages, with block id and path.
8. `apply_translations` — store agent-written translations as `{ru, en, kk, ...}` values in the draft.
9. `get_analytics_summary` — all pages: events, sessions, visitors, top pages.
10. `get_page_analytics` — one page: views, visitors, clicks, CTR, leads, per-block clicks, sources, devices, countries, daily series, change vs previous period.
11. `audit_page` — 0-100 score, strengths, weaknesses ranked by severity with evidence and the edit that fixes each.
12. `list_my_leads` — CRM leads; optional page filter via `metadata.page_id`.

Logic lives in pure modules (`page-ops.ts`, `translations.ts`, `page-analytics.ts`,
`audit.ts`) with unit tests in `src/lib/mcp/__tests__`; `tools-flow.test.ts`
drives the tools end to end against an in-memory draft.

## Build and deployment checks

```powershell
npm run typecheck
npm run build
npx lovable-mcp-extract-manifest .
```

`npm run build` regenerates `supabase/functions/mcp/index.ts`. On Windows the
prebuild compatibility generator uses a relative esbuild entrypoint because the
SDK Vite adapter currently treats Windows absolute paths as npm specifiers. On
Linux, run the same generator by hand when the Lovable build does not
regenerate the function (`node scripts/generate-mcp.mjs` exits early outside
Windows; drop its platform guard in a temporary copy).

The generated edge function and `.lovable/mcp/manifest.json` are committed
artifacts. Never edit the generated function by hand; change `src/lib/mcp/**`
and rebuild.

## Authorization invariants

- No tool accepts a user ID as an authority input; the user ID always comes from the verified token subject.
- Page edits go through the draft RPCs, which check ownership (or organization page rights) in the database.
- The create-page RPC is executable only by `authenticated` after the hardening migration.
- Database errors are logged without returning raw PostgREST/SQL details to MCP clients.
- Tool inputs have bounded limits and Zod validation.

# LinkMAX MCP integration

## Endpoint and authentication

- Supabase Edge Function: `/functions/v1/mcp`
- OAuth issuer: the configured LinkMAX Supabase project `/auth/v1`
- Accepted audience: `authenticated`
- Every tool forwards the verified bearer token to Supabase, so RLS remains the final authorization boundary.
- The MCP server never uses the service-role key.

## Available tools

1. `list_my_pages` — list the signed-in user's pages and `view_count`.
2. `list_my_leads` — list the signed-in user's CRM leads; optional page filtering uses `metadata.page_id`/`metadata.pageId` because the current leads table is user-scoped.
3. `get_analytics_summary` — summarize events, event types, sessions and visitors from `analytics.metadata`.
4. `create_page` — create a user-owned page through the guarded `mcp_create_user_page` RPC.
5. `get_page_structure` — read an owned page and its ordered blocks.
6. `create_block` — append or insert a block on an owned page.
7. `update_block` — update an owned block's content, style, schedule or position.
8. `update_page` — update allowlisted page settings for an owned page.

## Build and deployment checks

```powershell
npm run typecheck
npm run build
npx lovable-mcp-extract-manifest .
```

`npm run build` regenerates `supabase/functions/mcp/index.ts`. On Windows the
prebuild compatibility generator uses a relative esbuild entrypoint because the
SDK Vite adapter currently treats Windows absolute paths as npm specifiers. On
Linux and CI the official SDK Vite plugin remains enabled.

The generated edge function and `.lovable/mcp/manifest.json` are committed
artifacts. Never edit the generated function by hand; change `src/lib/mcp/**`
and rebuild.

## Authorization invariants

- No tool accepts a user ID as an authority input; the user ID always comes from the verified token subject.
- Page and block mutations perform an explicit ownership lookup and also apply owner filters to the write query.
- The create-page RPC is executable only by `authenticated` after the hardening migration.
- Database errors are logged without returning raw PostgREST/SQL details to MCP clients.
- Tool inputs have bounded limits and Zod validation.

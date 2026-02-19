# Supabase Skill

## Description
Expertise in Supabase backend development, including PostgreSQL, RLS, Edge Functions, Auth, and Storage.

## Capabilities
-   Create and manage database schema migrations.
-   Write secure RLS policies.
-   Develop and deploy Edge Functions (Deno).
-   Configure authentication providers.
-   Manage storage buckets and policies.

## Key Files
-   `supabase/config.toml`
-   `supabase/migrations/*`
-   `supabase/functions/*`
-   `src/integrations/supabase/client.ts`

## Common Commands
-   `supabase start`: Start local dev stack.
-   `supabase db diff -f <name>`: Generate migration.
-   `supabase functions deploy <name>`: Deploy function.

## Workflows

### Creating a New Edge Function
1.  Run `supabase functions new <function_name>`.
2.  Write the logic in `supabase/functions/<function_name>/index.ts` using Deno.
3.  Ensure CORS headers are properly handled, especially for preflight `OPTIONS` requests.
4.  Use standard Supabase clients initialized with Authorization headers passed from the client.
5.  Test locally using `supabase functions serve <function_name>` or `supabase start`.
6.  Deploy using `supabase functions deploy <function_name>`.

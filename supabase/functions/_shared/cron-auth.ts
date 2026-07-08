/**
 * Shared cron authentication helper.
 *
 * Cron-only edge functions deploy with `verify_jwt = false` so that pg_cron
 * (and Supabase service-role callers) can invoke them. Without an in-code
 * auth gate, any internet caller could trigger mass notifications / emails.
 *
 * Allowed callers:
 *   1. Requests carrying the shared `X-Cron-Secret` header matching the
 *      `CRON_SECRET` env var (used by pg_cron via net.http_post).
 *   2. Requests carrying the Supabase service-role key as `Authorization:
 *      Bearer <SERVICE_ROLE_KEY>` (used by internal supabase.functions.invoke
 *      calls from other trusted edge functions).
 *
 * Returns a `Response` with 403 when unauthorized, otherwise `null`.
 */
export function requireCronAuth(req: Request, corsHeaders: Record<string, string> = {}): Response | null {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  const provided = req.headers.get("x-cron-secret") ?? req.headers.get("X-Cron-Secret");
  if (cronSecret && provided && provided === cronSecret) {
    return null;
  }

  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ") && serviceRoleKey) {
    const token = authHeader.slice("Bearer ".length).trim();
    if (token === serviceRoleKey) {
      return null;
    }
  }

  return new Response(JSON.stringify({ error: "Forbidden" }), {
    status: 403,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

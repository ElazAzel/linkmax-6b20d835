// Verifies that a request comes from trusted platform infrastructure
// (pg_cron / DB triggers / other edge functions), not from the public internet.
// deno-lint-ignore no-explicit-any
export async function isInternalCaller(req: Request, adminDb: any): Promise<boolean> {
  const cronSecret = Deno.env.get('CRON_SECRET');
  const provided = req.headers.get('x-cron-secret');
  if (cronSecret && provided && provided === cronSecret) return true;

  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const auth = req.headers.get('authorization') ?? '';
  if (serviceRoleKey && auth.startsWith('Bearer ') && auth.slice(7).trim() === serviceRoleKey) return true;

  const token = req.headers.get('x-internal-token');
  if (token && token.length >= 32) {
    const { data, error } = await adminDb.rpc('verify_internal_job_token', { p_token: token });
    if (!error && data === true) return true;
  }
  return false;
}

// Returns the signed-in user id from the Authorization header, or null.
// deno-lint-ignore no-explicit-any
export async function getCallerUserId(req: Request, adminDb: any): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7).trim();
  if (!token || token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) return null;
  const { data, error } = await adminDb.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id as string;
}

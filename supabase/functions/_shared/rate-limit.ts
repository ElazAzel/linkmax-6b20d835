/**
 * IP rate limit for public endpoints, backed by public.rate_limits
 * (UNIQUE(ip_address, endpoint)). Same table and semantics as create-lead.
 *
 * Fails open: if the table is unavailable we let the request through, so a
 * DB hiccup never drops a real customer's lead or booking.
 */

// deno-lint-ignore no-explicit-any
type Client = any;

export function getClientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function checkIpRateLimit(
  supabase: Client,
  ipAddress: string,
  endpoint: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const { data: existing, error } = await supabase
      .from('rate_limits')
      .select('id, request_count, window_start')
      .eq('ip_address', ipAddress)
      .eq('endpoint', endpoint)
      .maybeSingle();
    if (error) return true;

    if (!existing || existing.window_start < windowStart) {
      await supabase
        .from('rate_limits')
        .upsert(
          { ip_address: ipAddress, endpoint, request_count: 1, window_start: new Date().toISOString() },
          { onConflict: 'ip_address,endpoint' },
        );
      return true;
    }

    if (existing.request_count >= limit) return false;

    await supabase
      .from('rate_limits')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id);
    return true;
  } catch (e) {
    console.error('rate limit check failed, allowing request', e);
    return true;
  }
}

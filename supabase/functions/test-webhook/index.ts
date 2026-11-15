// test-webhook: sends one sample «lead.created» request to the webhook the
// page owner is configuring, and reports the response status. Lets the owner
// check the integration from page settings without submitting a real lead.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { request as httpsRequest } from 'node:https';
import { corsHeaders, createErrorResponse, createSuccessResponse, getSupabaseUser } from '../_shared/utils.ts';
import { checkIpRateLimit } from '../_shared/rate-limit.ts';
import { parseSafeWebhookUrl, selectPublicIPv4 } from '../_shared/webhook-target.ts';

const TIMEOUT_MS = 8000;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return createErrorResponse('Method not allowed', 405);

  try {
    const { user, error: authError } = await getSupabaseUser(req);
    if (authError || !user) return createErrorResponse('Unauthorized', 401);

    const body = await req.json().catch(() => null) as { url?: unknown; secret?: unknown; page_slug?: unknown } | null;
    const target = parseSafeWebhookUrl(body?.url);
    if (!target) return createErrorResponse('A public https URL is required', 400);

    // Per-user limit: the endpoint makes an outbound request on the caller's behalf.
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const allowed = await checkIpRateLimit(admin, `user:${user.id}`, 'test-webhook', 10, 60);
    if (!allowed) return createErrorResponse('Too many test requests, try again in a minute', 429);

    // Resolve once and connect to the validated IP, retaining the original host
    // for TLS certificate verification and the HTTP Host header. Resolving again
    // inside fetch would allow DNS rebinding between validation and connection.
    const addresses = await Deno.resolveDns(target.hostname, 'A').catch(() => []);
    const address = selectPublicIPv4(addresses);
    if (!address) {
      return createSuccessResponse({ ok: false });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-LinkMAX-Event': 'lead.created',
      'X-LinkMAX-Test': 'true',
      'User-Agent': 'LinkMAX-Webhooks/1.0',
    };
    if (typeof body?.secret === 'string' && body.secret) headers['X-LinkMAX-Secret'] = body.secret.slice(0, 256);

    // Same shape as the real delivery in submit-lead.
    const payload = {
      event: 'lead.created',
      test: true,
      timestamp: new Date().toISOString(),
      data: {
        lead_id: '00000000-0000-0000-0000-000000000000',
        page_id: null,
        page_slug: typeof body?.page_slug === 'string' ? body.page_slug.slice(0, 64) : null,
        form_data: { name: 'Test Lead', phone: '+7 700 000 0000', email: 'test@example.com', message: 'Test request from LinkMAX' },
        metadata: { source: 'webhook_test' },
      },
    };

    const started = Date.now();
    try {
      const status = await new Promise<number>((resolve, reject) => {
        const request = httpsRequest({
          hostname: address,
          port: target.port || 443,
          path: `${target.pathname}${target.search}`,
          method: 'POST',
          servername: target.hostname,
          headers: { ...headers, Host: target.host },
          agent: false,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }, (response) => {
          response.resume();
          resolve(response.statusCode ?? 0);
        });
        request.on('error', reject);
        request.end(JSON.stringify(payload));
      });
      return createSuccessResponse({
        ok: status >= 200 && status < 300,
        status,
        durationMs: Date.now() - started,
      });
    } catch {
      return createSuccessResponse({ ok: false, durationMs: Date.now() - started });
    }
  } catch (err) {
    console.error('test-webhook failed:', err instanceof Error ? err.message : String(err));
    return createErrorResponse('Webhook test failed', 500);
  }
});

/**
 * Retries indexing_submissions with status=provider_failed and retry_count < 5.
 * Uses exponential backoff via next_retry_at (set when a row fails).
 * Called by pg_cron every 15 minutes.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INDEXNOW_KEY = Deno.env.get('INDEXNOW_KEY') || 'linkmax-indexnow-key-2026';
const HOST = Deno.env.get('PUBLIC_HOST') || 'lnkmx.my';
const MAX_RETRIES = 5;

const BACKOFF_MINUTES = [5, 30, 120, 720, 1440]; // 5m → 30m → 2h → 12h → 24h

function providerUrl(provider: string): string | null {
  if (provider === 'bing') return 'https://www.bing.com/indexnow';
  if (provider === 'yandex') return 'https://yandex.com/indexnow';
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const now = new Date().toISOString();

  // Fetch failed rows due for retry (limit 100 per run)
  const { data: rows, error } = await db
    .from('indexing_submissions')
    .select('id, target_url, provider, retry_count')
    .eq('submission_status', 'provider_failed')
    .lt('retry_count', MAX_RETRIES)
    .or(`next_retry_at.is.null,next_retry_at.lte.${now}`)
    .in('provider', ['bing', 'yandex'])
    .limit(100);

  if (error) {
    console.error('[retry-failed-indexing] fetch error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!rows || rows.length === 0) {
    return new Response(JSON.stringify({ success: true, retried: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Group by provider for batch IndexNow submission
  const byProvider = new Map<string, typeof rows>();
  for (const r of rows) {
    if (!byProvider.has(r.provider)) byProvider.set(r.provider, []);
    byProvider.get(r.provider)!.push(r);
  }

  let totalRetried = 0;
  let totalSucceeded = 0;

  for (const [provider, providerRows] of byProvider.entries()) {
    const url = providerUrl(provider);
    if (!url) continue;

    const urls = providerRows
      .map((r) => r.target_url)
      .filter((u) => u.startsWith(`https://${HOST}/`));
    if (urls.length === 0) continue;

    let httpStatus = 0;
    let success = false;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: HOST,
          key: INDEXNOW_KEY,
          keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
          urlList: urls.slice(0, 100),
        }),
      });
      httpStatus = res.status;
      success = httpStatus >= 200 && httpStatus < 300;
    } catch (e) {
      console.error(`[retry-failed-indexing] ${provider} fetch error:`, e);
    }

    // Update each row
    for (const r of providerRows) {
      const newCount = (r.retry_count ?? 0) + 1;
      const backoffMin =
        BACKOFF_MINUTES[Math.min(newCount, BACKOFF_MINUTES.length - 1)];
      const nextRetry = success || newCount >= MAX_RETRIES
        ? null
        : new Date(Date.now() + backoffMin * 60_000).toISOString();

      await db
        .from('indexing_submissions')
        .update({
          submission_status: success ? 'sent' : 'provider_failed',
          http_status: httpStatus || null,
          retry_count: newCount,
          last_attempted_at: now,
          next_retry_at: nextRetry,
        })
        .eq('id', r.id);

      totalRetried++;
      if (success) totalSucceeded++;
    }
  }

  console.log(
    `[retry-failed-indexing] retried=${totalRetried} succeeded=${totalSucceeded}`,
  );

  return new Response(
    JSON.stringify({ success: true, retried: totalRetried, succeeded: totalSucceeded }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});

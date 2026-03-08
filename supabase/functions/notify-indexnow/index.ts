/**
 * IndexNow notification Edge Function
 * Submits URLs to search engines when pages are published/updated
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// IndexNow key — stored as a static file and submitted to search engines
const INDEXNOW_KEY = 'linkmax-indexnow-key-2026';
const HOST = 'lnkmx.my';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = await req.json() as { urls?: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: 'urls array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Limit to 100 URLs per request
    const validUrls = urls.slice(0, 100).filter(u => u.startsWith('https://'));

    if (validUrls.length === 0) {
      return new Response(JSON.stringify({ error: 'no valid URLs' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Submit to IndexNow (Bing/Yandex)
    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
      urlList: validUrls,
    };

    const results: { endpoint: string; status: number }[] = [];

    // Submit to Bing IndexNow
    try {
      const bingRes = await fetch('https://www.bing.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      results.push({ endpoint: 'bing', status: bingRes.status });
    } catch (e) {
      console.error('[IndexNow] Bing error:', e);
      results.push({ endpoint: 'bing', status: 0 });
    }

    // Submit to Yandex IndexNow
    try {
      const yandexRes = await fetch('https://yandex.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      results.push({ endpoint: 'yandex', status: yandexRes.status });
    } catch (e) {
      console.error('[IndexNow] Yandex error:', e);
      results.push({ endpoint: 'yandex', status: 0 });
    }

    console.log('[IndexNow] Submitted', validUrls.length, 'URLs. Results:', results);

    return new Response(JSON.stringify({ success: true, submitted: validUrls.length, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[IndexNow] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

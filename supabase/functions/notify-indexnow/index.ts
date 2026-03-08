/**
 * IndexNow notification Edge Function
 * Submits URLs to search engines and logs every submission to indexing_submissions table.
 * Accepts: { urls: string[], page_id?: string, action_type?: string, child_type?: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INDEXNOW_KEY = 'linkmax-indexnow-key-2026';
const HOST = 'lnkmx.my';

interface SubmitRequest {
  urls?: string[];
  page_id?: string;
  action_type?: string;  // publish | update | unpublish | delete
  child_type?: string;   // null | service | event
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json() as SubmitRequest;
    const { urls, page_id, action_type = 'update', child_type } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: 'urls array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validUrls = urls.slice(0, 100).filter(u => u.startsWith('https://'));
    if (validUrls.length === 0) {
      return new Response(JSON.stringify({ error: 'no valid URLs' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const batchId = crypto.randomUUID().slice(0, 8);
    const payload = {
      host: HOST,
      key: INDEXNOW_KEY,
      keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
      urlList: validUrls,
    };

    const providers = [
      { name: 'bing', url: 'https://www.bing.com/indexnow' },
      { name: 'yandex', url: 'https://yandex.com/indexnow' },
    ];

    const results: { provider: string; status: number }[] = [];

    for (const prov of providers) {
      let httpStatus = 0;
      try {
        const res = await fetch(prov.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        httpStatus = res.status;
      } catch (e) {
        console.error(`[IndexNow] ${prov.name} error:`, e);
      }
      results.push({ provider: prov.name, status: httpStatus });

      // Log each provider submission per URL
      if (page_id) {
        const rows = validUrls.map(url => ({
          page_id,
          target_url: url,
          child_type: child_type || null,
          action_type,
          provider: prov.name,
          submission_status: httpStatus >= 200 && httpStatus < 300 ? 'sent' : httpStatus === 0 ? 'failed' : 'sent',
          http_status: httpStatus || null,
          batch_id: batchId,
        }));
        await db.from('indexing_submissions').insert(rows);
      }
    }

    // Update last_indexnow_at on the page
    if (page_id) {
      await db.from('pages').update({ last_indexnow_at: new Date().toISOString() }).eq('id', page_id);
    }

    console.log('[IndexNow] Submitted', validUrls.length, 'URLs. Batch:', batchId, 'Results:', results);

    return new Response(JSON.stringify({ success: true, submitted: validUrls.length, batch_id: batchId, results }), {
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

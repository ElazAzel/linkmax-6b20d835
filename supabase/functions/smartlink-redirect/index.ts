// SmartLink redirect (P1 — Growth OS)
// Resolves /s/:slug -> target_url, atomically increments click_count,
// writes a canonical `link_click` event into `analytics` (metadata.event).
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function appendUtm(url: string, sl: Record<string, unknown>): string {
  try {
    const u = new URL(url);
    const map: Record<string, string> = {
      utm_source: sl.utm_source as string,
      utm_medium: sl.utm_medium as string,
      utm_campaign: sl.utm_campaign as string,
      utm_content: sl.utm_content as string,
      utm_term: sl.utm_term as string,
    };
    for (const [k, v] of Object.entries(map)) {
      if (v && !u.searchParams.has(k)) u.searchParams.set(k, v);
    }
    return u.toString();
  } catch {
    return url;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    // path: /smartlink-redirect/:slug OR ?slug=
    const parts = url.pathname.split('/').filter(Boolean);
    const slug = url.searchParams.get('slug') ?? parts[parts.length - 1];

    if (!slug || slug === 'smartlink-redirect') {
      return new Response(JSON.stringify({ error: 'missing slug' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data, error } = await supabase.rpc('increment_smart_link_click', { _slug: slug });
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      return new Response(JSON.stringify({ error: 'not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const row = Array.isArray(data) ? data[0] : data;
    const finalUrl = appendUtm(row.target_url, row);

    // canonical link_click event (legacy event_type = 'click')
    await supabase.from('analytics').insert({
      page_id: row.page_id ?? null,
      block_id: null,
      event_type: 'click',
      metadata: {
        event: 'link_click',
        taxonomy_version: 1,
        source_object_type: 'link',
        source_object_id: row.id,
        slug,
        ua: req.headers.get('user-agent') ?? null,
        referer: req.headers.get('referer') ?? null,
      },
    });

    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: finalUrl, 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

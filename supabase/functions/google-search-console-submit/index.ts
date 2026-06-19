/**
 * Google Search Console auto-submit edge function.
 *
 * Two modes:
 *  - action="submit_sitemap" → submits https://lnkmx.my/sitemap.xml to GSC
 *  - action="inspect_url"    → triggers URL inspection (read) so Google sees a fresh signal
 *  - action="setup"          → tries to auto-verify the site via meta token, then add the property
 *
 * Requires the Google Search Console connector to be linked in Lovable.
 * If LOVABLE_API_KEY or GOOGLE_SEARCH_CONSOLE_API_KEY is missing, the function
 * returns 200 with { skipped: "not_connected" } so callers don't fail.
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const HOST = Deno.env.get('PUBLIC_HOST') || 'lnkmx.my';
const SITE = `https://${HOST}/`;
const GATEWAY = 'https://connector-gateway.lovable.dev/google_search_console';

interface Body {
  action: 'submit_sitemap' | 'inspect_url' | 'setup';
  url?: string;
  page_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const lovableKey = Deno.env.get('LOVABLE_API_KEY');
  const gscKey = Deno.env.get('GOOGLE_SEARCH_CONSOLE_API_KEY');

  if (!lovableKey || !gscKey) {
    return new Response(
      JSON.stringify({ success: true, skipped: 'not_connected' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const headers = {
    Authorization: `Bearer ${lovableKey}`,
    'X-Connection-Api-Key': gscKey,
    'Content-Type': 'application/json',
  };

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  async function logSubmission(target: string, status: string, http?: number) {
    await db.from('indexing_submissions').insert({
      page_id: body.page_id || null,
      target_url: target,
      provider: 'google_search_console',
      action_type: body.action,
      submission_status: status,
      http_status: http || null,
    });
  }

  try {
    if (body.action === 'setup') {
      // 1) Get META verification token
      const tokenRes = await fetch(`${GATEWAY}/siteVerification/v1/token`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          site: { identifier: SITE, type: 'SITE' },
          verificationMethod: 'META',
        }),
      });
      if (!tokenRes.ok) {
        const txt = await tokenRes.text();
        return new Response(
          JSON.stringify({ error: 'token_failed', status: tokenRes.status, body: txt }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
      const tokenData = await tokenRes.json();
      // The meta tag must already be served at SITE for this to succeed.
      // Caller is responsible for ensuring it's in <head>.
      const verifyRes = await fetch(
        `${GATEWAY}/siteVerification/v1/webResource?verificationMethod=META`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ site: { identifier: SITE, type: 'SITE' } }),
        },
      );
      const verifyOk = verifyRes.ok;
      // Always attempt to add the site to Search Console
      const encoded = encodeURIComponent(SITE);
      const addRes = await fetch(
        `${GATEWAY}/webmasters/v3/sites/${encoded}`,
        { method: 'PUT', headers },
      );

      return new Response(
        JSON.stringify({
          token: tokenData.token,
          verified: verifyOk,
          added: addRes.ok,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (body.action === 'submit_sitemap') {
      const sitemapUrl = encodeURIComponent(`${SITE}sitemap.xml`);
      const encoded = encodeURIComponent(SITE);
      const res = await fetch(
        `${GATEWAY}/webmasters/v3/sites/${encoded}/sitemaps/${sitemapUrl}`,
        { method: 'PUT', headers },
      );
      const ok = res.ok;
      await logSubmission(
        `${SITE}sitemap.xml`,
        ok ? 'sent' : 'provider_failed',
        res.status,
      );
      return new Response(
        JSON.stringify({ success: ok, http_status: res.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (body.action === 'inspect_url') {
      if (!body.url) {
        return new Response(JSON.stringify({ error: 'url_required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // URL inspection signals Google to look at the URL again.
      const res = await fetch(`${GATEWAY}/v1/urlInspection/index:inspect`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inspectionUrl: body.url,
          siteUrl: SITE,
        }),
      });
      const ok = res.ok;
      await logSubmission(
        body.url,
        ok ? 'sent' : 'provider_failed',
        res.status,
      );
      return new Response(
        JSON.stringify({ success: ok, http_status: res.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify({ error: 'unknown_action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[google-search-console-submit] error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

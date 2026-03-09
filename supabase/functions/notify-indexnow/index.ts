/**
 * IndexNow notification Edge Function
 * Submits URLs to search engines and logs every submission to indexing_submissions table.
 * 
 * P2.11: Diff-based orchestration — accepts transition metadata per child entry,
 *        logs skip entries for non-submitted transitions, stores diff_summary.
 * 
 * Accepts: { urls: string[], page_id?: string, action_type?: string, child_type?: string,
 *            child_entries?: Array<{ url, item_id, slug, transition? }>,
 *            skip_entries?: Array<{ item_id, slug, transition }>,
 *            diff_summary?: { total, submitted, skipped, is_first_snapshot },
 *            skip_reason?: string }
 * 
 * Status semantics:
 * - sent: provider responded 2xx
 * - provider_failed: provider responded non-2xx or network error
 * - skipped_no_change: child intentionally not submitted (unchanged or non-submittable transition)
 * - skipped_transition: child state changed but doesn't require submission
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const INDEXNOW_KEY = 'linkmax-indexnow-key-2026';
const HOST = 'lnkmx.my';

interface ChildEntry {
  url: string;
  item_id: string;
  slug: string;
  transition?: string;
}

interface SkipEntry {
  item_id: string;
  slug: string;
  transition: string;
}

interface DiffSummary {
  total: number;
  submitted: number;
  skipped: number;
  is_first_snapshot: boolean;
}

interface SubmitRequest {
  urls?: string[];
  page_id?: string;
  action_type?: string;
  child_type?: string;
  child_entries?: ChildEntry[];
  skip_entries?: SkipEntry[];
  diff_summary?: DiffSummary;
  skip_reason?: string;
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
    const { urls, page_id, action_type = 'update', child_type, child_entries, skip_entries, diff_summary, skip_reason } = body;

    // Build the child metadata lookup: url → { item_id, slug, transition }
    const childMeta = new Map<string, { item_id: string; slug: string; transition?: string }>();
    if (child_entries && Array.isArray(child_entries)) {
      for (const entry of child_entries) {
        if (entry.url && entry.item_id) {
          childMeta.set(entry.url, { item_id: entry.item_id, slug: entry.slug, transition: entry.transition });
        }
      }
    }

    // Merge child URLs into urls array
    const allUrls = [...(urls || [])];
    for (const entry of (child_entries || [])) {
      if (entry.url && !allUrls.includes(entry.url)) {
        allUrls.push(entry.url);
      }
    }

    if (allUrls.length === 0 && (!skip_entries || skip_entries.length === 0)) {
      // Log skip if page_id provided
      if (page_id && skip_reason) {
        await db.from('indexing_submissions').insert({
          page_id,
          target_url: `https://${HOST}/unknown`,
          child_type: child_type || null,
          action_type,
          provider: 'none',
          submission_status: `skipped_${skip_reason}`,
          skip_reason,
          batch_id: crypto.randomUUID().slice(0, 8),
        });
      }
      return new Response(JSON.stringify({ error: 'urls array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const batchId = crypto.randomUUID().slice(0, 8);

    // P2.11: Log skipped child transitions (no HTTP call, just observability)
    if (page_id && skip_entries && skip_entries.length > 0) {
      const skipRows = skip_entries.map(entry => ({
        page_id,
        target_url: `https://${HOST}/${urls?.[0]?.split('/')[3] || 'unknown'}/services/${entry.slug}`,
        child_type: 'service',
        child_item_id: entry.item_id,
        child_slug: entry.slug,
        action_type: entry.transition || 'skip',
        provider: 'none',
        submission_status: 'skipped_transition',
        skip_reason: entry.transition,
        batch_id: batchId,
      }));
      await db.from('indexing_submissions').insert(skipRows);
    }

    const validUrls = allUrls.slice(0, 100).filter(u => u.startsWith('https://'));
    if (validUrls.length === 0) {
      // All URLs were skipped but skip_entries were logged
      if (skip_entries && skip_entries.length > 0) {
        const summary = diff_summary
          ? `Diff: ${diff_summary.total} total, ${diff_summary.submitted} submitted, ${diff_summary.skipped} skipped`
          : `${skip_entries.length} children skipped`;
        console.log(`[IndexNow] No URLs to submit. ${summary}. Batch: ${batchId}`);
        return new Response(JSON.stringify({ success: true, submitted: 0, skipped: skip_entries.length, batch_id: batchId }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'no valid URLs' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    const results: { provider: string; status: number; submission_status: string }[] = [];

    for (const prov of providers) {
      let httpStatus = 0;
      let submissionStatus = 'provider_failed';
      
      try {
        const res = await fetch(prov.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        httpStatus = res.status;
        submissionStatus = httpStatus >= 200 && httpStatus < 300 ? 'sent' : 'provider_failed';
      } catch (e) {
        console.error(`[IndexNow] ${prov.name} error:`, e);
        submissionStatus = 'provider_failed';
      }
      
      results.push({ provider: prov.name, status: httpStatus, submission_status: submissionStatus });

      // Log each provider submission with child metadata + transition
      if (page_id) {
        const rows = validUrls.map(url => {
          const meta = childMeta.get(url);
          return {
            page_id,
            target_url: url,
            child_type: meta ? 'service' : (child_type || null),
            child_item_id: meta?.item_id || null,
            child_slug: meta?.slug || null,
            action_type: meta?.transition || action_type,
            provider: prov.name,
            submission_status: submissionStatus,
            http_status: httpStatus || null,
            batch_id: batchId,
          };
        });
        await db.from('indexing_submissions').insert(rows);
      }
    }

    // Update last_indexnow_at on the page
    if (page_id) {
      await db.from('pages').update({ last_indexnow_at: new Date().toISOString() }).eq('id', page_id);
    }

    const diffLog = diff_summary
      ? ` Diff: ${diff_summary.total} total, ${diff_summary.submitted} submitted, ${diff_summary.skipped} skipped, first=${diff_summary.is_first_snapshot}`
      : '';
    console.log(`[IndexNow] Submitted ${validUrls.length} URLs. Batch: ${batchId}.${diffLog} Results:`, results);

    return new Response(JSON.stringify({
      success: true,
      submitted: validUrls.length,
      skipped: skip_entries?.length || 0,
      batch_id: batchId,
      results,
      diff_summary: diff_summary || null,
    }), {
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

/**
 * IndexNow client-side helper
 * Handles throttling, quality gate, and passes page_id for server-side logging.
 * All real logging happens server-side in the edge function.
 */
import { supabase } from '@/platform/supabase/client';

// Module-level throttle state
const lastSentMap = new Map<string, number>();
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export type IndexNowResult = 'sent' | 'throttled' | 'not_indexable' | 'no_slug' | 'error';

/**
 * Send IndexNow notification for a page if it passes quality gate + throttle.
 * Now passes page_id and action_type so the edge function can log submissions.
 */
export async function notifyIndexNow(
  slug: string | undefined,
  qualityScore: number,
  isPublished: boolean,
  pageId?: string,
  actionType: string = 'update'
): Promise<IndexNowResult> {
  if (!slug) return 'no_slug';
  if (!isPublished || qualityScore < 40) return 'not_indexable';

  const lastSent = lastSentMap.get(slug) || 0;
  if (Date.now() - lastSent < THROTTLE_MS) return 'throttled';

  try {
    lastSentMap.set(slug, Date.now());
    const pageUrl = `https://lnkmx.my/${slug}`;
    
    await supabase.functions.invoke('notify-indexnow', {
      body: {
        urls: [pageUrl],
        page_id: pageId || undefined,
        action_type: actionType,
      }
    });

    return 'sent';
  } catch {
    return 'error';
  }
}

/**
 * Fetch server-authoritative search diagnostics for a page.
 * This is the single source of truth — client-side scoring is only for preview.
 */
export async function fetchPageSearchDiagnostics(pageId: string) {
  const { data, error } = await supabase.rpc('get_page_search_diagnostics', {
    p_page_id: pageId,
  });
  if (error) throw error;
  return data as {
    page_id: string;
    slug: string;
    is_published: boolean;
    quality_score: number;
    quality_breakdown: Record<string, { passed: boolean; points: number }> | null;
    index_exclusion_reasons: string[] | null;
    is_indexable: boolean;
    included_in_sitemap: boolean;
    last_indexnow_at: string | null;
    service_slugs: Record<string, string> | null;
    child_page_count: number;
    canonical_url: string;
    recent_submissions: Array<{
      id: string;
      target_url: string;
      provider: string;
      action_type: string;
      status: string;
      skip_reason: string | null;
      http_status: number | null;
      created_at: string;
    }>;
    diagnostics_at: string;
  };
}

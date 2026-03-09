/**
 * IndexNow client-side helper
 * Handles throttling, quality gate, and passes page_id for server-side logging.
 * All real logging happens server-side in the edge function.
 * 
 * P2.9: Now supports child service URL submissions alongside parent URL.
 */
import { supabase } from '@/platform/supabase/client';

// Module-level throttle state
const lastSentMap = new Map<string, number>();
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export type IndexNowResult = 'sent' | 'throttled' | 'not_indexable' | 'no_slug' | 'error';

interface ChildEntry {
  url: string;
  item_id: string;
  slug: string;
}

/** Shape of a single service_slugs entry */
interface ServiceSlugEntryRaw {
  slug: string;
  state: string;
  title: string;
}

/**
 * Send IndexNow notification for a page + its eligible child service URLs.
 * Passes page_id so the edge function can log submissions with child metadata.
 */
export async function notifyIndexNow(
  slug: string | undefined,
  qualityScore: number,
  isPublished: boolean,
  pageId?: string,
  actionType: string = 'update',
  serviceSlugs?: Record<string, ServiceSlugEntryRaw> | null,
): Promise<IndexNowResult> {
  if (!slug) return 'no_slug';
  if (!isPublished || qualityScore < 40) return 'not_indexable';

  const lastSent = lastSentMap.get(slug) || 0;
  if (Date.now() - lastSent < THROTTLE_MS) return 'throttled';

  try {
    lastSentMap.set(slug, Date.now());
    const pageUrl = `https://lnkmx.my/${slug}`;

    // Build child entries for eligible (active) services
    const childEntries: ChildEntry[] = [];
    if (serviceSlugs && typeof serviceSlugs === 'object') {
      for (const [itemId, entry] of Object.entries(serviceSlugs)) {
        if (entry && typeof entry === 'object' && entry.state === 'active' && entry.slug) {
          childEntries.push({
            url: `https://lnkmx.my/${slug}/services/${entry.slug}`,
            item_id: itemId,
            slug: entry.slug,
          });
        }
      }
    }
    
    await supabase.functions.invoke('notify-indexnow', {
      body: {
        urls: [pageUrl],
        page_id: pageId || undefined,
        action_type: actionType,
        child_entries: childEntries.length > 0 ? childEntries : undefined,
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
  return data as unknown as SearchDiagnostics;
}

export interface ChildEntityDetail {
  id: string;
  title: string;
  slug: string;
  state: 'eligible' | 'excluded_thin' | 'removed' | 'parent_not_indexable' | 'active' | 'thin';
  url: string;
  last_indexnow_at: string | null;
  last_submission_status: string | null;
}

export interface ChildSummary {
  total: number;
  eligible: number;
  excluded_thin: number;
  removed: number;
  parent_not_indexable: number;
}

/** New id-keyed format: { [itemId]: { slug, state, title } } */
export type ServiceSlugsMap = Record<string, { slug: string; state: string; title: string }>;

export interface SearchDiagnostics {
  page_id: string;
  slug: string;
  is_published: boolean;
  quality_score: number;
  quality_breakdown: Record<string, { passed: boolean; points: number }> | null;
  index_exclusion_reasons: string[] | null;
  is_indexable: boolean;
  included_in_sitemap: boolean;
  last_indexnow_at: string | null;
  service_slugs: ServiceSlugsMap | null;
  child_page_count: number;
  child_summary: ChildSummary | null;
  child_details: ChildEntityDetail[] | null;
  canonical_url: string;
  recent_submissions: Array<{
    id: string;
    target_url: string;
    child_type: string | null;
    child_item_id: string | null;
    child_slug: string | null;
    provider: string;
    action_type: string;
    status: string;
    skip_reason: string | null;
    http_status: number | null;
    created_at: string;
  }>;
  diagnostics_at: string;
}

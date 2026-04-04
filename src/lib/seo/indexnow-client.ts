/**
 * IndexNow client-side helper
 * Handles throttling, quality gate, diff-based child submission, and passes page_id for server-side logging.
 * All real logging happens server-side in the edge function.
 * 
 * P2.11: Diff-based child indexing — only submits child URLs whose search state actually changed.
 */
import { supabase } from '@/platform/supabase/client';

// Module-level throttle state
const lastSentMap = new Map<string, number>();
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export type IndexNowResult = 'sent' | 'throttled' | 'not_indexable' | 'no_slug' | 'error' | 'no_changes';

/** Shape of a single service_slugs entry */
export interface ServiceSlugEntryRaw {
  slug: string;
  state: string;
  title: string;
}

// ─── Child Diff Engine ───────────────────────────────────────────────

export type ChildTransition =
  | 'new_active'
  | 'restored'
  | 'thin_to_active'
  | 'active_to_thin'
  | 'active_to_removed'
  | 'unchanged_active'
  | 'slug_changed'
  | 'unchanged_other';

export interface ChildDiffResult {
  itemId: string;
  slug: string;
  transition: ChildTransition;
  shouldSubmit: boolean;
}

/**
 * Pure function: computes deterministic transitions between old and new service_slugs snapshots.
 * Keyed by itemId for stable identity across renames.
 */
export function computeChildDiff(
  oldSlugs: Record<string, ServiceSlugEntryRaw> | null | undefined,
  newSlugs: Record<string, ServiceSlugEntryRaw> | null | undefined,
): ChildDiffResult[] {
  const results: ChildDiffResult[] = [];
  const oldMap = oldSlugs ?? {};
  const newMap = newSlugs ?? {};

  // All item IDs from both snapshots
  const allIds = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);

  for (const itemId of allIds) {
    const oldEntry = oldMap[itemId];
    const newEntry = newMap[itemId];

    // Item removed entirely from new snapshot
    if (!newEntry) {
      if (oldEntry?.state === 'active') {
        results.push({ itemId, slug: oldEntry.slug, transition: 'active_to_removed', shouldSubmit: false });
      }
      // If old was already thin/removed, no meaningful transition
      continue;
    }

    const slug = newEntry.slug;

    // Brand new item
    if (!oldEntry) {
      if (newEntry.state === 'active') {
        results.push({ itemId, slug, transition: 'new_active', shouldSubmit: true });
      } else {
        results.push({ itemId, slug, transition: 'unchanged_other', shouldSubmit: false });
      }
      continue;
    }

    // Both exist — compare states
    const oldState = oldEntry.state;
    const newState = newEntry.state;

    // Slug changed with active state → new URL needs submission
    if (oldState === 'active' && newState === 'active' && oldEntry.slug !== newEntry.slug) {
      results.push({ itemId, slug, transition: 'slug_changed', shouldSubmit: true });
      continue;
    }

    // State transitions
    if (oldState === newState) {
      if (newState === 'active') {
        results.push({ itemId, slug, transition: 'unchanged_active', shouldSubmit: false });
      } else {
        results.push({ itemId, slug, transition: 'unchanged_other', shouldSubmit: false });
      }
    } else if (oldState === 'removed' && newState === 'active') {
      results.push({ itemId, slug, transition: 'restored', shouldSubmit: true });
    } else if (oldState === 'thin' && newState === 'active') {
      results.push({ itemId, slug, transition: 'thin_to_active', shouldSubmit: true });
    } else if (oldState === 'active' && newState === 'thin') {
      results.push({ itemId, slug, transition: 'active_to_thin', shouldSubmit: false });
    } else if (oldState === 'active' && newState === 'removed') {
      results.push({ itemId, slug, transition: 'active_to_removed', shouldSubmit: false });
    } else {
      // Any other transition (thin→removed, removed→thin, etc.)
      results.push({ itemId, slug, transition: 'unchanged_other', shouldSubmit: false });
    }
  }

  return results;
}

// ─── Submission Interface ────────────────────────────────────────────

interface ChildEntry {
  url: string;
  item_id: string;
  slug: string;
  transition?: string;
}

/**
 * Send IndexNow notification for a page + only changed child service URLs.
 * Uses diff engine to determine which children actually need submission.
 * 
 * @param previousServiceSlugs - snapshot from previous save (null on first save = submit all active)
 * @param currentServiceSlugs - snapshot from current save
 */
export async function notifyIndexNow(
  slug: string | undefined,
  qualityScore: number,
  isPublished: boolean,
  pageId?: string,
  actionType: string = 'update',
  currentServiceSlugs?: Record<string, ServiceSlugEntryRaw> | null,
  previousServiceSlugs?: Record<string, ServiceSlugEntryRaw> | null,
): Promise<IndexNowResult> {
  if (!slug) return 'no_slug';
  if (!isPublished || qualityScore < 25) return 'not_indexable';

  // Compute child diff
  const diff = computeChildDiff(previousServiceSlugs, currentServiceSlugs);
  const childrenToSubmit = diff.filter(d => d.shouldSubmit);
  const skippedChildren = diff.filter(d => !d.shouldSubmit && d.transition !== 'unchanged_active' && d.transition !== 'unchanged_other');

  // Determine if parent URL should be sent
  // Send parent only on first save (no previous snapshot) or when there are child changes
  const isFirstSnapshot = previousServiceSlugs === null || previousServiceSlugs === undefined;
  const hasChildChanges = childrenToSubmit.length > 0 || skippedChildren.length > 0;
  const shouldSendParent = isFirstSnapshot || hasChildChanges;

  // If nothing changed at all, skip entirely
  if (!shouldSendParent && childrenToSubmit.length === 0 && skippedChildren.length === 0) {
    return 'no_changes';
  }

  // Throttle check (on parent slug)
  const lastSent = lastSentMap.get(slug) || 0;
  if (Date.now() - lastSent < THROTTLE_MS) return 'throttled';

  try {
    lastSentMap.set(slug, Date.now());
    const pageUrl = `https://lnkmx.my/${slug}`;

    // Build child entries only for items that need submission
    const childEntries: ChildEntry[] = childrenToSubmit.map(d => ({
      url: `https://lnkmx.my/${slug}/services/${d.slug}`,
      item_id: d.itemId,
      slug: d.slug,
      transition: d.transition,
    }));

    // Build skip entries for logging (transitions that changed but don't need submission)
    const skipEntries = skippedChildren.map(d => ({
      item_id: d.itemId,
      slug: d.slug,
      transition: d.transition,
    }));

    await supabase.functions.invoke('notify-indexnow', {
      body: {
        urls: shouldSendParent ? [pageUrl] : [],
        page_id: pageId || undefined,
        action_type: actionType,
        child_entries: childEntries.length > 0 ? childEntries : undefined,
        skip_entries: skipEntries.length > 0 ? skipEntries : undefined,
        diff_summary: {
          total: diff.length,
          submitted: childrenToSubmit.length,
          skipped: diff.length - childrenToSubmit.length,
          is_first_snapshot: isFirstSnapshot,
        },
      }
    });

    return 'sent';
  } catch {
    return 'error';
  }
}

// ─── Diagnostics (unchanged) ────────────────────────────────────────

/**
 * Fetch server-authoritative search diagnostics for a page.
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

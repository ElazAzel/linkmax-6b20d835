/**
 * IndexNow client-side helper
 * Handles throttling, quality gate, and last-sent tracking
 */
import { supabase } from '@/platform/supabase/client';

// Module-level throttle state
const lastSentMap = new Map<string, number>();
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export type IndexNowResult = 'sent' | 'throttled' | 'not_indexable' | 'no_slug' | 'error';

/**
 * Send IndexNow notification for a page if it passes quality gate + throttle
 */
export async function notifyIndexNow(
  slug: string | undefined,
  qualityScore: number,
  isPublished: boolean
): Promise<IndexNowResult> {
  if (!slug) return 'no_slug';
  if (!isPublished || qualityScore < 40) return 'not_indexable';

  const lastSent = lastSentMap.get(slug) || 0;
  if (Date.now() - lastSent < THROTTLE_MS) return 'throttled';

  try {
    lastSentMap.set(slug, Date.now());
    const pageUrl = `https://lnkmx.my/${slug}`;
    
    await supabase.functions.invoke('notify-indexnow', {
      body: { urls: [pageUrl] }
    });

    // Update last_indexnow_at on the page (fire and forget)
    supabase
      .from('pages')
      .update({ last_indexnow_at: new Date().toISOString() })
      .eq('slug', slug)
      .then(() => {});

    return 'sent';
  } catch {
    return 'error';
  }
}

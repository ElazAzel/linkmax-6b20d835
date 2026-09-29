import { useState, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/user/useAuth';
import { useZones } from '@/hooks/zones/useZones';

export type SearchResultType = 'contact' | 'deal' | 'task' | 'page';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle?: string;
  url: string;
  zoneId?: string;
  date?: string;
}

type PageRow = {
  id: string;
  slug: string | null;
  title: string | null;
  updated_at: string | null;
  page_path?: string | null;
  is_home?: boolean | null;
  site_id?: string | null;
};

/**
 * Pages of the current user matching the query. Site columns (page_path,
 * is_home, site_id) come from migrations that may not be applied to every
 * database yet; on "column does not exist" the search retries without them.
 */
async function searchPages(userId: string, q: string) {
  const full = await (supabase
    .from('pages')
    .select('id, slug, title, updated_at, page_path, is_home, site_id') as any)
    .eq('user_id', userId)
    .or(`title.ilike.%${q}%,page_path.ilike.%${q}%,slug.ilike.%${q}%`)
    .limit(8);
  if (!full.error || full.error.code !== '42703') return full as { data: PageRow[] | null; error: unknown };
  return (await supabase
    .from('pages')
    .select('id, slug, title, updated_at')
    .eq('user_id', userId)
    .or(`title.ilike.%${q}%,slug.ilike.%${q}%`)
    .limit(8)) as { data: PageRow[] | null; error: unknown };
}

export function useGlobalSearch() {
  const { user } = useAuth();
  const { currentZone } = useZones();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2 || !user) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    const lowercaseQuery = query.toLowerCase();
    // Sanitize for PostgREST filters — strip chars that break .or()/.ilike() syntax (MED-3 fix)
    const sanitized = lowercaseQuery.replace(/[(),."'\\%_]/g, '').trim();
    if (sanitized.length < 2) { setLoading(false); setResults([]); return; }
    const searchResults: SearchResult[] = [];

    try {
      // ⚡ Bolt: Parallelize independent queries with Promise.all instead of awaiting
      // them sequentially. Cuts global search latency from sum(queries) to max(queries),
      // typically ~3-4× faster when a zone is active (4 parallel requests vs serial).
      const pagesPromise = searchPages(user.id, sanitized);

      const zoneId = currentZone?.id;
      const contactsPromise = zoneId
        ? (supabase
            .from('zone_contacts')
            .select('id, name, email, phone') as any)
            .eq('zone_id', zoneId)
            .or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`)
            .limit(5)
        : Promise.resolve({ data: null });

      const dealsPromise = zoneId
        ? (supabase
            .from('zone_deals')
            .select('id, title, value_amount, currency') as any)
            .eq('zone_id', zoneId)
            .ilike('title', `%${sanitized}%`)
            .limit(5)
        : Promise.resolve({ data: null });

      const tasksPromise = zoneId
        ? (supabase
            .from('zone_tasks')
            .select('id, title, status') as any)
            .eq('zone_id', zoneId)
            .ilike('title', `%${sanitized}%`)
            .limit(5)
        : Promise.resolve({ data: null });

      const responses = await Promise.all([pagesPromise, contactsPromise, dealsPromise, tasksPromise]);
      const [{ data: pages }, { data: contacts }, { data: deals }, { data: tasks }] = responses;
      // Supabase reports failures in `error` instead of throwing; a failed
      // query used to look exactly like "no results".
      const failed = responses.find((r: { error?: { message?: string } | null }) => r.error);
      if (failed) setError((failed as { error: { message?: string } }).error.message ?? 'search_failed');

      if (pages) {
        // Build a map of site_id -> home slug for sub-page subtitles
        const homeSlugBySite: Record<string, string> = {};
        pages.forEach(p => {
          if (p.is_home && p.site_id && p.slug) homeSlugBySite[p.site_id] = p.slug;
        });
        pages.forEach(p => {
          const isSub = !p.is_home && p.page_path && p.site_id;
          const homeSlug = isSub && p.site_id ? homeSlugBySite[p.site_id] : null;
          const subtitle = isSub
            ? (homeSlug ? `/${homeSlug}/p/${p.page_path}` : `/p/${p.page_path}`)
            : `/${p.slug}`;
          searchResults.push({
            id: p.id,
            type: 'page',
            title: p.title || p.slug || p.page_path || '',
            subtitle,
            // The palette makes this page active before navigating.
            url: '/dashboard?tab=editor',
            date: p.updated_at ?? undefined,
          });
        });
      }

      if (zoneId) {
        if (contacts) {
          (contacts as any[]).forEach(c => {
            searchResults.push({
              id: c.id,
              type: 'contact',
              title: c.name,
              subtitle: c.email || c.phone || 'Contact',
              url: '/dashboard/zone-contacts',
              zoneId,
            });
          });
        }

        if (deals) {
          (deals as any[]).forEach(d => {
            searchResults.push({
              id: d.id,
              type: 'deal',
              title: d.title,
              subtitle: `${d.value_amount?.toLocaleString() || 0} ${d.currency || 'KZT'}`,
              url: '/dashboard/zone-deals',
              zoneId,
            });
          });
        }

        if (tasks) {
          (tasks as any[]).forEach(t => {
            searchResults.push({
              id: t.id,
              type: 'task',
              title: t.title,
              subtitle: `Status: ${t.status}`,
              url: '/dashboard/zone-tasks',
              zoneId,
            });
          });
        }
      }

      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'search_failed');
    } finally {
      setLoading(false);
    }
  }, [user, currentZone?.id]);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    clear
  };
}

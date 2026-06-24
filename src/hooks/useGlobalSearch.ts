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

interface DbPageRow {
  id: string;
  slug: string;
  title: string | null;
  updated_at: string | null;
  page_path: string | null;
  is_home: boolean | null;
  site_id: string | null;
}

interface DbContactRow {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface DbDealRow {
  id: string;
  title: string | null;
  value_amount: number | null;
  currency: string | null;
}

interface DbTaskRow {
  id: string;
  title: string | null;
  status: string | null;
}

export function useGlobalSearch() {
  const { user } = useAuth();
  const { currentZone } = useZones();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 2 || !user) {
      setResults([]);
      return;
    }

    setLoading(true);
    const lowercaseQuery = query.toLowerCase();
    // Sanitize for PostgREST filters — strip chars that break .or()/.ilike() syntax (MED-3 fix)
    const sanitized = lowercaseQuery.replace(/[(),."'\\%_]/g, '').trim();
    if (sanitized.length < 2) { setLoading(false); setResults([]); return; }
    const searchResults: SearchResult[] = [];

    try {
      // ⚡ Bolt: Parallelize independent queries with Promise.all instead of awaiting
      // them sequentially. Cuts global search latency from sum(queries) to max(queries),
      // typically ~3-4× faster when a zone is active (4 parallel requests vs serial).
      const pagesPromise = supabase
        .from('pages' as never)
        .select('id, slug, title, updated_at, page_path, is_home, site_id')
        .eq('owner_id', user.id)
        .or(`title.ilike.%${sanitized}%,page_path.ilike.%${sanitized}%,slug.ilike.%${sanitized}%`)
        .limit(8);

      const zoneId = currentZone?.id;
      const contactsPromise = zoneId
        ? supabase
            .from('zone_contacts')
            .select('id, name, email, phone')
            .eq('zone_id', zoneId)
            .or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`)
            .limit(5)
        : Promise.resolve({ data: null });

      const dealsPromise = zoneId
        ? supabase
            .from('zone_deals')
            .select('id, title, value_amount, currency')
            .eq('zone_id', zoneId)
            .ilike('title', `%${sanitized}%`)
            .limit(5)
        : Promise.resolve({ data: null });

      const tasksPromise = zoneId
        ? supabase
            .from('zone_tasks')
            .select('id, title, status')
            .eq('zone_id', zoneId)
            .ilike('title', `%${sanitized}%`)
            .limit(5)
        : Promise.resolve({ data: null });

      const [
        { data: pages },
        { data: contacts },
        { data: deals },
        { data: tasks },
      ] = await Promise.all([pagesPromise, contactsPromise, dealsPromise, tasksPromise]);

      if (pages) {
        const pageRows = pages as unknown as DbPageRow[];
        const homeSlugBySite: Record<string, string> = {};
        pageRows.forEach(p => {
          if (p.is_home && p.site_id) homeSlugBySite[p.site_id] = p.slug;
        });
        pageRows.forEach(p => {
          const siteId = p.site_id;
          const hasPath = p.page_path;
          const isSub = !p.is_home && hasPath && siteId;
          const homeSlug = isSub ? homeSlugBySite[siteId] : null;
          const subtitle = isSub
            ? (homeSlug ? `/${homeSlug}/p/${hasPath}` : `/p/${hasPath}`)
            : `/${p.slug}`;
          searchResults.push({
            id: p.id,
            type: 'page',
            title: p.title || p.slug || p.page_path || '',
            subtitle,
            url: `/dashboard/pages/${p.id}`,
            date: p.updated_at || undefined,
          });
        });
      }

      if (zoneId) {
        if (contacts) {
          (contacts as unknown as DbContactRow[]).forEach(c => {
            searchResults.push({
              id: c.id,
              type: 'contact',
              title: c.name || '',
              subtitle: c.email || c.phone || 'Contact',
              url: `/dashboard/zones/${zoneId}/crm`,
              zoneId,
            });
          });
        }

        if (deals) {
          (deals as unknown as DbDealRow[]).forEach(d => {
            searchResults.push({
              id: d.id,
              type: 'deal',
              title: d.title || '',
              subtitle: `${d.value_amount?.toLocaleString() || 0} ${d.currency || 'KZT'}`,
              url: `/dashboard/zones/${zoneId}/crm`,
              zoneId,
            });
          });
        }

        if (tasks) {
          (tasks as unknown as DbTaskRow[]).forEach(t => {
            searchResults.push({
              id: t.id,
              type: 'task',
              title: t.title || '',
              subtitle: `Status: ${t.status}`,
              url: `/dashboard/zones/${zoneId}/tasks`,
              zoneId,
            });
          });
        }
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [user, currentZone?.id]);

  const clear = useCallback(() => {
    setResults([]);
  }, []);

  return {
    results,
    loading,
    search,
    clear
  };
}

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
    const searchResults: SearchResult[] = [];

    try {
      // 1. Search Pages (Owned by user)
      const { data: pages } = await (supabase
        .from('pages')
        .select('id, slug, title, updated_at') as any)
        .eq('owner_id', user.id)
        .ilike('title', `%${lowercaseQuery}%`)
        .limit(5);

      if (pages) {
        (pages as any[]).forEach(p => {
          searchResults.push({
            id: p.id,
            type: 'page',
            title: p.title || p.slug,
            subtitle: `/${p.slug}`,
            url: `/dashboard/pages/${p.id}`,
            date: p.updated_at
          });
        });
      }

      // 2. Zone specific searches (Contacts, Deals, Tasks)
      if (currentZone) {
        // Search Contacts
        const { data: contacts } = await (supabase
          .from('zone_contacts')
          .select('id, name, email, phone') as any)
          .eq('zone_id', currentZone.id)
          .or(`name.ilike.%${lowercaseQuery}%,email.ilike.%${lowercaseQuery}%,phone.ilike.%${lowercaseQuery}%`)
          .limit(5);

        if (contacts) {
          (contacts as any[]).forEach(c => {
            searchResults.push({
              id: c.id,
              type: 'contact',
              title: c.name,
              subtitle: c.email || c.phone || 'Contact',
              url: `/dashboard/zones/${currentZone.id}/crm`, // They are opened in sheets, so redirect to CRM base
              zoneId: currentZone.id
            });
          });
        }

        // Search Deals
        const { data: deals } = await (supabase
          .from('zone_deals')
          .select('id, title, value_amount, currency') as any)
          .eq('zone_id', currentZone.id)
          .ilike('title', `%${lowercaseQuery}%`)
          .limit(5);

        if (deals) {
          (deals as any[]).forEach(d => {
            searchResults.push({
              id: d.id,
              type: 'deal',
              title: d.title,
              subtitle: `${d.value_amount?.toLocaleString() || 0} ${d.currency || 'KZT'}`,
              url: `/dashboard/zones/${currentZone.id}/crm`,
              zoneId: currentZone.id
            });
          });
        }

        // Search Tasks
        const { data: tasks } = await (supabase
          .from('zone_tasks')
          .select('id, title, status') as any)
          .eq('zone_id', currentZone.id)
          .ilike('title', `%${lowercaseQuery}%`)
          .limit(5);

        if (tasks) {
          (tasks as any[]).forEach(t => {
            searchResults.push({
              id: t.id,
              type: 'task',
              title: t.title,
              subtitle: `Status: ${t.status}`,
              url: `/dashboard/zones/${currentZone.id}/tasks`,
              zoneId: currentZone.id
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

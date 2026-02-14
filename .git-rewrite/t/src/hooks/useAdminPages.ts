import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';

export interface AdminPageData {
  id: string;
  slug: string;
  title: string | null;
  is_published: boolean;
  view_count: number;
  is_in_gallery: boolean;
  created_at: string;
  user_id: string;
  username?: string;
}

async function fetchPages(): Promise<AdminPageData[]> {
  const { data, error } = await supabase
    .from('pages')
    .select('id, slug, title, is_published, view_count, is_in_gallery, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;

  // Get usernames for pages
  const userIds = [...new Set(data?.map(p => p.user_id) || [])];
  
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, username')
    .in('id', userIds);

  const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || []);

  return (data || []).map(p => ({
    ...p,
    username: profileMap.get(p.user_id) || 'Unknown'
  }));
}

export function useAdminPages() {
  return useQuery({
    queryKey: ['admin-pages'],
    queryFn: fetchPages,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

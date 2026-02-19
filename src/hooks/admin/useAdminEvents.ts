import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';

export interface AdminAnalyticsEvent {
  id: string;
  event_type: string;
  page_id: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

async function fetchRecentEvents(): Promise<AdminAnalyticsEvent[]> {
  const { data, error } = await supabase
    .from('analytics')
    .select('id, event_type, page_id, created_at, metadata')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data || []) as AdminAnalyticsEvent[];
}

export function useAdminEvents() {
  return useQuery({
    queryKey: ['admin-recent-events'],
    queryFn: fetchRecentEvents,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}

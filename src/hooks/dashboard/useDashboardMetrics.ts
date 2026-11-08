import { useEffect, useId } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/user/useAuth';
import { subDays } from 'date-fns';
import { logger } from '@/lib/utils/logger';

interface MetricsSummary {
  totalViews: number;
  totalClicks: number;
  totalLeads: number;
  conversionRate: number; // Leads / Views
  interactionRate: number; // Clicks / Views
  loading: boolean;
  error: Error | null;
}

const EMPTY = { totalViews: 0, totalClicks: 0, totalLeads: 0, conversionRate: 0, interactionRate: 0 };

const dashboardMetricsQueryKey = (pageId: string, userId: string) => ['dashboardMetrics', pageId, userId] as const;

/**
 * Block impressions are stored as `view` events with metadata.isBlockImpression;
 * a page with eight blocks used to count nine "views" per visit. Count page
 * views only, like the analytics screen does.
 */
const PAGE_VIEWS_ONLY = 'metadata->>isBlockImpression.is.null,metadata->>isBlockImpression.neq.true';

async function fetchMetrics(pageId: string, userId: string) {
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
  const count = (eventType: 'view' | 'click') => {
    let query = supabase
      .from('analytics')
      .select('*', { count: 'exact', head: true })
      .eq('page_id', pageId)
      .eq('event_type', eventType)
      .gte('created_at', thirtyDaysAgo);
    if (eventType === 'view') query = query.or(PAGE_VIEWS_ONLY);
    return query;
  };

  const [viewsResult, clicksResult, leadsResult] = await Promise.all([
    count('view'),
    count('click'),
    // NOTE: 'leads' lacks a page_id column; count the owner's leads.
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo),
  ]);
  if (viewsResult.error) throw viewsResult.error;
  if (clicksResult.error) throw clicksResult.error;
  if (leadsResult.error) logger.error('Error fetching leads count', leadsResult.error);

  const views = viewsResult.count || 0;
  const clicks = clicksResult.count || 0;
  const totalLeads = leadsResult.count || 0;
  return {
    totalViews: views,
    totalClicks: clicks,
    totalLeads,
    conversionRate: views > 0 ? (totalLeads / views) * 100 : 0,
    interactionRate: views > 0 ? (clicks / views) * 100 : 0,
  };
}

/** 30-day totals for the overview. Shared by every widget that shows them. */
export function useDashboardMetrics(pageId: string | undefined): MetricsSummary {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const channelSuffix = useId();

  const query = useQuery({
    queryKey: dashboardMetricsQueryKey(pageId ?? '', userId ?? ''),
    enabled: !!pageId && !!userId,
    staleTime: 60 * 1000,
    queryFn: () => fetchMetrics(pageId!, userId!),
  });

  // New leads refresh the shared totals.
  useEffect(() => {
    if (!pageId || !userId) return;
    const subscription = supabase
      .channel(`dashboard-metrics-leads-${channelSuffix}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'leads',
        filter: `user_id=eq.${userId}`,
      }, () => {
        void queryClient.invalidateQueries({ queryKey: dashboardMetricsQueryKey(pageId, userId) });
      })
      .subscribe();
    return () => { subscription.unsubscribe(); };
  }, [pageId, userId, queryClient, channelSuffix]);

  if (query.error) logger.debug('Dashboard metrics failed', { data: query.error });
  return {
    ...(query.data ?? EMPTY),
    loading: !!pageId && !!userId ? query.isLoading : true,
    error: (query.error as Error | null) ?? null,
  };
}

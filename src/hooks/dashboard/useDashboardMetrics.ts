import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/user/useAuth';
import { subDays, startOfDay, endOfDay } from 'date-fns';
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

export function useDashboardMetrics(pageId: string | undefined) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<MetricsSummary>({
    totalViews: 0,
    totalClicks: 0,
    totalLeads: 0,
    conversionRate: 0,
    interactionRate: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!pageId || !user) return;

    const fetchMetrics = async () => {
      setMetrics(prev => ({ ...prev, loading: true }));
      try {
        const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

        // 1. Fetch Views & Clicks from analytics (properly typed)
        const { count: viewsCount, error: viewsError } = await supabase
          .from('analytics')
          .select('*', { count: 'exact', head: true })
          .eq('page_id', pageId)
          .eq('event_type', 'view')
          .gte('created_at', thirtyDaysAgo);

        if (viewsError) throw viewsError;

        const { count: clicksCount, error: clicksError } = await supabase
          .from('analytics')
          .select('*', { count: 'exact', head: true })
          .eq('page_id', pageId)
          .eq('event_type', 'click')
          .gte('created_at', thirtyDaysAgo);

        if (clicksError) throw clicksError;

        const views = viewsCount || 0;
        const clicks = clicksCount || 0;

        // 2. Fetch Leads from leads table
        // NOTE: 'leads' table currently lacks 'page_id' column in schema (verified in types.ts).
        // Fetching all leads for the user as a fallback.
        const { count: leadsCount, error: leadsError } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id) // Ensure we filter by user_id
          .gte('created_at', thirtyDaysAgo);

        if (leadsError) {
          // Log but don't crash if it's a minor error
          logger.error('Error fetching leads count', leadsError);
        }

        const totalLeads = leadsCount || 0;
        const conversionRate = views > 0 ? (totalLeads / views) * 100 : 0;
        const interactionRate = views > 0 ? (clicks / views) * 100 : 0;

        setMetrics({
          totalViews: views,
          totalClicks: clicks,
          totalLeads,
          conversionRate,
          interactionRate,
          loading: false,
          error: null,
        });
      } catch (err) {
        logger.error('Error fetching dashboard metrics', err);
        setMetrics(prev => ({ ...prev, loading: false, error: err as Error }));
      }
    };

    fetchMetrics();
    
    // Set up real-time subscription for leads only
    const subscription = supabase
      .channel('public:leads')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'leads',
        filter: `user_id=eq.${user.id}` // Added security filter
      }, () => {
        fetchMetrics();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [pageId, user]);

  return metrics;
}

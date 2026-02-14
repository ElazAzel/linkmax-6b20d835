import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';

export interface AnalyticsEvent {
  id: string;
  page_id: string;
  block_id: string | null;
  event_type: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface BlockStats {
  blockId: string;
  blockType: string;
  blockTitle: string;
  clicks: number;
  views: number;
  ctr: number; // Click-through rate
}

export interface TimeSeriesData {
  date: string;
  views: number;
  clicks: number;
  shares: number;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  totalShares: number;
  uniqueVisitors: number;
  avgViewsPerDay: number;
  topBlocks: BlockStats[];
  dailyData: TimeSeriesData[];
  weeklyData: TimeSeriesData[];
  monthlyData: TimeSeriesData[];
  viewsChange: number; // % change from previous period
  clicksChange: number;
}

export type TimePeriod = 'day' | 'week' | 'month' | 'all';

export function usePageAnalytics() {
  const { user } = useAuth();
  const [pageId, setPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [period, setPeriod] = useState<TimePeriod>('week');

  // Fetch user's page ID
  useEffect(() => {
    async function fetchPageId() {
      if (!user) return;
      
      const { data } = await supabase
        .from('pages')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setPageId(data.id);
      }
    }
    
    fetchPageId();
  }, [user]);

  const fetchAnalytics = useCallback(async () => {
    if (!user || !pageId) return;

    try {
      setLoading(true);

      const now = new Date();
      let startDate: Date;
      let previousStartDate: Date;

      switch (period) {
        case 'day':
          startDate = startOfDay(now);
          previousStartDate = subDays(startDate, 1);
          break;
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          previousStartDate = subWeeks(startDate, 1);
          break;
        case 'month':
          startDate = startOfMonth(now);
          previousStartDate = subMonths(startDate, 1);
          break;
        default:
          startDate = subMonths(now, 12); // Last 12 months for "all"
          previousStartDate = subMonths(startDate, 12);
      }

      // Fetch all analytics for current period
      const { data: currentEvents, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('page_id', pageId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch previous period for comparison
      const { data: previousEvents } = await supabase
        .from('analytics')
        .select('*')
        .eq('page_id', pageId)
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      // Fetch blocks for the page to get block info
      const { data: blocks } = await supabase
        .from('blocks')
        .select('id, type, title, content, click_count')
        .eq('page_id', pageId);

      const events = (currentEvents as AnalyticsEvent[]) || [];
      const prevEvents = (previousEvents as AnalyticsEvent[]) || [];

      // Calculate totals
      const totalViews = events.filter(e => e.event_type === 'view').length;
      const totalClicks = events.filter(e => e.event_type === 'click').length;
      const totalShares = events.filter(e => e.event_type === 'share').length;

      // Previous period totals
      const prevViews = prevEvents.filter(e => e.event_type === 'view').length;
      const prevClicks = prevEvents.filter(e => e.event_type === 'click').length;

      // Calculate changes
      const viewsChange = prevViews > 0 ? ((totalViews - prevViews) / prevViews) * 100 : 0;
      const clicksChange = prevClicks > 0 ? ((totalClicks - prevClicks) / prevClicks) * 100 : 0;

      // Unique visitors (by IP in metadata or session)
      const uniqueIPs = new Set(events
        .filter(e => e.event_type === 'view' && e.metadata?.ip)
        .map(e => e.metadata.ip));
      const uniqueVisitors = uniqueIPs.size || Math.ceil(totalViews * 0.7); // Estimate if no IP data

      // Days in period for average
      const daysInPeriod = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const avgViewsPerDay = Math.round(totalViews / daysInPeriod);

      // Block statistics
      const blockStatsMap = new Map<string, BlockStats>();
      
      if (blocks) {
        blocks.forEach(block => {
          const content = block.content as any;
          blockStatsMap.set(block.id, {
            blockId: block.id,
            blockType: block.type,
            blockTitle: block.title || content?.title || content?.name || block.type,
            clicks: block.click_count || 0,
            views: 0,
            ctr: 0,
          });
        });
      }

      // Count clicks per block from events
      events.filter(e => e.event_type === 'click' && e.block_id).forEach(e => {
        const stats = blockStatsMap.get(e.block_id!);
        if (stats) {
          stats.clicks++;
        }
      });

      // Calculate CTR (clicks / total page views)
      blockStatsMap.forEach(stats => {
        stats.views = totalViews;
        stats.ctr = totalViews > 0 ? (stats.clicks / totalViews) * 100 : 0;
      });

      const topBlocks = Array.from(blockStatsMap.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      // Generate time series data
      const dailyData = generateDailyData(events, startDate, now);
      const weeklyData = generateWeeklyData(events, subMonths(now, 3), now);
      const monthlyData = generateMonthlyData(events, subMonths(now, 12), now);

      setAnalytics({
        totalViews,
        totalClicks,
        totalShares,
        uniqueVisitors,
        avgViewsPerDay,
        topBlocks,
        dailyData,
        weeklyData,
        monthlyData,
        viewsChange,
        clicksChange,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [user, pageId, period]);

  useEffect(() => {
    if (pageId) {
      fetchAnalytics();
    }
  }, [fetchAnalytics, pageId]);

  return {
    analytics,
    loading,
    period,
    setPeriod,
    refresh: fetchAnalytics,
  };
}

function generateDailyData(events: AnalyticsEvent[], start: Date, end: Date): TimeSeriesData[] {
  const days = eachDayOfInterval({ start, end });
  
  return days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => 
      format(new Date(e.created_at), 'yyyy-MM-dd') === dayStr
    );
    
    return {
      date: format(day, 'dd MMM'),
      views: dayEvents.filter(e => e.event_type === 'view').length,
      clicks: dayEvents.filter(e => e.event_type === 'click').length,
      shares: dayEvents.filter(e => e.event_type === 'share').length,
    };
  });
}

function generateWeeklyData(events: AnalyticsEvent[], start: Date, end: Date): TimeSeriesData[] {
  const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
  
  return weeks.map(weekStart => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekEvents = events.filter(e => {
      const eventDate = new Date(e.created_at);
      return eventDate >= weekStart && eventDate <= weekEnd;
    });
    
    return {
      date: format(weekStart, 'dd MMM'),
      views: weekEvents.filter(e => e.event_type === 'view').length,
      clicks: weekEvents.filter(e => e.event_type === 'click').length,
      shares: weekEvents.filter(e => e.event_type === 'share').length,
    };
  });
}

function generateMonthlyData(events: AnalyticsEvent[], start: Date, end: Date): TimeSeriesData[] {
  const months = eachMonthOfInterval({ start, end });
  
  return months.map(monthStart => {
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    
    const monthEvents = events.filter(e => {
      const eventDate = new Date(e.created_at);
      return eventDate >= monthStart && eventDate <= monthEnd;
    });
    
    return {
      date: format(monthStart, 'MMM yyyy'),
      views: monthEvents.filter(e => e.event_type === 'view').length,
      clicks: monthEvents.filter(e => e.event_type === 'click').length,
      shares: monthEvents.filter(e => e.event_type === 'share').length,
    };
  });
}

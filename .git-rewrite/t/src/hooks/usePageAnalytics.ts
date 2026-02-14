import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/logger';
import { useAuth } from '@/hooks/useAuth';
import { startOfDay, startOfWeek, startOfMonth, subDays, subWeeks, subMonths, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { useTranslation } from 'react-i18next';

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

export interface GeoData {
  country: string;
  countryCode: string;
  count: number;
  percentage: number;
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
  trafficSources: TrafficSource[];
  deviceBreakdown: DeviceBreakdown;
  geoData: GeoData[];
  avgSessionDuration: number; // in seconds
  bounceRate: number; // percentage
  returningVisitors: number; // percentage
  totalConversions: number;
}

export interface TrafficSource {
  source: string;
  count: number;
  percentage: number;
}

export interface DeviceBreakdown {
  mobile: number;
  tablet: number;
  desktop: number;
}

export type TimePeriod = 'day' | 'week' | 'two_weeks' | 'month' | 'all';

export function usePageAnalytics() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
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
          startDate = subDays(now, 7);
          previousStartDate = subDays(startDate, 7);
          break;
        case 'two_weeks':
          startDate = subDays(now, 14);
          previousStartDate = subDays(startDate, 14);
          break;
        case 'month':
          startDate = subDays(now, 30);
          previousStartDate = subDays(startDate, 30);
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
        const currentLang = i18n.language as SupportedLanguage;
        blocks.forEach(block => {
          const content = block.content as any;
          // Use getI18nText to handle MultilingualString objects
          const rawTitle = block.title || content?.title || content?.name || block.type;
          const blockTitle = typeof rawTitle === 'object'
            ? getI18nText(rawTitle, currentLang)
            : rawTitle;

          blockStatsMap.set(block.id, {
            blockId: block.id,
            blockType: block.type,
            blockTitle,
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

      // Calculate traffic sources
      const sourceMap = new Map<string, number>();
      events.filter(e => e.event_type === 'view').forEach(e => {
        const source = e.metadata?.source || 'direct';
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });
      const trafficSources: TrafficSource[] = Array.from(sourceMap.entries())
        .map(([source, count]) => ({
          source,
          count,
          percentage: totalViews > 0 ? (count / totalViews) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate device breakdown
      const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 };
      events.filter(e => e.event_type === 'view').forEach(e => {
        const device = e.metadata?.device as 'mobile' | 'tablet' | 'desktop' | undefined;
        if (device && device in deviceCounts) {
          deviceCounts[device]++;
        } else {
          deviceCounts.desktop++; // Default to desktop if unknown
        }
      });
      const deviceBreakdown: DeviceBreakdown = deviceCounts;

      // Calculate geography breakdown
      const geoMap = new Map<string, { country: string; countryCode: string; count: number }>();
      events.filter(e => e.event_type === 'view').forEach(e => {
        const countryCode = (e.metadata?.country as string) || 'unknown';
        const country = (e.metadata?.countryName as string) || countryCode;
        const existing = geoMap.get(countryCode);
        if (existing) {
          existing.count++;
        } else {
          geoMap.set(countryCode, { country, countryCode, count: 1 });
        }
      });
      const geoData: GeoData[] = Array.from(geoMap.values())
        .map(g => ({
          ...g,
          percentage: totalViews > 0 ? (g.count / totalViews) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count);

      // Calculate session metrics (estimates based on available data)
      const sessionsWithClicks = events.filter(e => e.event_type === 'click').length;
      const bounceRate = totalViews > 0
        ? Math.max(0, Math.min(100, ((totalViews - sessionsWithClicks) / totalViews) * 100))
        : 0;

      // Estimate average session duration from metadata if available
      const durations = events
        .filter(e => e.metadata?.sessionDuration && typeof e.metadata.sessionDuration === 'number')
        .map(e => e.metadata.sessionDuration as number);
      const avgSessionDuration = durations.length > 0
        ? durations.reduce((sum, d) => sum + d, 0) / durations.length
        : 45; // Default estimate

      // Calculate returning visitors
      const visitorCounts = new Map<string, number>();
      events.filter(e => e.event_type === 'view').forEach(e => {
        const visitorId = (e.metadata?.visitorId as string) || e.id;
        visitorCounts.set(visitorId, (visitorCounts.get(visitorId) || 0) + 1);
      });
      const returningCount = Array.from(visitorCounts.values()).filter(c => c > 1).length;
      const returningVisitorsPercent = uniqueVisitors > 0 ? (returningCount / uniqueVisitors) * 100 : 0;

      // Fetch conversions (leads + bookings)
      const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString());

      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('owner_id', user.id)
        .gte('created_at', startDate.toISOString());

      const totalConversions = (leads?.length || 0) + (bookings?.length || 0);

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
        trafficSources,
        deviceBreakdown,
        geoData,
        avgSessionDuration,
        bounceRate,
        returningVisitors: returningVisitorsPercent,
        totalConversions,
      });
    } catch (error) {
      logger.error('Error fetching analytics:', error, { context: 'usePageAnalytics' });
    } finally {
      setLoading(false);
    }
  }, [user, pageId, period, i18n.language]);

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

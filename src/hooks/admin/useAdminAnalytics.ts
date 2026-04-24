import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/platform/supabase/client';
import { subDays, startOfDay, eachDayOfInterval, eachHourOfInterval, startOfHour, format } from 'date-fns';
import { AnalyticsFilters } from '@/components/admin/AnalyticsFilterPanel';

export interface DailyEventData {
  date: string;
  views: number;
  clicks: number;
  shares: number;
  sessions: number;
  visitors: number;
}

export interface HourlyEventData {
  hour: string;
  views: number;
  clicks: number;
}

export interface AnalyticsData {
  totalViews: number;
  totalClicks: number;
  totalShares: number;
  totalEvents: number;
  uniqueVisitors: number;
  totalSessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  totalConversions: number;
  viewsTrend: number;
  clicksTrend: number;
  sharesTrend: number;
  dailyEvents: DailyEventData[];
  hourlyEvents: HourlyEventData[];
  eventsByType: { name: string; count: number; color: string }[];
  eventsByDevice: { name: string; count: number; color: string }[];
  eventsBySource: { name: string; count: number; color: string }[];
  topPages: { page_id: string; slug: string; views: number; clicks: number; ctr: number }[];
  topBlocks: { block_id: string; type: string; clicks: number }[];
  engagementByHour: { hour: number; events: number }[];
  engagementByDay: { day: string; events: number }[];
}

interface AnalyticsRow {
  event_type: string | null;
  created_at: string | null;
  page_id: string | null;
  block_id: string | null;
  metadata: Record<string, unknown> | null;
}

const COLORS = {
  views: '#06b6d4',
  clicks: '#f97316',
  shares: '#ec4899',
  sessions: '#8b5cf6',
  visitors: '#10b981',
  desktop: '#3b82f6',
  mobile: '#10b981',
  tablet: '#f59e0b',
  direct: '#6366f1',
  social: '#ec4899',
  search: '#10b981',
  referral: '#f97316',
  other: '#6b7280'
};

export function useAdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    devices: [],
    sources: [],
    pages: [],
  });

  const getPeriodDays = useCallback(() => {
    switch (period) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case 'all': return 3650;
    }
  }, [period]);

  const getString = (obj: Record<string, unknown> | null | undefined, ...keys: string[]): string | undefined => {
    for (const key of keys) {
      const val = obj?.[key];
      if (typeof val === 'string' && val.length > 0) return val;
    }
    return undefined;
  };

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const days = getPeriodDays();
      const now = new Date();
      const startDate = subDays(now, days);
      const prevStartDate = subDays(startDate, days);

      const [
        { data: currentEvents },
        { data: previousEvents },
        { data: pagesData }
      ] = await Promise.all([
        supabase
          .from('analytics')
          .select('event_type, created_at, page_id, block_id, metadata')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true }),
        supabase
          .from('analytics')
          .select('event_type')
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate.toISOString()),
        supabase
          .from('pages')
          .select('id, slug')
      ]);

      const events: AnalyticsRow[] = (currentEvents || []) as AnalyticsRow[];
      const prevEvents = previousEvents || [];

      const calcTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const dateRange = eachDayOfInterval({ start: startDate, end: now });
      const dailyBucket = new Map<string, {
        views: number;
        clicks: number;
        shares: number;
        visitors: Set<string>;
        sessions: Set<string>;
      }>();

      for (const day of dateRange) {
        const dayKey = startOfDay(day).toISOString();
        dailyBucket.set(dayKey, {
          views: 0,
          clicks: 0,
          shares: 0,
          visitors: new Set<string>(),
          sessions: new Set<string>(),
        });
      }

      const last24Hours = eachHourOfInterval({
        start: subDays(now, 1),
        end: now,
      });
      const hourlyBucket = new Map<string, { views: number; clicks: number }>();
      for (const hour of last24Hours) {
        hourlyBucket.set(startOfHour(hour).toISOString(), { views: 0, clicks: 0 });
      }

      let views = 0;
      let clicks = 0;
      let shares = 0;
      let conversions = 0;
      const visitorIds = new Set<string>();
      const sessionIds = new Set<string>();
      const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
      const sourceCounts: Record<string, number> = {};
      const pageViewCounts: Record<string, { views: number; clicks: number }> = {};
      const blockClickCounts: Record<string, { type: string; clicks: number }> = {};
      const hourCounts: Record<number, number> = {};
      const dayCounts: Record<number, number> = {};

      for (const event of events) {
        const createdAt = event.created_at ? new Date(event.created_at) : null;
        const eventType = event.event_type;
        const meta = event.metadata;

        if (eventType === 'view') views++;
        if (eventType === 'click') clicks++;
        if (eventType === 'share') shares++;
        if (eventType === 'conversion') conversions++;

        const visitorId = getString(meta, 'visitorId', 'visitor_id');
        const sessionId = getString(meta, 'sessionId', 'session_id');
        if (visitorId) visitorIds.add(visitorId);
        if (sessionId) sessionIds.add(sessionId);

        const device = getString(meta, 'device', 'device_type') || 'unknown';
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;

        const source = getString(meta, 'source', 'referrer_source') || 'direct';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;

        if (event.page_id) {
          if (!pageViewCounts[event.page_id]) {
            pageViewCounts[event.page_id] = { views: 0, clicks: 0 };
          }
          if (eventType === 'view') pageViewCounts[event.page_id].views++;
          if (eventType === 'click') pageViewCounts[event.page_id].clicks++;
        }

        if (eventType === 'click') {
          const blockRef = event.block_id || getString(meta, 'blockId', 'block_id', 'blockType', 'block_type');
          if (blockRef) {
            if (!blockClickCounts[blockRef]) {
              blockClickCounts[blockRef] = {
                type: getString(meta, 'blockType', 'block_type') || 'Unknown',
                clicks: 0,
              };
            }
            blockClickCounts[blockRef].clicks++;
          }
        }

        if (createdAt) {
          const dayStartIso = startOfDay(createdAt).toISOString();
          const dayBucket = dailyBucket.get(dayStartIso);
          if (dayBucket) {
            if (eventType === 'view') dayBucket.views++;
            if (eventType === 'click') dayBucket.clicks++;
            if (eventType === 'share') dayBucket.shares++;
            if (visitorId) dayBucket.visitors.add(visitorId);
            if (sessionId) dayBucket.sessions.add(sessionId);
          }

          const hourStartIso = startOfHour(createdAt).toISOString();
          const hourBucket = hourlyBucket.get(hourStartIso);
          if (hourBucket) {
            if (eventType === 'view') hourBucket.views++;
            if (eventType === 'click') hourBucket.clicks++;
          }

          const hour = createdAt.getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;

          const day = createdAt.getDay();
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        }
      }

      const prevViews = prevEvents.filter(e => e.event_type === 'view').length;
      const prevClicks = prevEvents.filter(e => e.event_type === 'click').length;
      const prevShares = prevEvents.filter(e => e.event_type === 'share').length;

      const dailyEvents: DailyEventData[] = dateRange.map(day => {
        const key = startOfDay(day).toISOString();
        const bucket = dailyBucket.get(key);
        return {
          date: format(day, 'dd.MM'),
          views: bucket?.views || 0,
          clicks: bucket?.clicks || 0,
          shares: bucket?.shares || 0,
          sessions: bucket?.sessions.size || 0,
          visitors: bucket?.visitors.size || 0,
        };
      });

      const hourlyEvents: HourlyEventData[] = last24Hours.map(hour => {
        const key = startOfHour(hour).toISOString();
        const bucket = hourlyBucket.get(key);
        return {
          hour: format(hour, 'HH:00'),
          views: bucket?.views || 0,
          clicks: bucket?.clicks || 0,
        };
      });

      const eventsByType = [
        { name: 'Просмотры', count: views, color: COLORS.views },
        { name: 'Клики', count: clicks, color: COLORS.clicks },
        { name: 'Шейры', count: shares, color: COLORS.shares },
      ];

      const eventsByDevice = [
        { name: 'Desktop', count: deviceCounts.desktop, color: COLORS.desktop },
        { name: 'Mobile', count: deviceCounts.mobile, color: COLORS.mobile },
        { name: 'Tablet', count: deviceCounts.tablet, color: COLORS.tablet },
        { name: 'Unknown', count: deviceCounts.unknown, color: COLORS.other },
      ].filter(d => d.count > 0);

      const sourceColors: Record<string, string> = {
        direct: COLORS.direct,
        social: COLORS.social,
        search: COLORS.search,
        referral: COLORS.referral,
      };

      const eventsBySource = Object.entries(sourceCounts)
        .map(([name, count]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          count,
          color: sourceColors[name] || COLORS.other,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const pageMap = new Map<string, { id: string; slug: string | null }>(pagesData?.map(p => [p.id, p]) || []);
      const topPages = Object.entries(pageViewCounts)
        .map(([page_id, stats]) => {
          const page = pageMap.get(page_id);
          return {
            page_id,
            slug: page?.slug || 'Unknown',
            views: stats.views,
            clicks: stats.clicks,
            ctr: stats.views > 0 ? Math.round((stats.clicks / stats.views) * 100) : 0,
          };
        })
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      const topBlocks = Object.entries(blockClickCounts)
        .map(([block_id, stats]) => ({
          block_id,
          type: stats.type,
          clicks: stats.clicks,
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      const engagementByHour = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        events: hourCounts[hour] || 0,
      }));

      const engagementByDay = Array.from({ length: 7 }, (_, i) => ({
        day: i.toString(),
        events: dayCounts[i] || 0,
      }));

      setAnalytics({
        totalViews: views,
        totalClicks: clicks,
        totalShares: shares,
        totalEvents: events.length,
        uniqueVisitors: visitorIds.size,
        totalSessions: sessionIds.size,
        avgSessionDuration: 0,
        bounceRate: 0,
        totalConversions: conversions,
        viewsTrend: calcTrend(views, prevViews),
        clicksTrend: calcTrend(clicks, prevClicks),
        sharesTrend: calcTrend(shares, prevShares),
        dailyEvents,
        hourlyEvents,
        eventsByType,
        eventsByDevice,
        eventsBySource,
        topPages,
        topBlocks,
        engagementByHour,
        engagementByDay,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [getPeriodDays]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const applyFilters = useCallback(
    (data: AnalyticsData, activeFilters: AnalyticsFilters): AnalyticsData => {
      if (
        activeFilters.devices.length === 0 &&
        activeFilters.sources.length === 0 &&
        activeFilters.pages.length === 0
      ) {
        return data;
      }

      return {
        ...data,
        eventsByDevice: data.eventsByDevice.filter(
          d => activeFilters.devices.length === 0 || activeFilters.devices.includes(d.name.toLowerCase())
        ),
        eventsBySource: data.eventsBySource.filter(
          s => activeFilters.sources.length === 0 || activeFilters.sources.includes(s.name.toLowerCase())
        ),
        topPages: data.topPages.filter(
          p => activeFilters.pages.length === 0 || activeFilters.pages.includes(p.slug)
        ),
        topBlocks: data.topBlocks.slice(0, 10),
      };
    },
    []
  );

  const filteredAnalytics = useMemo(
    () => analytics ? applyFilters(analytics, filters) : null,
    [analytics, filters, applyFilters]
  );

  return {
    loading,
    period,
    setPeriod,
    analytics,
    filters,
    setFilters,
    filteredAnalytics,
  };
}

export { COLORS };

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';
import { useAuth } from '@/hooks/user/useAuth';
import { subDays, subMonths, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
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
  dataQuality: {
    visitorCoverage: number;
    sessionCoverage: number;
    deviceCoverage: number;
    sourceCoverage: number;
  };
  staffStats?: StaffStats[];
  personalStaffStats?: StaffStats;
}

export interface StaffStats {
  staffId: string;
  name: string;
  bookings: number;
  revenue: number;
  completionRate: number;
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

export type TimePeriod = '7d' | '30d' | '90d' | 'all';

function getMetaString(metadata: Record<string, unknown> | null | undefined, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = metadata?.[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

/** Pass `null` when the dashboard page is not ready yet — avoids resolving the wrong page via `limit(1)`. Omit the argument for legacy “first page of user” behaviour. */
export function usePageAnalytics(externalPageId?: string | null) {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [pageId, setPageId] = useState<string | null>(
    externalPageId !== undefined ? (externalPageId && externalPageId.length > 0 ? externalPageId : null) : null
  );
  const [loading, setLoading] = useState(() => (externalPageId !== undefined ? !!externalPageId : true));
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<TimePeriod>('30d');
  const [isStaffMember, setIsStaffMember] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
  const [staffMemberName, setStaffMemberName] = useState<string | null>(null);

  // Resolve page: explicit id from caller, or first page of user (legacy)
  useEffect(() => {
    if (externalPageId !== undefined) {
      setPageId(externalPageId && externalPageId.length > 0 ? externalPageId : null);
      return;
    }

    async function fetchPageId() {
      if (!user) return;

      const { data } = await supabase
        .from('pages')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (data) {
        setPageId(data.id);
      }
    }

    fetchPageId();
  }, [user, externalPageId]);

  // Check if current user is a linked staff member
  useEffect(() => {
    async function checkStaffStatus() {
      if (!user || !pageId) return;

      try {
        const { data: staffData } = await supabase
          .from('zone_staff')
          .select('id, name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (staffData) {
          setIsStaffMember(true);
          setCurrentStaffId(staffData.id);
          setStaffMemberName(staffData.name);
        } else {
          setIsStaffMember(false);
          setCurrentStaffId(null);
          setStaffMemberName(null);
        }
      } catch {
        // zone_staff table may not exist — silent fallback
        setIsStaffMember(false);
        setCurrentStaffId(null);
        setStaffMemberName(null);
      }
    }

    checkStaffStatus();
  }, [user, pageId]);

  const fetchAnalytics = useCallback(async () => {
    if (!user || !pageId) return;

    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      let startDate: Date;
      let previousStartDate: Date | null;

      switch (period) {
        case '7d':
          startDate = subDays(now, 7);
          previousStartDate = subDays(startDate, 7);
          break;
        case '30d':
          startDate = subDays(now, 30);
          previousStartDate = subDays(startDate, 30);
          break;
        case '90d':
          startDate = subDays(now, 90);
          previousStartDate = subDays(startDate, 90);
          break;
        case 'all': {
          const { data: firstEvent } = await supabase
            .from('analytics')
            .select('created_at')
            .eq('page_id', pageId)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          startDate = firstEvent?.created_at ? new Date(firstEvent.created_at) : subMonths(now, 12);
          previousStartDate = null;
          break;
        }
      }

      // Fetch all analytics for current period
      const { data: currentEvents, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('page_id', pageId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      // If user is a staff member, we also want to filter by their staff_id in metadata if possible
      // But for events, we usually don't have staff_id yet unless we tracked it.
      // However, we MUST filter bookings and conversions.

      if (error) throw error;

      // Fetch previous period for comparison
      let previousEvents: AnalyticsEvent[] = [];
      if (previousStartDate) {
        const { data } = await supabase
          .from('analytics')
          .select('*')
          .eq('page_id', pageId)
          .gte('created_at', previousStartDate.toISOString())
          .lt('created_at', startDate.toISOString());
        previousEvents = (data as AnalyticsEvent[]) || [];
      }

      // Fetch blocks for the page to get block info
      const { data: blocks } = await supabase
        .from('blocks')
        .select('id, type, title, content, click_count')
        .eq('page_id', pageId);

      const events = (currentEvents as AnalyticsEvent[]) || [];
      const prevEvents = previousEvents;

      // Calculate totals
      const totalViews = events.filter(e => e.event_type === 'view').length;
      const totalClicks = events.filter(e => e.event_type === 'click').length;
      const totalShares = events.filter(e => e.event_type === 'share').length;

      // Previous period totals
      const prevViews = prevEvents.filter(e => e.event_type === 'view').length;
      const prevClicks = prevEvents.filter(e => e.event_type === 'click').length;

      // Calculate changes
      // Calculate changes - protect against division by zero
      const viewsChange = prevViews > 0 
        ? ((totalViews - prevViews) / prevViews) * 100 
        : (totalViews > 0 ? 100 : 0);
      const clicksChange = prevClicks > 0 
        ? ((totalClicks - prevClicks) / prevClicks) * 100 
        : (totalClicks > 0 ? 100 : 0);

      // Unique visitors by visitorId from metadata
      const uniqueVisitorIds = new Set(events
        .filter(e => e.event_type === 'view')
        .map(e => getMetaString(e.metadata, 'visitorId', 'visitor_id'))
        .filter((value): value is string => !!value));
      const uniqueVisitors = uniqueVisitorIds.size;

      // Days in period for average
      const daysInPeriod = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const avgViewsPerDay = Math.round(totalViews / daysInPeriod);

      // Block statistics
      const blockStatsMap = new Map<string, BlockStats>();

      if (blocks) {
        const currentLang = i18n.language as SupportedLanguage;
        blocks.forEach(block => {
          const content = block.content as any;
          // Always use DB id as primary key — this is what analytics events store in block_id
          const dbId = block.id;
          const contentId = content?.id;

          const rawTitle = block.title || content?.title || content?.name || block.type;
          const blockTitle = typeof rawTitle === 'object'
            ? getI18nText(rawTitle, currentLang)
            : rawTitle;

          const stats: BlockStats = {
            blockId: dbId,
            blockType: block.type,
            blockTitle,
            clicks: 0,
            views: 0,
            ctr: 0,
          };
          // Register under DB id (primary)
          blockStatsMap.set(dbId, stats);
          // Also register under content id as alias so old events match
          if (contentId && contentId !== dbId) {
            blockStatsMap.set(contentId, stats);
          }
        });
      }

      // Count clicks per block from events
      // block_id column may be null (FK constraint rejects non-UUID content IDs)
      // so also check metadata.blockId for the content-level ID
      events.filter(e => e.event_type === 'click').forEach(e => {
        const blockRef = e.block_id
          || getMetaString(e.metadata, 'blockId', 'block_id', 'blockType', 'block_type');
        if (!blockRef) return;
        const stats = blockStatsMap.get(blockRef);
        if (stats) {
          stats.clicks++;
        }
      });

      // Count views per block (page-level views often have null block_id — those are not attributed)
      events.filter(e => e.event_type === 'view').forEach(e => {
        const blockRef =
          e.block_id
          || getMetaString(e.metadata, 'blockId', 'block_id');
        if (!blockRef) return;
        const stats = blockStatsMap.get(blockRef);
        if (stats) {
          stats.views = (stats.views ?? 0) + 1;
        }
      });

      // CTR per block: clicks / views for that block (not whole page views)
      blockStatsMap.forEach(stats => {
        stats.ctr = stats.views > 0 ? (stats.clicks / stats.views) * 100 : 0;
        if (isNaN(stats.ctr)) stats.ctr = 0;
      });

      // Deduplicate — aliases share the same stats object reference
      const seen = new Set<BlockStats>();
      const topBlocks = Array.from(blockStatsMap.values())
        .filter(s => { if (seen.has(s)) return false; seen.add(s); return true; })
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      // Generate time series data
      const dailyData = generateDailyData(events, startDate, now);
      const weeklyData = generateWeeklyData(events, subMonths(now, 3), now);
      const monthlyData = generateMonthlyData(events, subMonths(now, 12), now);

      // Calculate traffic sources
      const sourceMap = new Map<string, number>();
      events.filter(e => e.event_type === 'view').forEach(e => {
        const source = getMetaString(e.metadata, 'source', 'referrer_source') || 'direct';
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
        const deviceRaw = getMetaString(e.metadata, 'device', 'device_type');
        const device = deviceRaw as 'mobile' | 'tablet' | 'desktop' | undefined;
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
        const countryCode = getMetaString(e.metadata, 'country', 'country_code') || 'unknown';
        const country = getMetaString(e.metadata, 'countryName', 'country_name') || countryCode;
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

      // Calculate bounce rate based on sessions (a bounce = session with view but no click)
      const sessionEvents = new Map<string, Set<string>>();
      events.forEach(e => {
        const sid = getMetaString(e.metadata, 'sessionId', 'session_id') || e.id;
        if (!sessionEvents.has(sid)) sessionEvents.set(sid, new Set());
        sessionEvents.get(sid)!.add(e.event_type);
      });
      const totalSessions = sessionEvents.size;
      const bouncedSessions = Array.from(sessionEvents.values()).filter(
        types => types.has('view') && !types.has('click')
      ).length;
      const bounceRate = totalSessions > 0
        ? Math.max(0, Math.min(100, (bouncedSessions / totalSessions) * 100))
        : 0;

      // Calculate average session duration from session_end events or view metadata
      const allDurations: number[] = [];
      // Check session_end events
      const { data: sessionEndEvents } = await supabase
        .from('analytics')
        .select('metadata')
        .eq('page_id', pageId)
        .eq('event_type', 'session_end')
        .gte('created_at', startDate.toISOString());

      if (sessionEndEvents) {
        sessionEndEvents.forEach((e: any) => {
          const d = e.metadata?.sessionDuration ?? e.metadata?.session_duration;
          if (typeof d === 'number' && d > 0 && d < 3600) {
            allDurations.push(d);
          }
        });
      }

      // Also check durations embedded in view metadata
      events
        .forEach(e => {
          const duration = e.metadata?.sessionDuration ?? e.metadata?.session_duration;
          if (typeof duration === 'number' && duration > 0 && duration < 3600) {
            allDurations.push(duration);
          }
        });

      const avgSessionDuration = allDurations.length > 0
        ? Math.round(allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length)
        : (totalViews > 0 ? 45 : 0); // Default estimate only if there are views

      // Calculate returning visitors — visitorId with >1 unique sessionId
      const visitorSessions = new Map<string, Set<string>>();
      events.filter(e => e.event_type === 'view').forEach(e => {
        const vid = getMetaString(e.metadata, 'visitorId', 'visitor_id');
        if (!vid) return;
        const sid = getMetaString(e.metadata, 'sessionId', 'session_id') || e.id;
        if (!visitorSessions.has(vid)) visitorSessions.set(vid, new Set());
        visitorSessions.get(vid)!.add(sid);
      });
      const returningCount = Array.from(visitorSessions.values()).filter(s => s.size > 1).length;
      const returningVisitorsPercent = uniqueVisitors > 0 ? (returningCount / uniqueVisitors) * 100 : 0;

      // Fetch conversions (leads + bookings + event_registrations)
      const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .eq('user_id', user.id)
        .eq('page_id', pageId)
        .gte('created_at', startDate.toISOString());

      const { data: bookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('owner_id', user.id)
        .eq('page_id', pageId)
        .gte('created_at', startDate.toISOString());

      const { data: eventRegistrations } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('owner_id', user.id)
        .eq('page_id', pageId)
        .gte('created_at', startDate.toISOString());

      const totalConversions = (leads?.length || 0) + (bookings?.length || 0) + (eventRegistrations?.length || 0);

      const viewEvents = events.filter(e => e.event_type === 'view');
      const visitorCoverageCount = viewEvents.filter(e => !!getMetaString(e.metadata, 'visitorId', 'visitor_id')).length;
      const sessionCoverageCount = viewEvents.filter(e => !!getMetaString(e.metadata, 'sessionId', 'session_id')).length;
      const deviceCoverageCount = viewEvents.filter(e => !!getMetaString(e.metadata, 'device', 'device_type')).length;
      const sourceCoverageCount = viewEvents.filter(e => !!getMetaString(e.metadata, 'source', 'referrer_source')).length;
      const denominator = viewEvents.length || 1;

      // Staff Performance Calculation
      let staffStats: StaffStats[] = [];
      let personalStaffStats: StaffStats | undefined;

      if (bookings) {
        let allStaff: any[] | null = null;
        try {
          const { data } = await supabase
            .from('zone_staff')
            .select('id, name')
            .eq('owner_id', user.id);
          allStaff = data;
        } catch {
          // zone_staff table may not exist — silent fallback
        }

        const staffMap = new Map<string, StaffStats>();
        
        // Initialize map with all staff if owner
        if (allStaff && !isStaffMember) {
          allStaff.forEach(s => {
            staffMap.set(s.id, { staffId: s.id, name: s.name, bookings: 0, revenue: 0, completionRate: 0 });
          });
        }

        bookings.forEach((b: any) => {
          const sid = b.staff_id || 'unassigned';
          const existing = staffMap.get(sid);
          const amount = b.payment_amount || 0;
          
          if (existing) {
            existing.bookings++;
            existing.revenue += amount;
          } else if (!isStaffMember) {
            staffMap.set(sid, { 
              staffId: sid, 
              name: sid === 'unassigned' ? (i18n.language === 'ru' ? 'Без специалиста' : 'Unassigned') : sid, 
              bookings: 1, 
              revenue: amount,
              completionRate: 0 
            });
          }
        });

        staffStats = Array.from(staffMap.values()).sort((a, b) => b.bookings - a.bookings);

        if (isStaffMember && currentStaffId) {
          personalStaffStats = {
            staffId: currentStaffId,
            name: staffMemberName || '',
            bookings: bookings.filter((b: any) => b.staff_id === currentStaffId).length,
            revenue: bookings.filter((b: any) => b.staff_id === currentStaffId).reduce((sum: number, b: any) => sum + (b.payment_amount || 0), 0),
            completionRate: 100 // Default for now
          };
        }
      }

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
        dataQuality: {
          visitorCoverage: (visitorCoverageCount / denominator) * 100,
          sessionCoverage: (sessionCoverageCount / denominator) * 100,
          deviceCoverage: (deviceCoverageCount / denominator) * 100,
          sourceCoverage: (sourceCoverageCount / denominator) * 100,
        },
        staffStats,
        personalStaffStats
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setError(message);
      logger.error('Error fetching analytics:', error, { context: 'usePageAnalytics' });
    } finally {
      setLoading(false);
    }
  }, [user, pageId, period, i18n.language, isStaffMember, currentStaffId]);

  useEffect(() => {
    if (pageId) {
      fetchAnalytics();
    } else {
      setLoading(false);
      setAnalytics(null);
      setError(null);
    }
  }, [fetchAnalytics, pageId]);

  return {
    analytics,
    loading,
    error,
    period,
    setPeriod,
    isStaffMember,
    staffMemberName,
    refresh: fetchAnalytics,
  };
}

function generateDailyData(events: AnalyticsEvent[], start: Date, end: Date): TimeSeriesData[] {
  const days = eachDayOfInterval({ start, end });

  return days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayEvents = events.filter(e => {
      if (!e.created_at) return false;
      return format(new Date(e.created_at), 'yyyy-MM-dd') === dayStr;
    });

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
      if (!e.created_at) return false;
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
      if (!e.created_at) return false;
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

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/platform/supabase/client';
import { AnalyticsFilterPanel, AnalyticsFilters } from './AnalyticsFilterPanel';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval, eachHourOfInterval, startOfHour } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';
import { 
  Loader2, Eye, MousePointer, Share2, TrendingUp, TrendingDown,
  Users, Clock, Globe, Smartphone, Monitor, Tablet, Activity,
  BarChart3, Target, Zap, Calendar
} from 'lucide-react';

interface AnalyticsData {
  // Overview stats
  totalViews: number;
  totalClicks: number;
  totalShares: number;
  totalEvents: number;
  uniqueVisitors: number;
  totalSessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  
  // Trends
  viewsTrend: number;
  clicksTrend: number;
  sharesTrend: number;
  
  // Time series
  dailyEvents: DailyEventData[];
  hourlyEvents: HourlyEventData[];
  
  // Breakdowns
  eventsByType: { name: string; count: number; color: string }[];
  eventsByDevice: { name: string; count: number; color: string }[];
  eventsBySource: { name: string; count: number; color: string }[];
  topPages: { page_id: string; slug: string; views: number; clicks: number; ctr: number }[];
  topBlocks: { block_id: string; type: string; clicks: number }[];
  
  // Engagement metrics
  engagementByHour: { hour: number; events: number }[];
  engagementByDay: { day: string; events: number }[];
}

interface DailyEventData {
  date: string;
  views: number;
  clicks: number;
  shares: number;
  sessions: number;
  visitors: number;
}

interface HourlyEventData {
  hour: string;
  views: number;
  clicks: number;
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

export function AdminAnalyticsDashboard() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '14d' | '30d' | '90d'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    devices: [],
    sources: [],
    pages: [],
  });

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'ru': return ru;
      case 'kk': return kk;
      default: return enUS;
    }
  };

  const getDayNames = () => [
    t('admin.dayNames.sun'),
    t('admin.dayNames.mon'),
    t('admin.dayNames.tue'),
    t('admin.dayNames.wed'),
    t('admin.dayNames.thu'),
    t('admin.dayNames.fri'),
    t('admin.dayNames.sat')
  ];

  const getPeriodDays = useCallback(() => {
    switch (period) {
      case '7d': return 7;
      case '14d': return 14;
      case '30d': return 30;
      case '90d': return 90;
    }
  }, [period]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const days = getPeriodDays();
      const startDate = subDays(new Date(), days);
      const prevStartDate = subDays(startDate, days);

      // Load all analytics data
      const [
        { data: currentEvents },
        { data: previousEvents },
        { data: pagesData },
        { data: blocksData }
      ] = await Promise.all([
        supabase.from('analytics')
          .select('*')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true }),
        supabase.from('analytics')
          .select('*')
          .gte('created_at', prevStartDate.toISOString())
          .lt('created_at', startDate.toISOString()),
        supabase.from('pages')
          .select('id, slug, view_count'),
        supabase.from('blocks')
          .select('id, type, click_count, page_id')
      ]);

      const events = currentEvents || [];
      const prevEvents = previousEvents || [];

      // Calculate overview stats
      const views = events.filter(e => e.event_type === 'view').length;
      const clicks = events.filter(e => e.event_type === 'click').length;
      const shares = events.filter(e => e.event_type === 'share').length;
      
      const prevViews = prevEvents.filter(e => e.event_type === 'view').length;
      const prevClicks = prevEvents.filter(e => e.event_type === 'click').length;
      const prevShares = prevEvents.filter(e => e.event_type === 'share').length;

      // Extract unique visitors and sessions from metadata
      const visitorIds = new Set<string>();
      const sessionIds = new Set<string>();
      
      events.forEach(e => {
        const meta = e.metadata as Record<string, unknown> | null;
        // Support both naming conventions: visitorId/sessionId and visitor_id/session_id
        const visitorId = getString(meta, 'visitorId') || getString(meta, 'visitor_id');
        const sessionId = getString(meta, 'sessionId') || getString(meta, 'session_id');
        
        if (visitorId) visitorIds.add(visitorId);
        if (sessionId) sessionIds.add(sessionId);
      });

      // Calculate trends
      const calcTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      // Generate daily data
      const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });
      const dailyEvents: DailyEventData[] = dateRange.map(day => {
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayEvents = events.filter(e => {
          const d = new Date(e.created_at);
          return d >= dayStart && d < dayEnd;
        });

        const dayVisitors = new Set<string>();
        const daySessions = new Set<string>();
        dayEvents.forEach(e => {
          const meta = e.metadata as Record<string, unknown> | null;
          const visitorId = getString(meta, 'visitor_id');
          const sessionId = getString(meta, 'session_id');
          if (visitorId) dayVisitors.add(visitorId);
          if (sessionId) daySessions.add(sessionId);
        });

        return {
          date: format(day, 'dd.MM'),
          views: dayEvents.filter(e => e.event_type === 'view').length,
          clicks: dayEvents.filter(e => e.event_type === 'click').length,
          shares: dayEvents.filter(e => e.event_type === 'share').length,
          sessions: daySessions.size,
          visitors: dayVisitors.size
        };
      });

      // Generate hourly data for last 24 hours
      const last24Hours = eachHourOfInterval({
        start: subDays(new Date(), 1),
        end: new Date()
      });
      
      const hourlyEvents: HourlyEventData[] = last24Hours.map(hour => {
        const hourStart = startOfHour(hour);
        const hourEnd = new Date(hourStart);
        hourEnd.setHours(hourEnd.getHours() + 1);

        const hourEvents = events.filter(e => {
          const d = new Date(e.created_at);
          return d >= hourStart && d < hourEnd;
        });

        return {
          hour: format(hour, 'HH:00'),
          views: hourEvents.filter(e => e.event_type === 'view').length,
          clicks: hourEvents.filter(e => e.event_type === 'click').length
        };
      });

      // Event type breakdown
      const eventsByType = [
        { name: 'Просмотры', count: views, color: COLORS.views },
        { name: 'Клики', count: clicks, color: COLORS.clicks },
        { name: 'Шейры', count: shares, color: COLORS.shares }
      ];

      // Device breakdown - support both device and device_type
      const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
      events.forEach(e => {
        const meta = e.metadata as Record<string, unknown> | null;
        const device = getString(meta, 'device') || getString(meta, 'device_type') || 'unknown';
        deviceCounts[device] = (deviceCounts[device] || 0) + 1;
      });

      const eventsByDevice = [
        { name: 'Desktop', count: deviceCounts.desktop, color: COLORS.desktop },
        { name: 'Mobile', count: deviceCounts.mobile, color: COLORS.mobile },
        { name: 'Tablet', count: deviceCounts.tablet, color: COLORS.tablet },
        { name: 'Unknown', count: deviceCounts.unknown, color: COLORS.other }
      ].filter(d => d.count > 0);

      // Source breakdown - support both source and referrer_source
      const sourceCounts: Record<string, number> = {};
      events.forEach(e => {
        const meta = e.metadata as Record<string, unknown> | null;
        const source = getString(meta, 'source') || getString(meta, 'referrer_source') || 'direct';
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      });

      const sourceColors: Record<string, string> = {
        direct: COLORS.direct,
        social: COLORS.social,
        search: COLORS.search,
        referral: COLORS.referral
      };

      const eventsBySource = Object.entries(sourceCounts)
        .map(([name, count]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          count,
          color: sourceColors[name] || COLORS.other
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top pages by views
      const pageViewCounts: Record<string, { views: number; clicks: number }> = {};
      events.forEach(e => {
        if (!e.page_id) return;
        if (!pageViewCounts[e.page_id]) {
          pageViewCounts[e.page_id] = { views: 0, clicks: 0 };
        }
        if (e.event_type === 'view') pageViewCounts[e.page_id].views++;
        if (e.event_type === 'click') pageViewCounts[e.page_id].clicks++;
      });

      const pageMap = new Map(pagesData?.map(p => [p.id, p]) || []);
      const topPages = Object.entries(pageViewCounts)
        .map(([page_id, stats]) => {
          const page = pageMap.get(page_id);
          return {
            page_id,
            slug: page?.slug || 'Unknown',
            views: stats.views,
            clicks: stats.clicks,
            ctr: stats.views > 0 ? Math.round((stats.clicks / stats.views) * 100) : 0
          };
        })
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Top blocks by clicks
      const blockClickCounts: Record<string, { type: string; clicks: number }> = {};
      events.forEach(e => {
        if (!e.block_id || e.event_type !== 'click') return;
        const meta = e.metadata as Record<string, unknown> | null;
        if (!blockClickCounts[e.block_id]) {
          blockClickCounts[e.block_id] = { type: getString(meta, 'block_type') || 'Unknown', clicks: 0 };
        }
        blockClickCounts[e.block_id].clicks++;
      });

      const topBlocks = Object.entries(blockClickCounts)
        .map(([block_id, stats]) => ({
          block_id,
          type: stats.type,
          clicks: stats.clicks
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      // Engagement by hour of day
      const hourCounts: Record<number, number> = {};
      events.forEach(e => {
        const hour = new Date(e.created_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });

      const engagementByHour = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        events: hourCounts[hour] || 0
      }));

      // Engagement by day of week
      const dayNamesArr = getDayNames();
      const dayCounts: Record<number, number> = {};
      events.forEach(e => {
        const day = new Date(e.created_at).getDay();
        dayCounts[day] = (dayCounts[day] || 0) + 1;
      });

      const engagementByDay = Array.from({ length: 7 }, (_, i) => ({
        day: dayNamesArr[i],
        events: dayCounts[i] || 0
      }));

      setAnalytics({
        totalViews: views,
        totalClicks: clicks,
        totalShares: shares,
        totalEvents: events.length,
        uniqueVisitors: visitorIds.size,
        totalSessions: sessionIds.size,
        avgSessionDuration: 0, // Would need proper tracking
        bounceRate: 0, // Would need proper tracking
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
        engagementByDay
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

  // Helper function for safe metadata access
  const getString = (obj: Record<string, unknown> | null | undefined, key: string): string | undefined => {
    const val = obj?.[key];
    return typeof val === 'string' ? val : undefined;
  };

  // Memoize filter functions before early returns
  const applyFilters = useCallback(
    (data: AnalyticsData, activeFilters: AnalyticsFilters): AnalyticsData => {
      // If no filters selected, return all data
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

  // Get available filter options - memoized before returns
  const filteredAnalytics = useMemo(
    () => analytics ? applyFilters(analytics, filters) : null,
    [analytics, filters, applyFilters]
  );

  const availableDevices = useMemo(
    () => analytics?.eventsByDevice.map(d => d.name.toLowerCase()) || [],
    [analytics]
  );

  const availableSources = useMemo(
    () => analytics?.eventsBySource.map(s => s.name.toLowerCase()) || [],
    [analytics]
  );

  const availablePages = useMemo(
    () => analytics?.topPages.map(p => p.slug) || [],
    [analytics]
  );

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const renderTrend = (value: number) => {
    if (value > 0) {
      return (
        <span className="flex items-center text-green-500 text-xs md:text-sm">
          <TrendingUp className="h-3 w-3 md:h-4 md:w-4 mr-0.5" />
          +{value}%
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center text-red-500 text-xs md:text-sm">
          <TrendingDown className="h-3 w-3 md:h-4 md:w-4 mr-0.5" />
          {value}%
        </span>
      );
    }
    return <span className="text-muted-foreground text-xs md:text-sm">0%</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics || !filteredAnalytics) {
    return <div className="text-center py-12 text-muted-foreground">{t('admin.noData')}</div>;
  }
  const translatedEventsByType = [
    { name: t('admin.views'), count: analytics.totalViews, color: COLORS.views },
    { name: t('admin.clicks'), count: analytics.totalClicks, color: COLORS.clicks },
    { name: t('admin.shares'), count: analytics.totalShares, color: COLORS.shares }
  ];

return (
    <div className="space-y-4 md:space-y-6">
      {/* Period Selector & Filters - Mobile optimized */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl md:text-2xl font-bold">{t('admin.detailedAnalytics')}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <AnalyticsFilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            availableDevices={availableDevices}
            availableSources={availableSources}
            availablePages={availablePages}
          />
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-full sm:w-[140px] bg-card">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="7d">{t('admin.period7d')}</SelectItem>
              <SelectItem value="14d">{t('admin.period14d')}</SelectItem>
              <SelectItem value="30d">{t('admin.period30d')}</SelectItem>
              <SelectItem value="90d">{t('admin.period90d')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics - Responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 md:p-2 rounded-lg bg-cyan-500/10">
                <Eye className="h-4 w-4 md:h-5 md:w-5 text-cyan-500" />
              </div>
              {renderTrend(analytics.viewsTrend)}
            </div>
            <p className="text-lg md:text-2xl font-bold">{formatNumber(analytics.totalViews)}</p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{t('admin.views')}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 md:p-2 rounded-lg bg-orange-500/10">
                <MousePointer className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
              </div>
              {renderTrend(analytics.clicksTrend)}
            </div>
            <p className="text-lg md:text-2xl font-bold">{formatNumber(analytics.totalClicks)}</p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{t('admin.clicks')}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 md:p-2 rounded-lg bg-pink-500/10">
                <Share2 className="h-4 w-4 md:h-5 md:w-5 text-pink-500" />
              </div>
              {renderTrend(analytics.sharesTrend)}
            </div>
            <p className="text-lg md:text-2xl font-bold">{formatNumber(analytics.totalShares)}</p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{t('admin.shares')}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 md:p-2 rounded-lg bg-purple-500/10">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
              </div>
            </div>
            <p className="text-lg md:text-2xl font-bold">{formatNumber(analytics.totalEvents)}</p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{t('admin.events')}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 md:p-2 rounded-lg bg-green-500/10">
                <Users className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
              </div>
            </div>
            <p className="text-lg md:text-2xl font-bold">{formatNumber(analytics.uniqueVisitors)}</p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{t('admin.visitors')}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 md:p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              </div>
            </div>
            <p className="text-lg md:text-2xl font-bold">{formatNumber(analytics.totalSessions)}</p>
            <p className="text-xs md:text-sm text-muted-foreground truncate">{t('admin.sessions')}</p>
          </CardContent>
        </Card>
      </div>

      {/* CTR Metric - Compact on mobile */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">{t('admin.totalCTR')}</p>
              <p className="text-2xl md:text-4xl font-bold text-primary">
                {analytics.totalViews > 0 
                  ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="p-3 md:p-4 rounded-full bg-primary/10">
              <Target className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            </div>
          </div>
          <div className="mt-2 text-xs md:text-sm text-muted-foreground">
            {formatNumber(analytics.totalClicks)} {t('admin.clicks').toLowerCase()} / {formatNumber(analytics.totalViews)} {t('admin.views').toLowerCase()}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="w-full flex-wrap h-auto p-1 bg-muted/50">
          <TabsTrigger value="timeline" className="flex-1 min-w-[80px] text-xs md:text-sm py-2">
            <BarChart3 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('admin.timeline')}</span>
            <span className="sm:hidden">{t('admin.timeline').substring(0, 3)}.</span>
          </TabsTrigger>
          <TabsTrigger value="breakdown" className="flex-1 min-w-[80px] text-xs md:text-sm py-2">
            <Activity className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('admin.breakdown')}</span>
            <span className="sm:hidden">{t('admin.breakdown').substring(0, 4)}.</span>
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex-1 min-w-[80px] text-xs md:text-sm py-2">
            <Zap className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('admin.engagement')}</span>
            <span className="sm:hidden">{t('admin.engagement').substring(0, 4)}.</span>
          </TabsTrigger>
          <TabsTrigger value="top" className="flex-1 min-w-[80px] text-xs md:text-sm py-2">
            <Target className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1 md:mr-2" />
            <span className="hidden sm:inline">{t('admin.topContent')}</span>
            <span className="sm:hidden">{t('admin.topContent').substring(0, 3)}</span>
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4 md:space-y-6">
          {/* Daily Events Chart */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="text-base md:text-lg">{t('admin.eventsByDays')}</CardTitle>
              <CardDescription className="text-xs md:text-sm">{t('admin.viewsClicksShares')}</CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="h-[250px] md:h-[350px] -mx-2 md:mx-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={analytics.dailyEvents}>
                    <defs>
                      <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.views} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.views} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9 }} width={35} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name={t('admin.views')}
                      stroke={COLORS.views}
                      fill="url(#viewsGrad)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="clicks"
                      name={t('admin.clicks')}
                      stroke={COLORS.clicks}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="shares"
                      name={t('admin.shares')}
                      stroke={COLORS.shares}
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Sessions & Visitors */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="text-base md:text-lg">{t('admin.sessionsAndVisitors')}</CardTitle>
              <CardDescription className="text-xs md:text-sm">{t('admin.uniqueSessionsVisitors')}</CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="h-[200px] md:h-[300px] -mx-2 md:mx-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.dailyEvents}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 9 }} width={35} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="sessions" name={t('admin.sessions')} fill={COLORS.sessions} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="visitors" name={t('admin.visitors')} fill={COLORS.visitors} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Hourly Activity */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="text-base md:text-lg">{t('admin.activity24h')}</CardTitle>
              <CardDescription className="text-xs md:text-sm">{t('admin.hourlyDistribution')}</CardDescription>
            </CardHeader>
            <CardContent className="p-2 md:p-6 pt-0">
              <div className="h-[180px] md:h-[250px] -mx-2 md:mx-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.hourlyEvents}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="hour" tick={{ fontSize: 8 }} interval={2} />
                    <YAxis tick={{ fontSize: 9 }} width={30} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area
                      type="monotone"
                      dataKey="views"
                      name={t('admin.views')}
                      stroke={COLORS.views}
                      fill={COLORS.views}
                      fillOpacity={0.3}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      name={t('admin.clicks')}
                      stroke={COLORS.clicks}
                      fill={COLORS.clicks}
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value="breakdown" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Event Types */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="text-base md:text-lg">{t('admin.eventTypes')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="h-[160px] md:h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={translatedEventsByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="count"
                      >
                        {translatedEventsByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '12px', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {translatedEventsByType.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs md:text-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{formatNumber(item.count)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Devices */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  {t('admin.devices')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="h-[160px] md:h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredAnalytics.eventsByDevice}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="count"
                      >
                        {filteredAnalytics.eventsByDevice.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '12px', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {filteredAnalytics.eventsByDevice.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs md:text-sm">
                      <div className="flex items-center gap-1.5">
                        {item.name === 'Desktop' && <Monitor className="h-3.5 w-3.5" />}
                        {item.name === 'Mobile' && <Smartphone className="h-3.5 w-3.5" />}
                        {item.name === 'Tablet' && <Tablet className="h-3.5 w-3.5" />}
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{formatNumber(item.count)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Traffic Sources */}
            <Card className="overflow-hidden md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  {t('admin.sources')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="h-[160px] md:h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredAnalytics.eventsBySource}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="count"
                      >
                        {filteredAnalytics.eventsBySource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '12px', backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '6px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 mt-2">
                  {filteredAnalytics.eventsBySource.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs md:text-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{formatNumber(item.count)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* By Hour of Day */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="text-base md:text-lg">{t('admin.byHours')}</CardTitle>
                <CardDescription className="text-xs md:text-sm">{t('admin.activityDuringDay')}</CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-6 pt-0">
                <div className="h-[200px] md:h-[280px] -mx-2 md:mx-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.engagementByHour}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="hour" tick={{ fontSize: 8 }} tickFormatter={(h) => `${h}`} interval={2} />
                      <YAxis tick={{ fontSize: 9 }} width={30} />
                      <Tooltip
                        labelFormatter={(h) => `${h}:00`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="events" name={t('admin.events')} fill={COLORS.sessions} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* By Day of Week */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="text-base md:text-lg">{t('admin.byDaysOfWeek')}</CardTitle>
                <CardDescription className="text-xs md:text-sm">{t('admin.activityDistribution')}</CardDescription>
              </CardHeader>
              <CardContent className="p-2 md:p-6 pt-0">
                <div className="h-[200px] md:h-[280px] -mx-2 md:mx-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.engagementByDay} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" tick={{ fontSize: 9 }} />
                      <YAxis dataKey="day" type="category" tick={{ fontSize: 10 }} width={25} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="events" name={t('admin.events')} fill={COLORS.visitors} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Top Content Tab */}
        <TabsContent value="top" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Top Pages */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="text-base md:text-lg">{t('admin.topPages')}</CardTitle>
                <CardDescription className="text-xs md:text-sm">{t('admin.byViews')}</CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="space-y-2 md:space-y-3 max-h-[350px] overflow-y-auto">
                  {filteredAnalytics.topPages.length === 0 ? (
                    <p className="text-xs md:text-sm text-muted-foreground py-4 text-center">{t('admin.noData')}</p>
                  ) : (
                    filteredAnalytics.topPages.map((page, index) => (
                      <div key={page.page_id} className="flex items-center justify-between py-1.5 md:py-2 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                          <span className="text-muted-foreground font-mono text-xs md:text-sm w-5 md:w-6 shrink-0">#{index + 1}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-xs md:text-sm truncate">/{page.slug}</p>
                            <div className="flex gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
                              <span>{formatNumber(page.views)} {t('admin.viewsShort')}</span>
                              <span>{formatNumber(page.clicks)} {t('admin.clicksShort')}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={page.ctr >= 10 ? 'default' : 'secondary'} className="text-[10px] md:text-xs shrink-0 ml-2">
                          {page.ctr}%
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Blocks */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="text-base md:text-lg">{t('admin.topBlocks')}</CardTitle>
                <CardDescription className="text-xs md:text-sm">{t('admin.byClicks')}</CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="space-y-2 md:space-y-3 max-h-[350px] overflow-y-auto">
                  {filteredAnalytics.topBlocks.length === 0 ? (
                    <p className="text-xs md:text-sm text-muted-foreground py-4 text-center">{t('admin.noData')}</p>
                  ) : (
                    filteredAnalytics.topBlocks.map((block, index) => (
                      <div key={block.block_id} className="flex items-center justify-between py-1.5 md:py-2 border-b border-border/50 last:border-0">
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className="text-muted-foreground font-mono text-xs md:text-sm w-5 md:w-6">#{index + 1}</span>
                          <Badge variant="outline" className="text-[10px] md:text-xs">{block.type}</Badge>
                        </div>
                        <span className="font-medium text-xs md:text-sm">{formatNumber(block.clicks)}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

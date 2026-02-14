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
    const [period, setPeriod] = useState<'7d' | '14d' | '30d' | '90d'>('30d');
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [filters, setFilters] = useState<AnalyticsFilters>({
        devices: [],
        sources: [],
        pages: [],
    });

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

            // ... (Rest of calculation logic same as original)
            // Extract unique visitors and sessions from metadata
            const visitorIds = new Set<string>();
            const sessionIds = new Set<string>();

            const getString = (obj: Record<string, unknown> | null | undefined, key: string): string | undefined => {
                const val = obj?.[key];
                return typeof val === 'string' ? val : undefined;
            };

            events.forEach(e => {
                const meta = e.metadata as Record<string, unknown> | null;
                const visitorId = getString(meta, 'visitorId') || getString(meta, 'visitor_id');
                const sessionId = getString(meta, 'sessionId') || getString(meta, 'session_id');

                if (visitorId) visitorIds.add(visitorId);
                if (sessionId) sessionIds.add(sessionId);
            });

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
                    if (!e.created_at) return false;
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
                    if (!e.created_at) return false;
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

            // Device breakdown
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

            // Source breakdown
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

            // Top pages
            const pageViewCounts: Record<string, { views: number; clicks: number }> = {};
            events.forEach(e => {
                if (!e.page_id) return;
                if (!pageViewCounts[e.page_id]) {
                    pageViewCounts[e.page_id] = { views: 0, clicks: 0 };
                }
                if (e.event_type === 'view') pageViewCounts[e.page_id].views++;
                if (e.event_type === 'click') pageViewCounts[e.page_id].clicks++;
            });

            const pageMap = new Map<string, any>(pagesData?.map(p => [p.id, p]) || []);
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

            // Top blocks
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

            // Engagement by hour
            const hourCounts: Record<number, number> = {};
            events.forEach(e => {
                if (!e.created_at) return;
                const hour = new Date(e.created_at).getHours();
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            });

            const engagementByHour = Array.from({ length: 24 }, (_, hour) => ({
                hour,
                events: hourCounts[hour] || 0
            }));

            // Engagement by day
            // Note: day names generation needs i18n, moved to component or passed as simplified index
            const dayCounts: Record<number, number> = {};
            events.forEach(e => {
                if (!e.created_at) return;
                const day = new Date(e.created_at).getDay();
                dayCounts[day] = (dayCounts[day] || 0) + 1;
            });

            // Need day names for final mapping -> returning raw counts or generic names?
            // For now, let's keep it consistent with the logic, but we need dayNames from translation
            // We will perform mapping in the component to keep this hook pure logic or accept t()
            const engagementByDay = Array.from({ length: 7 }, (_, i) => ({
                day: i.toString(), // Map to name in component
                events: dayCounts[i] || 0
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
        filteredAnalytics
    };
}

export { COLORS };

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useZoneAnalytics } from '@/hooks/zones/useZoneAnalytics';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { useZoneInvoices } from '@/hooks/zones/useZoneInvoices';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { useZoneContext } from '@/contexts/ZoneContext';
import { Target, TrendingUp, TrendingDown, Filter, CheckCircle2, Clock, DollarSign, ListTodo, FileText, Users, Table, BarChart3, FileDown } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import { toast } from 'sonner';
import { subDays, isAfter, format, startOfDay } from 'date-fns';

type Period = '7d' | '30d' | '90d' | 'all';

interface ZoneAnalyticsScreenProps {
    zoneId: string;
}

const PERIOD_OPTIONS: { value: Period; labelKey: string; defaultLabel: string }[] = [
    { value: '7d', labelKey: 'zones.analytics.period.7d', defaultLabel: '7 days' },
    { value: '30d', labelKey: 'zones.analytics.period.30d', defaultLabel: '30 days' },
    { value: '90d', labelKey: 'zones.analytics.period.90d', defaultLabel: '90 days' },
    { value: 'all', labelKey: 'zones.analytics.period.all', defaultLabel: 'All time' },
];

const FUNNEL_COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

export function ZoneAnalyticsScreen({ zoneId }: ZoneAnalyticsScreenProps) {
    const { t } = useTranslation();
    const { metrics, teamMetrics, conversionTrend, loading } = useZoneAnalytics(zoneId);
    const { deals } = useZoneDeals(zoneId);
    const { invoices } = useZoneInvoices(zoneId);
    const { contacts } = useZoneContacts(zoneId);
    const { currentZone } = useZoneContext();
    const [period, setPeriod] = useState<Period>('30d');

    const periodStart = useMemo(() => {
        if (period === 'all') return null;
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        return startOfDay(subDays(new Date(), days));
    }, [period]);

    // Filter deals by period
    const periodDeals = useMemo(() => {
        if (!periodStart) return deals;
        return deals.filter(d => isAfter(new Date(d.created_at), periodStart));
    }, [deals, periodStart]);

    // Revenue timeline from paid invoices
    const revenueTimeline = useMemo(() => {
        const paidInvoices = invoices.filter(i => i.status === 'paid' && i.paid_at);
        const filtered = periodStart
            ? paidInvoices.filter(i => isAfter(new Date(i.paid_at!), periodStart))
            : paidInvoices;

        const byDay: Record<string, number> = {};
        filtered.forEach(inv => {
            const day = format(new Date(inv.paid_at!), 'MM/dd');
            byDay[day] = (byDay[day] || 0) + (inv.amount || 0);
        });

        return Object.entries(byDay)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [invoices, periodStart]);

    // New contacts over period
    const newContactsCount = useMemo(() => {
        if (!periodStart) return contacts?.length || 0;
        return (contacts || []).filter(c => isAfter(new Date(c.created_at), periodStart)).length;
    }, [contacts, periodStart]);

    // Export to Excel
    const handleExport = useCallback(async () => {
        try {
            const { exportAnalyticsToExcel } = await import('@/lib/export/excel-export-analytics');
            const pageViews = revenueTimeline.map(d => ({ date: d.date, views: d.amount }));
            await exportAnalyticsToExcel({
                pageViews,
                blockStats: metrics.deals.funnel.map(f => ({
                    blockId: f.stageName,
                    blockType: 'stage',
                    views: 0,
                    clicks: f.count,
                    ctr: 0,
                })),
                dateRange: period,
            });
            toast.success(t('zones.analytics.exportSuccess', 'Data exported successfully'));
        } catch {
            toast.error(t('zones.analytics.exportError', 'Export failed'));
        }
    }, [revenueTimeline, metrics, period, t]);

    // Export to PDF
    const handlePDFExport = useCallback(async () => {
        try {
            const { exportAnalyticsToPDF } = await import('@/lib/export/pdf-export-analytics');
            await exportAnalyticsToPDF({
                zoneName: currentZone?.name || 'Zone',
                period,
                metrics,
                teamMetrics,
                conversionTrend,
            });
            toast.success(t('zones.analytics.exportSuccess', 'PDF exported successfully'));
        } catch {
            toast.error(t('zones.analytics.exportError', 'Export failed'));
        }
    }, [currentZone?.name, period, metrics, teamMetrics, conversionTrend, t]);

    // Conversion trend direction
    const trendDirection = useMemo(() => {
        if (conversionTrend.length < 2) return null;
        const recent = conversionTrend.slice(-2);
        const prevRate = recent[0].won + recent[0].lost > 0 ? recent[0].won / (recent[0].won + recent[0].lost) : 0;
        const currRate = recent[1].won + recent[1].lost > 0 ? recent[1].won / (recent[1].won + recent[1].lost) : 0;
        return currRate > prevRate ? 'up' : currRate < prevRate ? 'down' : null;
    }, [conversionTrend]);

    if (loading) {
        return (
            <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
                <Skeleton className="h-10 w-64" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                    <Skeleton className="h-80 rounded-xl" />
                    <Skeleton className="h-80 rounded-xl" />
                </div>
            </div>
        );
    }

    const { deals: dealMetrics, tasks, invoices: invoiceMetrics } = metrics;

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl flex items-center gap-2.5 font-bold tracking-tight">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                        </div>
                        {t('zones.analytics.title', 'Analytics & Reports')}
                    </h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1 ml-[44px]">
                        {t('zones.analytics.subtitle', 'Sales, finances and team performance summary.')}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Period selector */}
                    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                        {PERIOD_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriod(opt.value)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                    period === opt.value
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {t(opt.labelKey, opt.defaultLabel)}
                            </button>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
                        <Table className="h-4 w-4" />
                        <span className="hidden sm:inline">Excel</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePDFExport} className="gap-2">
                        <FileDown className="h-4 w-4" />
                        <span className="hidden sm:inline">PDF</span>
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-xs md:text-sm font-medium">{t('zones.analytics.activeValue', 'Open deals value')}</p>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-xl md:text-2xl font-bold">{dealMetrics.totalOpenValue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {dealMetrics.open} {t('zones.analytics.dealsOpen', 'open deals')}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-xs md:text-sm font-medium">{t('zones.analytics.winRate', 'Win Rate')}</p>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-xl md:text-2xl font-bold">{Math.round(dealMetrics.winRate)}%</div>
                        <Progress value={dealMetrics.winRate} className="h-1.5 mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-xs md:text-sm font-medium">{t('zones.analytics.tasksDone', 'Completed tasks')}</p>
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-xl md:text-2xl font-bold flex items-end gap-1">
                            {tasks.completed} <span className="text-sm font-normal text-muted-foreground mb-0.5">/ {tasks.total}</span>
                        </div>
                        {tasks.overdue > 0 ? (
                            <p className="text-xs text-destructive mt-1 font-medium">{tasks.overdue} {t('zones.analytics.overdue', 'overdue')}</p>
                        ) : (
                            <p className="text-xs text-green-600 mt-1 font-medium">{t('zones.analytics.noOverdue', 'No overdue')}</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-xs md:text-sm font-medium">{t('zones.analytics.paidValue', 'Paid invoices')}</p>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-green-600">{invoiceMetrics.totalPaidAmount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('zones.analytics.pendingAmount', 'Pending: {{amount}} ({{count}})', {
                                amount: invoiceMetrics.totalPendingAmount.toLocaleString(),
                                count: invoiceMetrics.pending,
                            })}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between pb-2">
                            <p className="text-xs md:text-sm font-medium">{t('zones.analytics.newContacts', 'New contacts')}</p>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="text-xl md:text-2xl font-bold">{newContactsCount}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {t('zones.analytics.totalContacts', 'Total: {{count}}', { count: contacts?.length || 0 })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* P&L Summary Card */}
            <Card className="bg-gradient-to-r from-green-500/5 to-yellow-500/5 border-green-500/20">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <DollarSign className="h-5 w-5" />
                        {t('zones.analytics.plSummary', 'Revenue Summary')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-500/10 rounded-xl">
                            <p className="text-xs text-muted-foreground">{t('zones.analytics.grossRevenue', 'Gross Revenue')}</p>
                            <p className="text-2xl font-bold text-green-600">{invoiceMetrics.totalPaidAmount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{invoiceMetrics.paid} {t('zones.analytics.paidInvoices', 'paid invoices')}</p>
                        </div>
                        <div className="p-4 bg-yellow-500/10 rounded-xl">
                            <p className="text-xs text-muted-foreground">{t('zones.analytics.pendingRevenue', 'Pending Revenue')}</p>
                            <p className="text-2xl font-bold text-yellow-600">{invoiceMetrics.totalPendingAmount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{invoiceMetrics.pending} {t('zones.analytics.awaitingPayment', 'awaiting payment')}</p>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-xl">
                            <p className="text-xs text-muted-foreground">{t('zones.analytics.wonDealsValue', 'Won Deals Value')}</p>
                            <p className="text-2xl font-bold">{dealMetrics.totalWonValue.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{dealMetrics.won} {t('zones.analytics.closedDeals', 'closed deals')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Funnel Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Filter className="h-5 w-5" />
                            {t('zones.analytics.funnel', 'Sales funnel')}
                        </CardTitle>
                        <CardDescription>{t('zones.analytics.funnelDesc', 'Deals count and value per pipeline stage.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {dealMetrics.funnel.length > 0 ? (
                            <div className="space-y-2">
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={dealMetrics.funnel} layout="vertical" margin={{ left: 0, right: 16 }}>
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="stageName" width={100} tick={{ fontSize: 12 }} />
                                        <RechartsTooltip
                                            formatter={(value: number) => [value, t('zones.analytics.deals', 'Deals')]}
                                            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                                        />
                                        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                            {dealMetrics.funnel.map((_, idx) => (
                                                <Cell key={idx} fill={FUNNEL_COLORS[idx % FUNNEL_COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                {/* Value legend */}
                                <div className="grid grid-cols-2 gap-2 pt-2">
                                    {dealMetrics.funnel.map((stage, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-xs">
                                            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: FUNNEL_COLORS[idx % FUNNEL_COLORS.length] }} />
                                            <span className="text-muted-foreground truncate">{stage.stageName}</span>
                                            <span className="font-medium ml-auto">{stage.value.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground py-8 text-center">{t('zones.analytics.funnelEmpty', 'No data to display.')}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Revenue Timeline */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BarChart3 className="h-5 w-5" />
                            {t('zones.analytics.revenueTimeline', 'Revenue timeline')}
                        </CardTitle>
                        <CardDescription>{t('zones.analytics.revenueTimelineDesc', 'Paid invoices over time.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {revenueTimeline.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={revenueTimeline} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} width={60} />
                                    <RechartsTooltip
                                        formatter={(value: number) => [value.toLocaleString(), t('zones.analytics.revenue', 'Revenue')]}
                                        contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                                    />
                                    <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-sm text-muted-foreground py-8 text-center">{t('zones.analytics.noRevenue', 'No revenue data for this period.')}</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Conversion Trend */}
            {conversionTrend.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            {trendDirection === 'up' ? (
                                <TrendingUp className="h-5 w-5 text-green-500" />
                            ) : trendDirection === 'down' ? (
                                <TrendingDown className="h-5 w-5 text-destructive" />
                            ) : (
                                <Target className="h-5 w-5" />
                            )}
                            {t('zones.analytics.conversionTrend', 'Conversion Trend')}
                            {trendDirection === 'up' && <span className="text-xs text-green-500 font-normal ml-2">↑ {t('zones.analytics.improving', 'Improving')}</span>}
                            {trendDirection === 'down' && <span className="text-xs text-destructive font-normal ml-2">↓ {t('zones.analytics.declining', 'Declining')}</span>}
                        </CardTitle>
                        <CardDescription>{t('zones.analytics.conversionTrendDesc', 'Won vs. lost deals over time.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={conversionTrend} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} width={30} />
                                <RechartsTooltip
                                    contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                                />
                                <Area type="monotone" dataKey="won" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name={t('zones.analytics.won', 'Won')} />
                                <Area type="monotone" dataKey="lost" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} name={t('zones.analytics.lost', 'Lost')} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            {/* Team Performance */}
            {teamMetrics.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5" />
                            {t('zones.analytics.teamPerformance', 'Team Performance')}
                        </CardTitle>
                        <CardDescription>{t('zones.analytics.teamPerformanceDesc', 'Task completion by team member.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 px-2 font-medium">{t('zones.analytics.member', 'Member')}</th>
                                            <th className="text-center py-2 px-2 font-medium">{t('zones.analytics.tasks', 'Tasks')}</th>
                                            <th className="text-center py-2 px-2 font-medium">{t('zones.analytics.done', 'Done')}</th>
                                            <th className="text-center py-2 px-2 font-medium">%</th>
                                            <th className="text-center py-2 px-2 font-medium">{t('zones.analytics.avgClose', 'Avg. Close')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teamMetrics.map((m, i) => (
                                            <tr key={m.userId} className={i % 2 === 0 ? 'bg-muted/30' : ''}>
                                                <td className="py-2 px-2 font-medium">{m.name}</td>
                                                <td className="py-2 px-2 text-center">{m.total}</td>
                                                <td className="py-2 px-2 text-center text-green-600">{m.completed}</td>
                                                <td className="py-2 px-2 text-center">
                                                    <span className={m.completionRate >= 70 ? 'text-green-600' : m.completionRate >= 40 ? 'text-yellow-600' : 'text-destructive'}>
                                                        {m.completionRate}%
                                                    </span>
                                                </td>
                                                <td className="py-2 px-2 text-center text-muted-foreground">{m.avgDaysToClose}d</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Bar Chart */}
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={teamMetrics} layout="vertical" margin={{ left: 0, right: 16 }}>
                                        <XAxis type="number" hide />
                                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                                        <RechartsTooltip
                                            formatter={(value: number, name: string) => [value, name === 'completed' ? t('zones.analytics.completed', 'Completed') : t('zones.analytics.total', 'Total')]}
                                            contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                                        />
                                        <Bar dataKey="total" fill="hsl(var(--muted-foreground))" radius={[0, 4, 4, 0]} name="total" />
                                        <Bar dataKey="completed" fill="#10b981" radius={[0, 4, 4, 0]} name="completed" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Task Metrics */}
            <Card className="border-primary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <ListTodo className="h-5 w-5" />
                        {t('zones.analytics.taskMetrics', 'Task performance')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-green-500/5 rounded-xl">
                            <CheckCircle2 className="h-7 w-7 text-green-500 shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">{t('zones.analytics.completed', 'Completed')}</p>
                                <p className="text-xl font-bold">{tasks.completed}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-yellow-500/5 rounded-xl">
                            <Clock className="h-7 w-7 text-yellow-500 shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">{t('zones.analytics.pending', 'In progress')}</p>
                                <p className="text-xl font-bold">{tasks.pending}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-destructive/5 rounded-xl">
                            <Clock className="h-7 w-7 text-destructive shrink-0" />
                            <div>
                                <p className="text-xs text-muted-foreground">{t('zones.analytics.overdue', 'Overdue')}</p>
                                <p className="text-xl font-bold">{tasks.overdue}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-xl">
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-muted-foreground">{t('zones.analytics.completionRate', 'Completion rate')}</span>
                                <span className="font-bold">
                                    {tasks.total > 0 ? Math.round((tasks.completed / tasks.total) * 100) : 0}%
                                </span>
                            </div>
                            <Progress value={tasks.total > 0 ? (tasks.completed / tasks.total) * 100 : 0} className="h-2" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnalyticsFilterPanel } from './AnalyticsFilterPanel';
import { useAdminAnalytics, COLORS } from '@/hooks/admin/useAdminAnalytics';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Eye from 'lucide-react/dist/esm/icons/eye';
import MousePointer from 'lucide-react/dist/esm/icons/mouse-pointer';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import Users from 'lucide-react/dist/esm/icons/users';
import Activity from 'lucide-react/dist/esm/icons/activity';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Tablet from 'lucide-react/dist/esm/icons/tablet';
import Globe from 'lucide-react/dist/esm/icons/globe';

export function AdminAnalyticsDashboard() {
  const { t } = useTranslation();

  const {
    loading,
    period,
    setPeriod,
    analytics,
    filters,
    setFilters,
    filteredAnalytics
  } = useAdminAnalytics();

  const getDayNames = () => [
    t('admin.dayNames.sun'),
    t('admin.dayNames.mon'),
    t('admin.dayNames.tue'),
    t('admin.dayNames.wed'),
    t('admin.dayNames.thu'),
    t('admin.dayNames.fri'),
    t('admin.dayNames.sat')
  ];

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

  const dayNamesArr = getDayNames();

  // Transform engagementByDay to use localized names
  const displayedAnalytics = useMemo(() => {
    if (!analytics) return null;
    return {
      ...analytics,
      engagementByDay: analytics.engagementByDay.map(d => ({
        ...d,
        day: dayNamesArr[parseInt(d.day)] || d.day
      }))
    };
  }, [analytics, dayNamesArr]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  const renderTrend = (value: number) => {
    if (value === 0) return <span className="text-muted-foreground">-</span>;
    const isPositive = value > 0;
    return (
      <span className={`flex items-center text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
        {Math.abs(value)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics || !filteredAnalytics) {
    return <div className="p-4 text-center">{t('admin.noData')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('admin.analyticsTitle')}</h2>
          <p className="text-muted-foreground">{t('admin.analyticsSubtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v: string) => setPeriod(v as '7d' | '30d' | '90d' | 'all')}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t('admin.selectPeriod')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('admin.periods.7d')}</SelectItem>
              <SelectItem value="30d">{t('admin.periods.30d')}</SelectItem>
              <SelectItem value="90d">{t('admin.periods.90d')}</SelectItem>
              <SelectItem value="all">{t('admin.periods.all', 'All time')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AnalyticsFilterPanel
        filters={filters}
        onFiltersChange={setFilters}
        availableDevices={availableDevices}
        availableSources={availableSources}
        availablePages={availablePages}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalViews')}</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalViews)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {renderTrend(analytics.viewsTrend)} {t('admin.vsPrevPeriod')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalClicks')}</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalClicks)}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {renderTrend(analytics.clicksTrend)} {t('admin.vsPrevPeriod')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.uniqueVisitors')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.uniqueVisitors)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(analytics.totalSessions)} {t('admin.sessions')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.ctr', 'CTR')}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalViews > 0
                ? ((analytics.totalClicks / analytics.totalViews) * 100).toFixed(1)
                : '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('admin.ctrFormula', 'Клики / просмотры')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('admin.conversions', 'Conversions')}: {formatNumber(analytics.totalConversions)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="engagement">{t('admin.tabs.engagement')}</TabsTrigger>
          <TabsTrigger value="top">{t('admin.tabs.topContent')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>{t('admin.activityOverview')}</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.dailyEvents}>
                    <defs>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.views} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLORS.views} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.clicks} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLORS.clicks} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px' }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke={COLORS.views}
                      fillOpacity={1}
                      fill="url(#colorViews)"
                      name={t('admin.views')}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke={COLORS.clicks}
                      fillOpacity={1}
                      fill="url(#colorClicks)"
                      name={t('admin.clicks')}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="col-span-3 space-y-4">
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
              <Card className="overflow-hidden">
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
                    <BarChart data={displayedAnalytics?.engagementByDay || []} layout="vertical">
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
                            <div className="flex gap-2 md:gap-4 text-xs md:text-xs text-muted-foreground">
                              <span>{formatNumber(page.views)} {t('admin.viewsShort')}</span>
                              <span>{formatNumber(page.clicks)} {t('admin.clicksShort')}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={page.ctr >= 10 ? 'default' : 'secondary'} className="text-xs md:text-xs shrink-0 ml-2">
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
                          <Badge variant="outline" className="text-xs md:text-xs">{block.type}</Badge>
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

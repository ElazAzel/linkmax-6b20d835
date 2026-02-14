import { useTranslation } from 'react-i18next';
import { usePageAnalytics, TimePeriod } from '@/hooks/usePageAnalytics';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  MousePointerClick, 
  Share2, 
  Users, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Calendar,
  Globe,
  Smartphone,
  Tablet,
  Monitor,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Button } from '@/components/ui/button';

export function AnalyticsPanel() {
  const { t } = useTranslation();
  const { analytics, loading, period, setPeriod, refresh } = usePageAnalytics();

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
        {t('messages.loading', 'Loading...')}
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        {t('analytics.noData', 'No analytics data available')}
      </div>
    );
  }

  const chartData = period === 'month' || period === 'all' 
    ? analytics.monthlyData 
    : period === 'week' 
      ? analytics.weeklyData 
      : analytics.dailyData;

  const DEVICE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))'];
  
  const deviceData = [
    { name: t('analytics.mobile', 'Mobile'), value: analytics.deviceBreakdown.mobile, icon: Smartphone },
    { name: t('analytics.tablet', 'Tablet'), value: analytics.deviceBreakdown.tablet, icon: Tablet },
    { name: t('analytics.desktop', 'Desktop'), value: analytics.deviceBreakdown.desktop, icon: Monitor },
  ].filter(d => d.value > 0);

  const total = analytics.deviceBreakdown.mobile + analytics.deviceBreakdown.tablet + analytics.deviceBreakdown.desktop;

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-hidden">
        {/* Period Selector - Scrollable on mobile */}
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as TimePeriod)}>
            <TabsList className="grid w-full min-w-[280px] grid-cols-4">
              <TabsTrigger value="day" className="text-[10px] sm:text-xs px-2">
                {t('analytics.today', 'Today')}
              </TabsTrigger>
              <TabsTrigger value="week" className="text-[10px] sm:text-xs px-2">
                {t('analytics.week', 'Week')}
              </TabsTrigger>
              <TabsTrigger value="month" className="text-[10px] sm:text-xs px-2">
                {t('analytics.month', 'Month')}
              </TabsTrigger>
              <TabsTrigger value="all" className="text-[10px] sm:text-xs px-2">
                {t('analytics.all', 'All')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Summary Cards - 2x2 grid, responsive */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <StatCard
            icon={Eye}
            label={t('analytics.views', 'Views')}
            value={analytics.totalViews}
            change={analytics.viewsChange}
          />
          <StatCard
            icon={MousePointerClick}
            label={t('analytics.clicks', 'Clicks')}
            value={analytics.totalClicks}
            change={analytics.clicksChange}
          />
          <StatCard
            icon={Share2}
            label={t('analytics.shares', 'Shares')}
            value={analytics.totalShares}
          />
          <StatCard
            icon={Users}
            label={t('analytics.visitors', 'Visitors')}
            value={analytics.uniqueVisitors}
          />
        </div>

        {/* Average Stats - Compact */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t('analytics.avgPerDay', 'Average per day')}
            </div>
            <div className="text-right">
              <div className="text-lg sm:text-2xl font-bold">{analytics.avgViewsPerDay}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                {t('analytics.viewsPerDay', 'views / day')}
              </div>
            </div>
          </div>
        </Card>

        {/* Activity Chart - Responsive height */}
        <Card className="p-3 sm:p-4 overflow-hidden">
          <h3 className="text-xs sm:text-sm font-medium mb-3 sm:mb-4 flex items-center gap-2">
            <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {t('analytics.activityChart', 'Activity')}
          </h3>
          <div className="h-36 sm:h-48 -mx-2 sm:mx-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -25, right: 5, top: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9 }} 
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 9 }} 
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  width={30}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '11px',
                    padding: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorViews)"
                  name={t('analytics.views', 'Views')}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                  name={t('analytics.clicks', 'Clicks')}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex justify-center gap-4 mt-2 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">{t('analytics.views', 'Views')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
              <span className="text-muted-foreground">{t('analytics.clicks', 'Clicks')}</span>
            </div>
          </div>
        </Card>

        {/* Top Blocks - Compact list */}
        {analytics.topBlocks.length > 0 && (
          <Card className="p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium mb-3">
              {t('analytics.topBlocks', 'Top Content')}
            </h3>
            <div className="space-y-2">
              {analytics.topBlocks.slice(0, 5).map((block, index) => (
                <div key={block.blockId} className="flex items-center gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary/10 text-primary text-[10px] sm:text-xs flex items-center justify-center font-medium shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-medium truncate">
                      {block.blockTitle}
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {block.blockType}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-medium">{block.clicks}</div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      {block.ctr.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Clicks by Block Chart - Horizontal bar, mobile optimized */}
        {analytics.topBlocks.length > 0 && (
          <Card className="p-3 sm:p-4 overflow-hidden">
            <h3 className="text-xs sm:text-sm font-medium mb-3">
              {t('analytics.clicksByBlock', 'Clicks by Block')}
            </h3>
            <div className="h-40 sm:h-48 -mx-1 sm:mx-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.topBlocks.slice(0, 5)} 
                  layout="vertical"
                  margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis 
                    type="category" 
                    dataKey="blockTitle" 
                    tick={{ fontSize: 9 }} 
                    width={70}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '...' : value}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar 
                    dataKey="clicks" 
                    fill="hsl(var(--primary))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* Traffic Sources - Simplified progress bars */}
        {analytics.trafficSources.length > 0 && (
          <Card className="p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium mb-3 flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t('analytics.trafficSources', 'Traffic Sources')}
            </h3>
            <div className="space-y-2.5">
              {analytics.trafficSources.slice(0, 5).map((source) => (
                <div key={source.source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="capitalize truncate">{source.source}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">
                      {source.count} ({source.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div 
                      className="bg-primary h-1.5 rounded-full transition-all" 
                      style={{ width: `${Math.min(source.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Device Breakdown - Horizontal layout for mobile */}
        {deviceData.length > 0 && (
          <Card className="p-3 sm:p-4 overflow-hidden">
            <h3 className="text-xs sm:text-sm font-medium mb-3 flex items-center gap-2">
              <Monitor className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t('analytics.devices', 'Devices')}
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              {/* Pie chart - smaller on mobile */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={35}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {deviceData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={DEVICE_COLORS[index % DEVICE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend - horizontal on mobile */}
              <div className="flex flex-row sm:flex-col flex-wrap justify-center gap-2 sm:gap-1.5 flex-1">
                {deviceData.map((device, index) => {
                  const Icon = device.icon;
                  const percentage = total > 0 ? (device.value / total) * 100 : 0;
                  return (
                    <div key={device.name} className="flex items-center gap-1.5 text-xs sm:text-sm">
                      <div 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: DEVICE_COLORS[index] }}
                      />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{device.name}</span>
                      <span className="font-medium shrink-0">{percentage.toFixed(0)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Refresh Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={refresh}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('analytics.refresh', 'Refresh')}
        </Button>
      </div>
    </ScrollArea>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  change?: number;
}

function StatCard({ icon: Icon, label, value, change }: StatCardProps) {
  const showChange = change !== undefined && change !== 0;
  const isPositive = change && change > 0;
  
  return (
    <Card className="p-2.5 sm:p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5 sm:mb-1">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="text-[10px] sm:text-xs truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg sm:text-2xl font-bold">{value.toLocaleString()}</span>
        {showChange && (
          <span className={`text-[10px] sm:text-xs flex items-center gap-0.5 ${
            isPositive ? 'text-green-500' : 'text-red-500'
          }`}>
            {isPositive ? <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> : <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
            {Math.abs(change).toFixed(0)}%
          </span>
        )}
      </div>
    </Card>
  );
}
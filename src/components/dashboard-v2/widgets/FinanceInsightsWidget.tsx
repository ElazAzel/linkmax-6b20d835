import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent,
  type ChartConfig 
} from '@/components/ui/chart';
import { 
  Area, 
  AreaChart, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from 'recharts';
import { useFinanceMetrics } from '@/hooks/dashboard/useFinanceMetrics';
import { cn } from '@/lib/utils/utils';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

const chartConfig = {
  revenue: {
    label: "Выручка",
    color: "hsl(var(--primary))",
  },
  profit: {
    label: "Прибыль",
    color: "hsl(var(--secondary))",
  },
} satisfies ChartConfig;

/**
 * FinanceInsightsWidget - Displays historical revenue and profit trends.
 * Part of the Q2 "Economy Hub" modernization.
 */
export const FinanceInsightsWidget = memo(function FinanceInsightsWidget({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { metrics, loading } = useFinanceMetrics();

  const chartData = useMemo(() => {
    if (!metrics) return [];
    // Only show last 30 days but filter out future dates just in case
    return metrics.history.map(item => ({
      date: new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      revenue: item.revenue,
      profit: item.profit,
    }));
  }, [metrics]);

  if (loading) {
    return (
      <Card className={cn("glass min-h-[400px] flex items-center justify-center p-6 border-white/10", className)}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          <span className="text-sm text-muted-foreground animate-pulse font-medium">Загрузка аналитики...</span>
        </div>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <Card className={cn("overflow-hidden glass border-white/10 shadow-glass flex flex-col group", className)}>
      <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
        <CardTitle className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110 duration-500">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold tracking-tight uppercase tracking-widest">{t('dashboard.finance.insights', 'Finance Insights')}</span>
        </CardTitle>
        <CardDescription className="text-xs opacity-70 font-bold uppercase tracking-wider ml-12">
          {t('dashboard.finance.insights_desc', 'Аналитика за последние 30 дней')}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-8 flex-1 flex flex-col">
        {/* Ключевые метрики */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">
              {t('dashboard.finance.total_revenue', 'Выручка (Gross)')}
            </span>
            <div className="text-2xl font-black tracking-tighter text-white">
              {metrics.totalRevenue.toLocaleString()} ₸
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary opacity-80">
              {t('dashboard.finance.net_profit', 'Чистая прибыль')}
            </span>
            <div className="text-2xl font-black tracking-tighter text-primary">
              {metrics.netProfit.toLocaleString()} ₸
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">
              {t('dashboard.finance.conversion', 'Конверсия')}
            </span>
            <div className="text-2xl font-black tracking-tighter text-white">
              {metrics.conversionRate.toFixed(1)}%
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">
              {t('dashboard.finance.fees_paid', 'Комиссии')}
            </span>
            <div className="text-2xl font-black tracking-tighter text-destructive/80">
              -{metrics.feesPaid.toLocaleString()} ₸
            </div>
          </div>
        </div>

        {/* График */}
        <div className="flex-1 min-h-[280px] mt-2 relative">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <AreaChart data={chartData} margin={{ left: -10, right: 10, top: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-profit)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="var(--color-profit)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                vertical={false} 
                strokeDasharray="4 4" 
                stroke="rgba(255,255,255,0.03)" 
              />
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false} 
                tickMargin={12} 
                minTickGap={40}
                className="text-xs font-bold uppercase tracking-tighter text-muted-foreground/50"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tickMargin={12}
                className="text-xs font-bold text-muted-foreground/50"
                tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
              />
              <ChartTooltip content={<ChartTooltipContent className="glass shadow-2xl border-white/10" />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="var(--color-revenue)" 
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
                strokeWidth={3}
                animationDuration={1500}
                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-revenue)' }}
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                stroke="var(--color-profit)" 
                fillOpacity={1} 
                fill="url(#colorProfit)" 
                strokeWidth={3}
                animationDuration={2000}
                activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-profit)' }}
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
});

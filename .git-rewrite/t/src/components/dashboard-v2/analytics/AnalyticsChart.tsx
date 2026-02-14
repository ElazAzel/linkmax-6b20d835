/**
 * AnalyticsChart - Time series chart for views/clicks/shares
 */
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { Card } from '@/components/ui/card';
import type { TimeSeriesData } from '@/hooks/usePageAnalytics';

interface AnalyticsChartProps {
  data: TimeSeriesData[];
  title?: string;
  type?: 'line' | 'area';
  showClicks?: boolean;
  showShares?: boolean;
}

export const AnalyticsChart = memo(function AnalyticsChart({
  data,
  title,
  type = 'area',
  showClicks = true,
  showShares = false,
}: AnalyticsChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      date: item.date,
    }));
  }, [data]);

  if (!data.length) return null;

  const ChartComponent = type === 'area' ? AreaChart : LineChart;

  return (
    <Card className="p-4">
      {title && (
        <h3 className="font-bold mb-4 text-sm">{title}</h3>
      )}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
            />
            {type === 'area' ? (
              <>
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#viewsGradient)"
                  name={t('analytics.views', 'Просмотры')}
                />
                {showClicks && (
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="hsl(142 76% 36%)"
                    strokeWidth={2}
                    fill="url(#clicksGradient)"
                    name={t('analytics.clicks', 'Клики')}
                  />
                )}
              </>
            ) : (
              <>
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  name={t('analytics.views', 'Просмотры')}
                />
                {showClicks && (
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="hsl(142 76% 36%)"
                    strokeWidth={2}
                    dot={false}
                    name={t('analytics.clicks', 'Клики')}
                  />
                )}
              </>
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </Card>
  );
});

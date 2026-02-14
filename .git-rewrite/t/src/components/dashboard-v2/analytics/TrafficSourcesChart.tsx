/**
 * TrafficSourcesChart - Visual breakdown of traffic sources
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { TrafficSource } from '@/hooks/usePageAnalytics';

interface TrafficSourcesChartProps {
  sources: TrafficSource[];
  variant?: 'pie' | 'bar';
}

// Source icons/colors
const sourceConfig: Record<string, { label: string; color: string; icon: string }> = {
  instagram: { label: 'Instagram', color: '#E1306C', icon: '📸' },
  facebook: { label: 'Facebook', color: '#4267B2', icon: '📘' },
  twitter: { label: 'Twitter/X', color: '#1DA1F2', icon: '🐦' },
  tiktok: { label: 'TikTok', color: '#000000', icon: '🎵' },
  youtube: { label: 'YouTube', color: '#FF0000', icon: '📺' },
  telegram: { label: 'Telegram', color: '#0088cc', icon: '✈️' },
  whatsapp: { label: 'WhatsApp', color: '#25D366', icon: '💬' },
  vkontakte: { label: 'ВКонтакте', color: '#4A76A8', icon: '🔵' },
  linkedin: { label: 'LinkedIn', color: '#0077B5', icon: '💼' },
  google: { label: 'Google', color: '#4285F4', icon: '🔍' },
  yandex: { label: 'Яндекс', color: '#FF0000', icon: '🔎' },
  bing: { label: 'Bing', color: '#00809D', icon: '🔍' },
  direct: { label: 'Прямой', color: 'hsl(var(--primary))', icon: '🔗' },
  referral: { label: 'Реферал', color: '#9333EA', icon: '🔗' },
  unknown: { label: 'Другое', color: '#6B7280', icon: '❓' },
};

export const TrafficSourcesChart = memo(function TrafficSourcesChart({
  sources,
  variant = 'bar',
}: TrafficSourcesChartProps) {
  const { t } = useTranslation();

  const chartData = sources.map(source => {
    const config = sourceConfig[source.source] || sourceConfig.unknown;
    return {
      name: config.label,
      value: source.count,
      percentage: source.percentage,
      color: config.color,
      icon: config.icon,
    };
  });

  if (!sources.length) {
    return (
      <Card className="p-4">
        <h3 className="font-bold mb-4">{t('analytics.sources.title', 'Источники трафика')}</h3>
        <p className="text-center text-muted-foreground py-4 text-sm">
          {t('analytics.sources.noData', 'Нет данных об источниках')}
        </p>
      </Card>
    );
  }

  if (variant === 'pie') {
    return (
      <Card className="p-4">
        <h3 className="font-bold mb-4">{t('analytics.sources.title', 'Источники трафика')}</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [
                  `${value} (${chartData.find(d => d.name === name)?.percentage.toFixed(0)}%)`,
                  name,
                ]}
              />
              <Legend
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-bold mb-4">{t('analytics.sources.title', 'Источники трафика')}</h3>
      <div className="space-y-3">
        {chartData.slice(0, 6).map((source, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{source.icon}</span>
                <span className="text-sm font-medium">{source.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{source.value}</span>
                <span className="text-sm font-bold">{source.percentage.toFixed(0)}%</span>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${source.percentage}%`,
                  backgroundColor: source.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});

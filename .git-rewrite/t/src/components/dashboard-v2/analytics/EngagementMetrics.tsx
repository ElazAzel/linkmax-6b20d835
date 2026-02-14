/**
 * EngagementMetrics - Detailed engagement statistics
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Repeat, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EngagementMetricsProps {
  avgSessionDuration: number; // in seconds
  bounceRate: number; // percentage
  returningVisitors: number; // percentage
  ctr: number; // Click-through rate percentage
  totalViews: number;
  uniqueVisitors: number;
}

export const EngagementMetrics = memo(function EngagementMetrics({
  avgSessionDuration,
  bounceRate,
  returningVisitors,
  ctr,
  totalViews,
  uniqueVisitors,
}: EngagementMetricsProps) {
  const { t } = useTranslation();

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}с`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}м ${secs}с`;
  };

  const metrics = [
    {
      id: 'ctr',
      icon: Target,
      label: t('analytics.engagement.ctr', 'CTR'),
      value: `${ctr.toFixed(1)}%`,
      description: t('analytics.engagement.ctrDesc', 'Кликов на просмотр'),
      progress: Math.min(100, ctr * 5), // Scale for visualization
      color: ctr >= 10 ? 'text-emerald-500' : ctr >= 5 ? 'text-amber-500' : 'text-red-500',
      progressColor: ctr >= 10 ? 'bg-emerald-500' : ctr >= 5 ? 'bg-amber-500' : 'bg-red-500',
    },
    {
      id: 'session',
      icon: Clock,
      label: t('analytics.engagement.avgSession', 'Среднее время'),
      value: formatDuration(avgSessionDuration),
      description: t('analytics.engagement.sessionDesc', 'На странице'),
      progress: Math.min(100, (avgSessionDuration / 120) * 100), // 2min = 100%
      color: avgSessionDuration >= 60 ? 'text-emerald-500' : 'text-amber-500',
      progressColor: avgSessionDuration >= 60 ? 'bg-emerald-500' : 'bg-amber-500',
    },
    {
      id: 'bounce',
      icon: TrendingUp,
      label: t('analytics.engagement.bounceRate', 'Отказы'),
      value: `${bounceRate.toFixed(0)}%`,
      description: t('analytics.engagement.bounceDesc', 'Без взаимодействия'),
      progress: bounceRate,
      color: bounceRate <= 50 ? 'text-emerald-500' : bounceRate <= 70 ? 'text-amber-500' : 'text-red-500',
      progressColor: bounceRate <= 50 ? 'bg-emerald-500' : bounceRate <= 70 ? 'bg-amber-500' : 'bg-red-500',
      inverted: true,
    },
    {
      id: 'returning',
      icon: Repeat,
      label: t('analytics.engagement.returning', 'Возвраты'),
      value: `${returningVisitors.toFixed(0)}%`,
      description: t('analytics.engagement.returningDesc', 'Повторные визиты'),
      progress: returningVisitors,
      color: returningVisitors >= 20 ? 'text-emerald-500' : 'text-muted-foreground',
      progressColor: returningVisitors >= 20 ? 'bg-emerald-500' : 'bg-muted-foreground',
    },
  ];

  // Views per unique visitor
  const viewsPerVisitor = uniqueVisitors > 0 ? (totalViews / uniqueVisitors).toFixed(1) : '0';

  return (
    <Card className="p-4">
      <h3 className="font-bold mb-4">{t('analytics.engagement.title', 'Вовлечённость')}</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{metric.label}</span>
              </div>
              <div className={cn("text-xl font-black", metric.color)}>
                {metric.value}
              </div>
              <Progress 
                value={metric.inverted ? 100 - metric.progress : metric.progress} 
                className="h-1.5" 
              />
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </div>
          );
        })}
      </div>

      {/* Additional insight */}
      <div className="pt-3 border-t border-border/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t('analytics.engagement.viewsPerVisitor', 'Просмотров на посетителя')}
          </span>
          <span className="font-bold">{viewsPerVisitor}</span>
        </div>
      </div>
    </Card>
  );
});

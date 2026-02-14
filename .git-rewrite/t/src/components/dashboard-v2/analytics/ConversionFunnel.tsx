/**
 * ConversionFunnel - Visual funnel showing conversion stages
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, MousePointerClick, Share2, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FunnelStage {
  id: string;
  name: string;
  count: number;
  percentage: number;
  icon: React.ElementType;
  color: string;
}

interface ConversionFunnelProps {
  views: number;
  clicks: number;
  shares: number;
  conversions: number;
}

export const ConversionFunnel = memo(function ConversionFunnel({
  views,
  clicks,
  shares,
  conversions,
}: ConversionFunnelProps) {
  const { t } = useTranslation();

  const stages: FunnelStage[] = [
    {
      id: 'views',
      name: t('analytics.funnel.views', 'Просмотры'),
      count: views,
      percentage: 100,
      icon: Eye,
      color: 'bg-blue-500',
    },
    {
      id: 'clicks',
      name: t('analytics.funnel.clicks', 'Клики'),
      count: clicks,
      percentage: views > 0 ? Math.round((clicks / views) * 100) : 0,
      icon: MousePointerClick,
      color: 'bg-emerald-500',
    },
    {
      id: 'engagement',
      name: t('analytics.funnel.engagement', 'Вовлечение'),
      count: clicks + shares,
      percentage: views > 0 ? Math.round(((clicks + shares) / views) * 100) : 0,
      icon: Share2,
      color: 'bg-violet-500',
    },
    {
      id: 'conversions',
      name: t('analytics.funnel.conversions', 'Конверсии'),
      count: conversions,
      percentage: views > 0 ? Math.round((conversions / views) * 100) : 0,
      icon: UserCheck,
      color: 'bg-amber-500',
    },
  ];

  return (
    <Card className="p-4">
      <h3 className="font-bold mb-4">{t('analytics.funnel.title', 'Воронка конверсии')}</h3>
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const widthPercent = Math.max(20, stage.percentage);
          
          return (
            <div key={stage.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{stage.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{stage.count.toLocaleString()}</span>
                  <Badge variant="outline" className="text-xs">
                    {stage.percentage}%
                  </Badge>
                </div>
              </div>
              <div className="h-8 bg-muted/50 rounded-lg overflow-hidden relative">
                <div
                  className={cn("h-full transition-all duration-500 rounded-lg", stage.color)}
                  style={{ width: `${widthPercent}%`, opacity: 0.8 }}
                />
                {index < stages.length - 1 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    →
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Conversion rate summary */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {t('analytics.funnel.overallConversion', 'Общая конверсия')}
          </span>
          <span className={cn(
            "text-lg font-black",
            conversions > 0 ? "text-emerald-500" : "text-muted-foreground"
          )}>
            {views > 0 ? ((conversions / views) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>
    </Card>
  );
});

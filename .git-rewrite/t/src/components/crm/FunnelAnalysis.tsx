import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Eye, 
  MousePointerClick, 
  UserCheck, 
  ShoppingCart,
  ArrowDown,
  TrendingDown,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useFunnelAnalytics, FunnelStep } from '@/hooks/useFunnelAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

export function FunnelAnalysis() {
  const { t } = useTranslation();
  const { funnel, loading } = useFunnelAnalytics();

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!funnel || funnel.steps.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">{t('funnel.noData', 'Недостаточно данных')}</p>
        <p className="text-sm mt-1">{t('funnel.noDataDesc', 'Данные появятся после посещений вашей страницы')}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="p-3 sm:p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            {t('funnel.title', 'Воронка конверсий')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    {t('funnel.description', 'Показывает путь пользователей от просмотра страницы до целевого действия')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h3>
        </div>

        {/* Overall Conversion Rate */}
        <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">{t('funnel.overallConversion', 'Общая конверсия')}</p>
              <p className="text-2xl font-bold text-primary">{funnel.overallConversionRate.toFixed(1)}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">{t('funnel.totalVisitors', 'Всего посетителей')}</p>
              <p className="text-lg font-semibold">{funnel.totalVisitors.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Funnel Steps */}
        <div className="space-y-2">
          {funnel.steps.map((step, index) => (
            <FunnelStepCard 
              key={step.name} 
              step={step} 
              index={index}
              isLast={index === funnel.steps.length - 1}
              previousCount={index > 0 ? funnel.steps[index - 1].count : step.count}
            />
          ))}
        </div>

        {/* Insights */}
        {funnel.insights.length > 0 && (
          <Card className="p-4">
            <h4 className="text-xs font-medium mb-3">{t('funnel.insights', 'Рекомендации')}</h4>
            <div className="space-y-2">
              {funnel.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    insight.type === 'warning' ? 'bg-amber-500' :
                    insight.type === 'success' ? 'bg-green-500' :
                    'bg-blue-500'
                  }`} />
                  <p className="text-muted-foreground">{insight.message}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}

interface FunnelStepCardProps {
  step: FunnelStep;
  index: number;
  isLast: boolean;
  previousCount: number;
}

function FunnelStepCard({ step, index, isLast, previousCount }: FunnelStepCardProps) {
  const { t } = useTranslation();
  
  const getStepIcon = (name: string) => {
    switch (name) {
      case 'view': return Eye;
      case 'click': return MousePointerClick;
      case 'engage': return UserCheck;
      case 'convert': return ShoppingCart;
      default: return Eye;
    }
  };

  const getStepLabel = (name: string) => {
    switch (name) {
      case 'view': return t('funnel.stepView', 'Просмотры');
      case 'click': return t('funnel.stepClick', 'Клики');
      case 'engage': return t('funnel.stepEngage', 'Вовлечение');
      case 'convert': return t('funnel.stepConvert', 'Конверсии');
      default: return name;
    }
  };

  const Icon = getStepIcon(step.name);
  const dropOffRate = index > 0 && previousCount > 0 
    ? ((previousCount - step.count) / previousCount * 100).toFixed(1)
    : null;

  // Calculate bar width based on percentage
  const barWidth = Math.max(step.percentage, 5); // Minimum 5% for visibility

  return (
    <>
      <Card className="p-3 relative overflow-hidden">
        {/* Background bar */}
        <div 
          className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500"
          style={{ width: `${barWidth}%` }}
        />
        
        {/* Content */}
        <div className="relative z-10 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{getStepLabel(step.name)}</span>
              <span className="text-xs text-muted-foreground">#{index + 1}</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{step.description}</p>
          </div>
          
          <div className="text-right shrink-0">
            <p className="text-lg font-bold">{step.count.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{step.percentage.toFixed(1)}%</p>
          </div>
        </div>
      </Card>
      
      {/* Drop-off indicator between steps */}
      {!isLast && dropOffRate && Number(dropOffRate) > 0 && (
        <div className="flex items-center justify-center py-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ArrowDown className="h-3 w-3" />
            <span className="text-destructive font-medium">-{dropOffRate}%</span>
            <span>{t('funnel.dropOff', 'отток')}</span>
          </div>
        </div>
      )}
    </>
  );
}

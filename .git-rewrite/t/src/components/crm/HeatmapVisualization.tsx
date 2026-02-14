import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  MousePointer2, 
  ArrowDown,
  Flame,
  Eye,
  TrendingDown,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useHeatmapData, ClickPoint } from '@/hooks/useHeatmapData';

export function HeatmapVisualization() {
  const { t } = useTranslation();
  const { data, loading } = useHeatmapData();

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data || (data.clicks.length === 0 && data.scrollDepths.every(s => s.count === 0))) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Flame className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="font-medium">{t('heatmap.noData', 'Недостаточно данных')}</p>
        <p className="text-sm mt-1">{t('heatmap.noDataDesc', 'Данные появятся после посещений')}</p>
      </div>
    );
  }

  const maxClickCount = Math.max(...data.clicks.map(c => c.count), 1);

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="p-3 sm:p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            {t('heatmap.title', 'Тепловая карта')}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    {t('heatmap.description', 'Визуализация кликов и глубины прокрутки')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h3>
          <Badge variant="secondary" className="text-xs">
            {data.totalSessions} {t('heatmap.sessions', 'сессий')}
          </Badge>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="p-3 text-center">
            <MousePointer2 className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{data.clicks.length}</p>
            <p className="text-xs text-muted-foreground">{t('heatmap.clickZones', 'Зон кликов')}</p>
          </Card>
          <Card className="p-3 text-center">
            <Eye className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold">{data.avgScrollDepth}%</p>
            <p className="text-xs text-muted-foreground">{t('heatmap.avgScroll', 'Ср. скролл')}</p>
          </Card>
          <Card className="p-3 text-center">
            <ArrowDown className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold">{data.maxScrollDepth}%</p>
            <p className="text-xs text-muted-foreground">{t('heatmap.maxScroll', 'Макс. скролл')}</p>
          </Card>
        </div>

        {/* Click Heatmap Preview */}
        <Card className="p-4 overflow-hidden">
          <h4 className="text-xs font-medium mb-3 flex items-center gap-2">
            <MousePointer2 className="h-4 w-4" />
            {t('heatmap.clickMap', 'Карта кликов')}
          </h4>
          
          {/* Simulated page preview with click dots */}
          <div className="relative bg-gradient-to-b from-muted/50 to-muted rounded-lg aspect-[9/16] sm:aspect-[3/4] overflow-hidden border">
            {/* Header area simulation */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-background/80 border-b flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-muted" />
            </div>
            
            {/* Content area simulation */}
            <div className="absolute top-16 left-4 right-4 space-y-2">
              <div className="h-4 bg-background/50 rounded w-3/4 mx-auto" />
              <div className="h-3 bg-background/30 rounded w-1/2 mx-auto" />
            </div>

            {/* Click points overlay */}
            {data.clicks.slice(0, 30).map((click, index) => (
              <ClickDot 
                key={index} 
                click={click} 
                maxCount={maxClickCount}
              />
            ))}

            {/* Legend */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/90 px-2 py-1 rounded text-[10px]">
              <span className="text-muted-foreground">{t('heatmap.cold', 'Холодно')}</span>
              <div className="flex">
                <div className="w-3 h-2 bg-blue-500/60 rounded-l" />
                <div className="w-3 h-2 bg-yellow-500/60" />
                <div className="w-3 h-2 bg-orange-500/60" />
                <div className="w-3 h-2 bg-red-500/80 rounded-r" />
              </div>
              <span className="text-muted-foreground">{t('heatmap.hot', 'Горячо')}</span>
            </div>
          </div>

          {/* Top click areas list */}
          {data.clicks.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground">{t('heatmap.topClickAreas', 'Топ зоны кликов:')}</p>
              <div className="space-y-1.5">
                {data.clicks.slice(0, 5).map((click, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ 
                          backgroundColor: getHeatColor(click.count / maxClickCount)
                        }}
                      />
                      <span className="text-muted-foreground">
                        {t('heatmap.position', 'Позиция')}: {Math.round(click.y)}% {t('heatmap.fromTop', 'сверху')}
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {click.count} {t('heatmap.clicks', 'клик', { count: click.count })}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Scroll Depth Chart */}
        <Card className="p-4">
          <h4 className="text-xs font-medium mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            {t('heatmap.scrollDepth', 'Глубина прокрутки')}
          </h4>
          
          <div className="space-y-2">
            {data.scrollDepths.map((item) => (
              <div key={item.depth} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.depth}%</span>
                  <span className="font-medium">{item.percentage}% {t('heatmap.reached', 'дошли')}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: getScrollColor(item.depth),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Scroll insights */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              {data.avgScrollDepth < 50 ? (
                <>
                  <span className="text-amber-500">⚠️</span> {t('heatmap.insightLowScroll', 'Пользователи не доходят до середины страницы. Переместите важный контент выше.')}
                </>
              ) : data.avgScrollDepth >= 75 ? (
                <>
                  <span className="text-green-500">✓</span> {t('heatmap.insightGoodScroll', 'Отличная вовлечённость! Пользователи просматривают большую часть контента.')}
                </>
              ) : (
                <>
                  <span className="text-blue-500">ℹ</span> {t('heatmap.insightMedScroll', 'Средняя глубина прокрутки. Рассмотрите добавление якорей или CTA.')}
                </>
              )}
            </p>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}

interface ClickDotProps {
  click: ClickPoint;
  maxCount: number;
}

function ClickDot({ click, maxCount }: ClickDotProps) {
  const intensity = click.count / maxCount;
  const size = 12 + intensity * 20; // 12-32px
  
  return (
    <div
      className="absolute rounded-full pointer-events-none animate-pulse"
      style={{
        left: `${click.x}%`,
        top: `${click.y}%`,
        width: `${size}px`,
        height: `${size}px`,
        transform: 'translate(-50%, -50%)',
        backgroundColor: getHeatColor(intensity),
        opacity: 0.6 + intensity * 0.4,
        boxShadow: `0 0 ${size/2}px ${getHeatColor(intensity)}`,
      }}
    />
  );
}

function getHeatColor(intensity: number): string {
  // Blue -> Yellow -> Orange -> Red gradient
  if (intensity < 0.25) {
    return `rgba(59, 130, 246, ${0.4 + intensity * 2})`; // Blue
  } else if (intensity < 0.5) {
    return `rgba(234, 179, 8, ${0.5 + intensity})`; // Yellow
  } else if (intensity < 0.75) {
    return `rgba(249, 115, 22, ${0.6 + intensity * 0.4})`; // Orange
  } else {
    return `rgba(239, 68, 68, ${0.7 + intensity * 0.3})`; // Red
  }
}

function getScrollColor(depth: number): string {
  // Green (100%) -> Yellow (50%) -> Red (0%)
  const progress = depth / 100;
  if (progress >= 0.7) {
    return 'hsl(var(--chart-2))'; // Green
  } else if (progress >= 0.4) {
    return 'hsl(var(--chart-3))'; // Yellow/Orange
  } else {
    return 'hsl(var(--chart-1))'; // Primary
  }
}

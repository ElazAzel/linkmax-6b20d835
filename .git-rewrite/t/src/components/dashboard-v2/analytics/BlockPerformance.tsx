/**
 * BlockPerformance - Detailed block-level analytics
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, ExternalLink, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BlockStats } from '@/hooks/usePageAnalytics';

interface BlockPerformanceProps {
  blocks: BlockStats[];
  totalViews: number;
  showChart?: boolean;
}

const blockTypeLabels: Record<string, string> = {
  link: 'Ссылка',
  social: 'Соцсети',
  button: 'Кнопка',
  booking: 'Бронирование',
  contact_form: 'Форма',
  pricing: 'Цены',
  product: 'Товар',
  gallery: 'Галерея',
  video: 'Видео',
  event: 'Событие',
  messenger: 'Мессенджер',
};

export const BlockPerformance = memo(function BlockPerformance({
  blocks,
  totalViews,
  showChart = true,
}: BlockPerformanceProps) {
  const { t } = useTranslation();

  const chartData = blocks.slice(0, 8).map(block => ({
    name: block.blockTitle.length > 12 
      ? block.blockTitle.substring(0, 12) + '...' 
      : block.blockTitle,
    clicks: block.clicks,
    ctr: block.ctr,
  }));

  const getPerformanceLevel = (ctr: number): 'high' | 'medium' | 'low' => {
    if (ctr >= 15) return 'high';
    if (ctr >= 5) return 'medium';
    return 'low';
  };

  const getPerformanceColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high': return 'text-emerald-500 bg-emerald-500/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      case 'low': return 'text-red-500 bg-red-500/10';
    }
  };

  if (!blocks.length) {
    return (
      <Card className="p-4">
        <h3 className="font-bold mb-4">{t('analytics.blocks.title', 'Эффективность блоков')}</h3>
        <p className="text-center text-muted-foreground py-4 text-sm">
          {t('analytics.blocks.noData', 'Нет данных о кликах')}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">{t('analytics.blocks.title', 'Эффективность блоков')}</h3>
        <Badge variant="outline" className="text-xs">
          <Target className="h-3 w-3 mr-1" />
          {t('analytics.blocks.avgCtr', 'Ср. CTR')}: {(blocks.reduce((sum, b) => sum + b.ctr, 0) / blocks.length).toFixed(1)}%
        </Badge>
      </div>

      {/* Chart */}
      {showChart && blocks.length > 2 && (
        <div className="h-32 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
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
                formatter={(value: number, name: string) => [
                  name === 'clicks' ? `${value} кликов` : `${value.toFixed(1)}%`,
                  name === 'clicks' ? 'Клики' : 'CTR',
                ]}
              />
              <Bar 
                dataKey="clicks" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Block list */}
      <div className="space-y-2">
        {blocks.slice(0, 5).map((block, index) => {
          const level = getPerformanceLevel(block.ctr);
          const colorClass = getPerformanceColor(level);
          
          return (
            <div 
              key={block.blockId}
              className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
            >
              <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                {index + 1}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{block.blockTitle}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    {blockTypeLabels[block.blockType] || block.blockType}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {block.clicks} {t('analytics.blocks.clicks', 'кликов')}
                  </span>
                  <Progress value={Math.min(100, block.ctr * 3)} className="h-1 w-16" />
                </div>
              </div>
              
              <div className={cn("px-2 py-1 rounded-md text-xs font-bold", colorClass)}>
                {block.ctr.toFixed(1)}%
              </div>
            </div>
          );
        })}
      </div>

      {blocks.length > 5 && (
        <div className="mt-3 text-center">
          <span className="text-xs text-muted-foreground">
            {t('analytics.blocks.andMore', 'и ещё {{count}} блоков', { count: blocks.length - 5 })}
          </span>
        </div>
      )}
    </Card>
  );
});

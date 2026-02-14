/**
 * AnalyticsTab - Analytics with AI insights and Apply actions
 * Mobile-optimized with swipeable periods and card-based metrics
 */
import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageAnalytics } from '@/hooks/usePageAnalytics';
import {
  Eye,
  MousePointerClick,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Smartphone,
  Monitor,
  Globe,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Block } from '@/types/page';
import type { EditorHistoryType } from '@/hooks/useEditorHistory';

interface AnalyticsTabProps {
  pageId: string;
  blocks: Block[];
  isPremium: boolean;
  editorHistory: EditorHistoryType;
  onApplyInsight: (action: { type: string; blockId?: string; data?: any }) => void;
}

type Period = '7d' | '14d' | '30d';

export const AnalyticsTab = memo(function AnalyticsTab({
  pageId,
  blocks,
  isPremium,
  editorHistory,
  onApplyInsight,
}: AnalyticsTabProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('7d');
  const { analytics, loading, setPeriod: setAnalyticsPeriod } = usePageAnalytics();

  // Map UI period to analytics period
  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    // Map to usePageAnalytics period type
    if (p === '7d') setAnalyticsPeriod('week');
    else if (p === '14d') setAnalyticsPeriod('two_weeks');
    else if (p === '30d') setAnalyticsPeriod('month');
  };

  // Use real analytics data with fallbacks
  const stats = {
    views: analytics?.totalViews ?? 0,
    viewsChange: analytics?.viewsChange ?? 0,
    clicks: analytics?.totalClicks ?? 0,
    clicksChange: analytics?.clicksChange ?? 0,
    uniqueVisitors: analytics?.uniqueVisitors ?? 0,
    visitorsChange: analytics?.viewsChange ?? 0, // Use views change as proxy
    topBlocks: analytics?.topBlocks?.slice(0, 3).map((block, index) => ({
      id: block.blockId,
      type: block.blockType,
      title: block.blockTitle || block.blockType,
      clicks: block.clicks,
      percentage: analytics.totalClicks > 0 ? Math.round((block.clicks / analytics.totalClicks) * 100) : 0,
    })) ?? [],
    devices: {
      mobile: analytics?.deviceBreakdown?.mobile ?? 0,
      desktop: analytics?.deviceBreakdown?.desktop ?? 0,
      tablet: analytics?.deviceBreakdown?.tablet ?? 0,
    },
    sources: analytics?.trafficSources?.slice(0, 3).map(s => ({
      name: s.source === 'direct' ? 'Direct' : s.source,
      percentage: Math.round(s.percentage),
    })) ?? [],
  };

  // Calculate device percentages
  const totalDevices = stats.devices.mobile + stats.devices.desktop + stats.devices.tablet;
  const devicePercentages = totalDevices > 0 ? {
    mobile: Math.round((stats.devices.mobile / totalDevices) * 100),
    desktop: Math.round((stats.devices.desktop / totalDevices) * 100),
    tablet: Math.round((stats.devices.tablet / totalDevices) * 100),
  } : { mobile: 0, desktop: 0, tablet: 0 };

  // AI Insights
  const insights = useMemo(() => {
    const hasPricing = blocks.some(b => b.type === 'pricing');
    const hasForm = blocks.some(b => b.type === 'form');
    const hasTestimonials = blocks.some(b => b.type === 'testimonial');

    const suggestions = [];
    
    if (!hasPricing && blocks.length > 3) {
      suggestions.push({
        id: 'add-pricing',
        type: 'add',
        title: t('analytics.insights.addPricing', 'Добавьте блок с ценами'),
        description: t('analytics.insights.addPricingDesc', 'Страницы с прайсом получают на 40% больше заявок'),
        action: () => onApplyInsight({ type: 'add', data: { blockType: 'pricing' } }),
        impact: 'high',
      });
    }

    if (!hasTestimonials && blocks.length > 5) {
      suggestions.push({
        id: 'add-testimonials',
        type: 'add',
        title: t('analytics.insights.addTestimonials', 'Добавьте отзывы'),
        description: t('analytics.insights.addTestimonialsDesc', 'Отзывы увеличивают доверие и конверсию на 25%'),
        action: () => onApplyInsight({ type: 'add', data: { blockType: 'testimonial' } }),
        impact: 'medium',
      });
    }

    // Insight based on real analytics
    if (stats.topBlocks[0]?.percentage > 40) {
      suggestions.push({
        id: 'duplicate-top',
        type: 'optimize',
        title: t('analytics.insights.duplicateTop', 'Продублируйте популярную ссылку'),
        description: t('analytics.insights.duplicateTopDesc', `"${stats.topBlocks[0].title}" получает ${stats.topBlocks[0].percentage}% кликов`),
        action: () => onApplyInsight({ type: 'duplicate', blockId: stats.topBlocks[0].id }),
        impact: 'medium',
      });
    }

    return suggestions;
  }, [blocks, onApplyInsight, stats.topBlocks, t]);

  const renderTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const renderTrendBadge = (change: number) => {
    const isPositive = change > 0;
    const displayChange = Math.abs(change) > 100 ? '>100' : Math.round(change);
    return (
      <Badge 
        variant="outline" 
        className={cn(
          "font-bold",
          isPositive ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : 
          change < 0 ? "bg-red-500/15 text-red-600 border-red-500/30" :
          "bg-muted text-muted-foreground"
        )}
      >
        {isPositive && '+'}{displayChange}%
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center safe-area-top">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen safe-area-top pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-nav px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black">{t('analytics.title', 'Аналитика')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('analytics.subtitle', 'Статистика страницы')}
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(['7d', '14d', '30d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
                period === p
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-muted/50 text-muted-foreground"
              )}
            >
              {t(`analytics.period.${p}`, p === '7d' ? '7 дней' : p === '14d' ? '14 дней' : '30 дней')}
            </button>
          ))}
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Main Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              {renderTrendIcon(stats.viewsChange)}
            </div>
            <div className="text-3xl font-black mb-1">{stats.views.toLocaleString()}</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('analytics.views', 'Просмотры')}</span>
              {renderTrendBadge(stats.viewsChange)}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <MousePointerClick className="h-5 w-5 text-emerald-500" />
              </div>
              {renderTrendIcon(stats.clicksChange)}
            </div>
            <div className="text-3xl font-black mb-1">{stats.clicks.toLocaleString()}</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('analytics.clicks', 'Клики')}</span>
              {renderTrendBadge(stats.clicksChange)}
            </div>
          </Card>

          <Card className="p-5 col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/15 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-500" />
              </div>
              {renderTrendIcon(stats.visitorsChange)}
            </div>
            <div className="text-3xl font-black mb-1">{stats.uniqueVisitors.toLocaleString()}</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('analytics.uniqueVisitors', 'Уникальные посетители')}</span>
              {renderTrendBadge(stats.visitorsChange)}
            </div>
          </Card>
        </div>

        {/* AI Insights Section */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="font-bold">{t('analytics.aiInsights', 'AI Рекомендации')}</h2>
            </div>
            
            {insights.map((insight) => (
              <Card 
                key={insight.id}
                className={cn(
                  "p-5 border-l-4",
                  insight.impact === 'high' ? "border-l-emerald-500 bg-emerald-500/5" :
                  insight.impact === 'medium' ? "border-l-amber-500 bg-amber-500/5" :
                  "border-l-blue-500 bg-blue-500/5"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                    insight.impact === 'high' ? "bg-emerald-500/20" :
                    insight.impact === 'medium' ? "bg-amber-500/20" :
                    "bg-blue-500/20"
                  )}>
                    <Sparkles className={cn(
                      "h-5 w-5",
                      insight.impact === 'high' ? "text-emerald-600" :
                      insight.impact === 'medium' ? "text-amber-600" :
                      "text-blue-600"
                    )} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold mb-1">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    <Button 
                      size="sm" 
                      className="h-9 rounded-xl"
                      onClick={insight.action}
                    >
                      {t('analytics.apply', 'Применить')}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Top Blocks */}
        <div className="space-y-3">
          <h2 className="font-bold px-1">{t('analytics.topBlocks', 'Популярные блоки')}</h2>
          <Card className="divide-y divide-border/50">
            {stats.topBlocks.length > 0 ? stats.topBlocks.map((block, index) => (
              <div key={block.id} className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center font-bold text-muted-foreground">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{block.title}</div>
                  <div className="text-sm text-muted-foreground">{block.clicks} {t('analytics.clicks', 'кликов')}</div>
                </div>
                <div className="w-20">
                  <Progress value={block.percentage} className="h-2" />
                  <div className="text-xs text-right text-muted-foreground mt-1">{block.percentage}%</div>
                </div>
              </div>
            )) : (
              <div className="p-4 text-center text-muted-foreground">
                {t('analytics.noData', 'Нет данных за выбранный период')}
              </div>
            )}
          </Card>
        </div>

        {/* Devices */}
        <div className="space-y-3">
          <h2 className="font-bold px-1">{t('analytics.devices', 'Устройства')}</h2>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <Smartphone className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-black">{devicePercentages.mobile}%</div>
              <div className="text-xs text-muted-foreground">{t('analytics.mobile', 'Телефон')}</div>
            </Card>
            <Card className="p-4 text-center">
              <Monitor className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
              <div className="text-2xl font-black">{devicePercentages.desktop}%</div>
              <div className="text-xs text-muted-foreground">{t('analytics.desktop', 'Компьютер')}</div>
            </Card>
            <Card className="p-4 text-center">
              <Globe className="h-6 w-6 mx-auto mb-2 text-violet-500" />
              <div className="text-2xl font-black">{devicePercentages.tablet}%</div>
              <div className="text-xs text-muted-foreground">{t('analytics.tablet', 'Планшет')}</div>
            </Card>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="space-y-3">
          <h2 className="font-bold px-1">{t('analytics.sources', 'Источники трафика')}</h2>
          <Card className="p-4 space-y-3">
            {stats.sources.length > 0 ? stats.sources.map((source) => (
              <div key={source.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{source.name}</span>
                  <span className="text-sm text-muted-foreground">{source.percentage}%</span>
                </div>
                <Progress value={source.percentage} className="h-2" />
              </div>
            )) : (
              <div className="text-center text-muted-foreground">
                {t('analytics.noData', 'Нет данных за выбранный период')}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
});

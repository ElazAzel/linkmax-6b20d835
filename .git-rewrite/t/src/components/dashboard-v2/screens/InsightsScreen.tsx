/**
 * InsightsScreen - Analytics dashboard with AI recommendations
 */
import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageAnalytics } from '@/hooks/usePageAnalytics';
import {
  Eye,
  MousePointerClick,
  Users,
  Sparkles,
  ArrowRight,
  Smartphone,
  Monitor,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DashboardHeader } from '../layout/DashboardHeader';
import { StatCard } from '../common/StatCard';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { cn } from '@/lib/utils';
import type { Block } from '@/types/page';

interface InsightsScreenProps {
  pageId: string;
  blocks: Block[];
  isPremium: boolean;
  onApplyInsight: (action: { type: string; blockId?: string; data?: Record<string, unknown> }) => void;
}

type Period = '7d' | '14d' | '30d';

export const InsightsScreen = memo(function InsightsScreen({
  pageId,
  blocks,
  isPremium,
  onApplyInsight,
}: InsightsScreenProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('7d');
  const { analytics, loading, setPeriod: setAnalyticsPeriod } = usePageAnalytics();

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
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
    visitorsChange: analytics?.viewsChange ?? 0,
    topBlocks:
      analytics?.topBlocks?.slice(0, 3).map((block) => ({
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
    sources:
      analytics?.trafficSources?.slice(0, 3).map((s) => ({
        name: s.source === 'direct' ? 'Direct' : s.source,
        percentage: Math.round(s.percentage),
      })) ?? [],
  };

  // Calculate device percentages
  const totalDevices = stats.devices.mobile + stats.devices.desktop + stats.devices.tablet;
  const devicePercentages =
    totalDevices > 0
      ? {
          mobile: Math.round((stats.devices.mobile / totalDevices) * 100),
          desktop: Math.round((stats.devices.desktop / totalDevices) * 100),
          tablet: Math.round((stats.devices.tablet / totalDevices) * 100),
        }
      : { mobile: 0, desktop: 0, tablet: 0 };

  // AI Insights
  const insights = useMemo(() => {
    const hasPricing = blocks.some((b) => b.type === 'pricing');
    const hasTestimonials = blocks.some((b) => b.type === 'testimonial');

    const suggestions = [];

    if (!hasPricing && blocks.length > 3) {
      suggestions.push({
        id: 'add-pricing',
        type: 'add',
        title: t('dashboard.insights.addPricing', 'Добавьте блок с ценами'),
        description: t('dashboard.insights.addPricingDesc', 'Страницы с прайсом получают на 40% больше заявок'),
        action: () => onApplyInsight({ type: 'add', data: { blockType: 'pricing' } }),
        impact: 'high' as const,
      });
    }

    if (!hasTestimonials && blocks.length > 5) {
      suggestions.push({
        id: 'add-testimonials',
        type: 'add',
        title: t('dashboard.insights.addTestimonials', 'Добавьте отзывы'),
        description: t('dashboard.insights.addTestimonialsDesc', 'Отзывы увеличивают доверие и конверсию на 25%'),
        action: () => onApplyInsight({ type: 'add', data: { blockType: 'testimonial' } }),
        impact: 'medium' as const,
      });
    }

    if (stats.topBlocks[0]?.percentage > 40) {
      suggestions.push({
        id: 'duplicate-top',
        type: 'optimize',
        title: t('dashboard.insights.duplicateTop', 'Продублируйте популярную ссылку'),
        description: t(
          'dashboard.insights.duplicateTopDesc',
          `"${stats.topBlocks[0].title}" получает ${stats.topBlocks[0].percentage}% кликов`
        ),
        action: () => onApplyInsight({ type: 'duplicate', blockId: stats.topBlocks[0].id }),
        impact: 'medium' as const,
      });
    }

    return suggestions;
  }, [blocks, onApplyInsight, stats.topBlocks, t]);

  if (loading) {
    return (
      <div className="min-h-screen safe-area-top">
        <DashboardHeader title={t('dashboard.insights.title', 'Аналитика')} />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="stats" />
        </div>
      </div>
    );
  }

  const hasData = stats.views > 0 || stats.clicks > 0;

  return (
    <div className="min-h-screen safe-area-top">
      <DashboardHeader
        title={t('dashboard.insights.title', 'Аналитика')}
        subtitle={t('dashboard.insights.subtitle', 'Статистика страницы')}
      />

      {/* Period Selector */}
      <div className="px-5 pb-4">
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
              {t(`dashboard.insights.period.${p}`, p === '7d' ? '7 дней' : p === '14d' ? '14 дней' : '30 дней')}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 pb-24 space-y-6">
        {!hasData ? (
          <EmptyState
            icon={Eye}
            title={t('dashboard.insights.noData', 'Нет данных')}
            description={t('dashboard.insights.noDataDesc', 'Опубликуйте страницу, чтобы начать собирать статистику')}
          />
        ) : (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={Eye}
                iconBg="bg-blue-500/15"
                iconColor="text-blue-500"
                value={stats.views}
                label={t('dashboard.insights.views', 'Просмотры')}
                change={stats.viewsChange}
              />
              <StatCard
                icon={MousePointerClick}
                iconBg="bg-emerald-500/15"
                iconColor="text-emerald-500"
                value={stats.clicks}
                label={t('dashboard.insights.clicks', 'Клики')}
                change={stats.clicksChange}
              />
            </div>

            <StatCard
              icon={Users}
              iconBg="bg-violet-500/15"
              iconColor="text-violet-500"
              value={stats.uniqueVisitors}
              label={t('dashboard.insights.uniqueVisitors', 'Уникальные посетители')}
              change={stats.visitorsChange}
              className="col-span-2"
            />

            {/* AI Insights */}
            {insights.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h2 className="font-bold">{t('dashboard.insights.aiInsights', 'AI Рекомендации')}</h2>
                </div>

                {insights.map((insight) => (
                  <Card
                    key={insight.id}
                    className={cn(
                      "p-5 border-l-4",
                      insight.impact === 'high'
                        ? "border-l-emerald-500 bg-emerald-500/5"
                        : insight.impact === 'medium'
                        ? "border-l-amber-500 bg-amber-500/5"
                        : "border-l-blue-500 bg-blue-500/5"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                          insight.impact === 'high'
                            ? "bg-emerald-500/20"
                            : insight.impact === 'medium'
                            ? "bg-amber-500/20"
                            : "bg-blue-500/20"
                        )}
                      >
                        <Sparkles
                          className={cn(
                            "h-5 w-5",
                            insight.impact === 'high'
                              ? "text-emerald-600"
                              : insight.impact === 'medium'
                              ? "text-amber-600"
                              : "text-blue-600"
                          )}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold mb-1">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                        <Button size="sm" className="h-9 rounded-xl" onClick={insight.action}>
                          {t('dashboard.insights.apply', 'Применить')}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Top Blocks */}
            {stats.topBlocks.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-bold px-1">{t('dashboard.insights.topBlocks', 'Популярные блоки')}</h2>
                <Card className="divide-y divide-border/50">
                  {stats.topBlocks.map((block, index) => (
                    <div key={block.id} className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center font-bold text-muted-foreground">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{block.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {block.clicks} {t('dashboard.insights.clicksCount', 'кликов')}
                        </div>
                      </div>
                      <div className="w-20">
                        <Progress value={block.percentage} className="h-2" />
                        <div className="text-xs text-right text-muted-foreground mt-1">{block.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            )}

            {/* Devices */}
            <div className="space-y-3">
              <h2 className="font-bold px-1">{t('dashboard.insights.devices', 'Устройства')}</h2>
              <div className="grid grid-cols-3 gap-3">
                <Card className="p-4 text-center">
                  <Smartphone className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-black">{devicePercentages.mobile}%</div>
                  <div className="text-xs text-muted-foreground">{t('dashboard.insights.mobile', 'Телефон')}</div>
                </Card>
                <Card className="p-4 text-center">
                  <Monitor className="h-6 w-6 mx-auto mb-2 text-emerald-500" />
                  <div className="text-2xl font-black">{devicePercentages.desktop}%</div>
                  <div className="text-xs text-muted-foreground">{t('dashboard.insights.desktop', 'Компьютер')}</div>
                </Card>
                <Card className="p-4 text-center">
                  <Globe className="h-6 w-6 mx-auto mb-2 text-violet-500" />
                  <div className="text-2xl font-black">{devicePercentages.tablet}%</div>
                  <div className="text-xs text-muted-foreground">{t('dashboard.insights.tablet', 'Планшет')}</div>
                </Card>
              </div>
            </div>

            {/* Traffic Sources */}
            {stats.sources.length > 0 && (
              <div className="space-y-3">
                <h2 className="font-bold px-1">{t('dashboard.insights.sources', 'Источники трафика')}</h2>
                <Card className="p-4 space-y-3">
                  {stats.sources.map((source) => (
                    <div key={source.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{source.name}</span>
                        <span className="text-sm text-muted-foreground">{source.percentage}%</span>
                      </div>
                      <Progress value={source.percentage} className="h-2" />
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

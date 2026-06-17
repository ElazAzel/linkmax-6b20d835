/**
 * InsightsScreen - Comprehensive analytics dashboard with charts and AI recommendations
 */
import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageAnalytics } from '@/hooks/analytics/usePageAnalytics';
import Eye from 'lucide-react/dist/esm/icons/eye';
import MousePointerClick from 'lucide-react/dist/esm/icons/mouse-pointer-click';
import Users from 'lucide-react/dist/esm/icons/users';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Monitor from 'lucide-react/dist/esm/icons/monitor';
import Globe from 'lucide-react/dist/esm/icons/globe';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import ChartBar from 'lucide-react/dist/esm/icons/chart-bar';
import Target from 'lucide-react/dist/esm/icons/target';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import FlaskConical from 'lucide-react/dist/esm/icons/flask-conical';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardHeader } from '../layout/DashboardHeader';
import { StatCard } from '../common/StatCard';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import { SmartEmptyState } from '@/components/ui/smart-empty-state';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Edit3 from 'lucide-react/dist/esm/icons/edit-3';
import { ErrorState } from '../common/ErrorState';
import {
  AnalyticsChart,
  ConversionFunnel,
  EngagementMetrics,
  GeographyChart,
  TrafficSourcesChart,
  BlockPerformance,
  AnalyticsExport,
  ExperimentsList,
  ChatbotInsights,
} from '../analytics';
import { cn } from '@/lib/utils/utils';
import type { Block } from '@/types/page';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useInsights } from '@/hooks/analytics/useInsights';


interface InsightsScreenProps {
  pageId: string;
  slug: string;
  blocks: Block[];
  isPremium: boolean;
  onApplyInsight: (action: { type: string; blockId?: string; data?: Record<string, unknown> }) => void;
}

type Period = '7d' | '30d' | '90d' | 'all';
type Tab = 'overview' | 'traffic' | 'blocks' | 'funnel' | 'experiments';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export const InsightsScreen = memo(function InsightsScreen({
  pageId,
  slug,
  blocks,
  isPremium,
  onApplyInsight,
}: InsightsScreenProps) {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>('7d');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { analytics, loading, error, setPeriod: setAnalyticsPeriod, refresh, isStaffMember, staffMemberName } = usePageAnalytics(
    pageId || null,
    '7d',
  );

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    setAnalyticsPeriod(p);
  };

  // Use real analytics data with fallbacks
  const stats = useMemo(() => ({
    views: analytics?.totalViews ?? 0,
    viewsChange: analytics?.viewsChange ?? 0,
    clicks: analytics?.totalClicks ?? 0,
    clicksChange: analytics?.clicksChange ?? 0,
    shares: analytics?.totalShares ?? 0,
    uniqueVisitors: analytics?.uniqueVisitors ?? 0,
    visitorsChange: analytics?.viewsChange ?? 0,
    avgViewsPerDay: analytics?.avgViewsPerDay ?? 0,
    ctr: analytics && analytics.totalViews > 0
      ? ((analytics.totalClicks / analytics.totalViews) * 100)
      : 0,
    topBlocks: analytics?.topBlocks ?? [],
    devices: {
      mobile: analytics?.deviceBreakdown?.mobile ?? 0,
      desktop: analytics?.deviceBreakdown?.desktop ?? 0,
      tablet: analytics?.deviceBreakdown?.tablet ?? 0,
    },
    sources: analytics?.trafficSources ?? [],
    dailyData: analytics?.dailyData ?? [],
    geoData: analytics?.geoData ?? [],
    avgSessionDuration: analytics?.avgSessionDuration ?? 0,
    bounceRate: analytics?.bounceRate ?? 0,
    returningVisitors: analytics?.returningVisitors ?? 0,
    conversions: analytics?.totalConversions ?? 0,
  }), [analytics]);

  // Calculate device percentages
  const totalDevices = stats.devices.mobile + stats.devices.desktop + stats.devices.tablet;
  const devicePercentages = useMemo(() =>
    totalDevices > 0
      ? {
        mobile: Math.round((stats.devices.mobile / totalDevices) * 100),
        desktop: Math.round((stats.devices.desktop / totalDevices) * 100),
        tablet: Math.round((stats.devices.tablet / totalDevices) * 100),
      }
      : { mobile: 0, desktop: 0, tablet: 0 },
    [totalDevices, stats.devices]
  );

  // AI Insights (algorithmic heuristics)
  const insights = useInsights(
    {
      blocks,
      stats: {
        ctr: stats.ctr,
        views: stats.views,
        bounceRate: stats.bounceRate,
        conversions: stats.conversions,
        topBlocks: stats.topBlocks,
      },
      devicePercentages,
    },
    onApplyInsight,
  );


  if (loading || !pageId) {
    return (
      <div className="min-h-screen safe-area-top">
        <DashboardHeader 
          title={t('dashboard.insights.title', 'Аналитика')} 
          onMenuClick={() => {}} 
        />
        <div className="px-5 py-6">
          <LoadingSkeleton variant="stats" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen safe-area-top">
        <DashboardHeader
          title={t('dashboard.insights.title', 'Аналитика')}
          onMenuClick={() => {}}
        />
        <div className="px-[var(--space-page-px)] py-8">
          <ErrorState
            description={error}
            onRetry={() => void refresh()}
          />
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
        onMenuClick={() => {}}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={refresh} className="h-10 w-10 glass border-white/20 rounded-xl hover:bg-white/10 active:scale-95 transition-all">
              <RefreshCw className="h-4 w-4" />
            </Button>
            {isPremium && <AnalyticsExport analytics={analytics} period={period} />}
          </div>
        }
      />

      {/* Period Selector */}
      <div className="px-[var(--space-page-px)] pb-5">
        <div className="flex gap-2 p-1.5 glass-subtle rounded-[1.5rem] border-white/10 shadow-inner">
          {(['7d', '30d', '90d', 'all'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-[0.15em] transition-smooth",
                period === p
                  ? "bg-white text-primary shadow-glass-lg scale-[1.02]"
                  : "text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/5"
              )}
            >
              {t(
                `dashboard.insights.period.${p}`,
                p === '7d' ? '7 дней' : p === '30d' ? '30 дней' : p === '90d' ? '90 дней' : 'Всё время'
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-[var(--space-page-px)] pb-24 space-y-7">
        {!hasData ? (
          <SmartEmptyState
            icon={Eye}
            eyebrow={t('dashboard.insights.emptyEyebrow', 'Аналитика появится после первых визитов')}
            title={t('dashboard.insights.noData', 'Пока нет данных')}
            description={t('dashboard.insights.noDataDesc', 'Поделитесь ссылкой на страницу — каждый просмотр, клик и заявка будут отслеживаться в реальном времени.')}
            checklist={[
              {
                label: t('dashboard.insights.checklist.publish', 'Страница опубликована'),
                done: true,
              },
              {
                label: t('dashboard.insights.checklist.share', 'Поделитесь ссылкой'),
                hint: t('dashboard.insights.checklist.shareHint', 'Instagram bio, WhatsApp статус, визитка'),
              },
              {
                label: t('dashboard.insights.checklist.wait', 'Дождитесь первых посетителей'),
                hint: t('dashboard.insights.checklist.waitHint', 'Обычно первые данные появляются в течение часа'),
              },
            ]}
            primaryCta={{
              label: t('dashboard.insights.copyLink', 'Скопировать ссылку'),
              onClick: () => {
                const url = window.location.origin + '/' + slug;
                navigator.clipboard.writeText(url);
                toast.success(t('common.copied', 'Ссылка скопирована'));
              },
              icon: Share2,
            }}
            secondaryCta={{
              label: t('dashboard.insights.editPage', 'Редактировать'),
              onClick: () => window.open('/dashboard?tab=editor', '_self'),
              icon: Edit3,
            }}
            footer={t('dashboard.insights.emptyFooter', '📊 Мы фиксируем просмотры, клики, источники, гео и устройства')}
          />
        ) : (
          <>
            {/* Tab Navigation */}
            <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as Tab)} className="w-full">
              {/* Mobile: Select dropdown */}
              <div className="md:hidden">
                <Select value={activeTab} onValueChange={(v: string) => setActiveTab(v as Tab)}>
                  <SelectTrigger className="h-12 w-full rounded-2xl bg-white/5 border-white/10" aria-label={t('analytics.tabs.label', 'Раздел аналитики')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview"><ChartBar className="h-4 w-4 inline mr-2" />{t('analytics.tabs.overview', 'Обзор')}</SelectItem>
                    <SelectItem value="traffic"><Globe className="h-4 w-4 inline mr-2" />{t('analytics.tabs.traffic', 'Трафик')}</SelectItem>
                    <SelectItem value="blocks"><Target className="h-4 w-4 inline mr-2" />{t('analytics.tabs.blocks', 'Блоки')}</SelectItem>
                    <SelectItem value="funnel"><TrendingUp className="h-4 w-4 inline mr-2" />{t('analytics.tabs.funnel', 'Воронка')}</SelectItem>
                    {isPremium && (
                      <SelectItem value="experiments"><FlaskConical className="h-4 w-4 inline mr-2" />{t('analytics.tabs.experiments', 'Тесты')}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Desktop: TabsList */}
              <TabsList className="hidden md:flex w-full h-12 bg-white/5 border border-white/10 rounded-[1.5rem] p-1 items-center gap-1 shadow-inner glass-subtle">
                <TabsTrigger value="overview" className="flex-1 h-10 text-xs font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-glass transition-smooth">
                  <ChartBar className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <span>{t('analytics.tabs.overview', 'Обзор')}</span>
                </TabsTrigger>
                <TabsTrigger value="traffic" className="flex-1 h-10 text-xs font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-glass transition-smooth">
                  <Globe className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <span>{t('analytics.tabs.traffic', 'Трафик')}</span>
                </TabsTrigger>
                <TabsTrigger value="blocks" className="flex-1 h-10 text-xs font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-glass transition-smooth">
                  <Target className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <span>{t('analytics.tabs.blocks', 'Блоки')}</span>
                </TabsTrigger>
                <TabsTrigger value="funnel" className="flex-1 h-10 text-xs font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-glass transition-smooth">
                  <TrendingUp className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                  <span>{t('analytics.tabs.funnel', 'Воронка')}</span>
                </TabsTrigger>
                {isPremium && (
                  <TabsTrigger value="experiments" className="flex-1 h-10 text-xs font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-glass transition-smooth">
                    <FlaskConical className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                    <span>{t('analytics.tabs.experiments', 'Тесты')}</span>
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-6">
                <motion.div
                  className="space-y-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {/* Staff Performance Header for Specialists */}
                  {isStaffMember && analytics?.personalStaffStats && (
                    <motion.div variants={itemVariants} className="px-1">
                      <div className="p-5 rounded-[2rem] bg-gradient-to-br from-primary/10 to-violet-500/5 border border-primary/20 shadow-glass-lg relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-[50px] rounded-full group-hover:bg-primary/20 transition-all duration-700" />
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="h-14 w-14 rounded-2xl bg-white/50 backdrop-blur-xl flex items-center justify-center shadow-glass border border-white/20">
                            <Sparkles className="h-7 w-7 text-primary animate-pulse" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-primary/70 mb-1">
                              {t('analytics.staff.yourStats', 'Ваш результат')}
                            </h3>
                            <p className="text-xl font-black text-gradient">
                              {staffMemberName}, {t('analytics.staff.keepItUp', 'так держать!')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground opacity-60">
                              {t('analytics.staff.bookings', 'Записей')}
                            </p>
                            <p className="text-2xl font-black tabular-nums">{analytics.personalStaffStats.bookings}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground opacity-60">
                              {t('analytics.staff.revenue', 'Прибыль')}
                            </p>
                            <p className="text-2xl font-black tabular-nums">
                              {analytics.personalStaffStats.revenue.toLocaleString()} ₸
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div variants={itemVariants}>
                      <StatCard
                        icon={Eye}
                        value={stats.views}
                        label={t('dashboard.insights.views', 'Просмотры')}
                        variant="glass"
                      />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <StatCard
                        icon={MousePointerClick}
                        value={stats.clicks}
                        label={t('dashboard.insights.clicks', 'Клики')}
                        variant="glass"
                      />
                    </motion.div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.div variants={itemVariants}>
                      <StatCard
                        icon={Users}
                        value={stats.uniqueVisitors}
                        label={t('dashboard.insights.uniqueVisitors', 'Уникальные')}
                        variant="glass"
                      />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <StatCard
                        icon={Target}
                        value={`${stats.ctr.toFixed(1)}%`}
                        label={t('dashboard.insights.ctr', 'CTR')}
                        variant="glass"
                      />
                    </motion.div>
                  </div>

                  <motion.div variants={itemVariants}>
                    <Card className="p-4 border-border/40">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold">
                          {t('analytics.dataQuality.title', 'Качество данных')}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {t('analytics.dataQuality.subtitle', 'Заполненность метаданных')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { key: 'visitor', label: t('analytics.dataQuality.visitor', 'Visitor ID'), value: analytics?.dataQuality.visitorCoverage ?? 0 },
                          { key: 'session', label: t('analytics.dataQuality.session', 'Session ID'), value: analytics?.dataQuality.sessionCoverage ?? 0 },
                          { key: 'device', label: t('analytics.dataQuality.device', 'Device'), value: analytics?.dataQuality.deviceCoverage ?? 0 },
                          { key: 'source', label: t('analytics.dataQuality.source', 'Source'), value: analytics?.dataQuality.sourceCoverage ?? 0 },
                        ].map(item => (
                          <div key={item.key} className="rounded-lg bg-muted/30 p-3">
                            <p className="text-xs text-muted-foreground">{item.label}</p>
                            <p className="text-lg font-bold">{Math.round(item.value)}%</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>

                  {/* Chart */}
                  {stats.dailyData.length > 0 && (
                    <motion.div variants={itemVariants} className="glass border-white/20 shadow-glass-lg rounded-[2.5rem] overflow-hidden p-4">
                      <AnalyticsChart
                        data={stats.dailyData}
                        title={t('analytics.chart.title', 'Динамика за период')}
                        showClicks={true}
                      />
                    </motion.div>
                  )}

                  {/* Chatbot Insights (Phase 26) */}
                  <motion.div variants={itemVariants}>
                    <ChatbotInsights pageId={pageId} />
                  </motion.div>

                  {/* AI Insights */}
                  {insights.length > 0 && (
                    <motion.div variants={itemVariants} className="space-y-4 pt-2">
                      <div className="flex items-center gap-3 px-1">
                        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] opacity-60">{t('dashboard.insights.aiInsights', 'Рекомендации')}</h2>
                      </div>

                      <div className="space-y-3">
                        {insights.map((insight, i) => (
                          <motion.div key={insight.id} variants={itemVariants} custom={i}>
                            <Card
                              className={cn(
                                "p-6 border-white/20 glass transition-smooth hover:scale-[1.02] shadow-glass rounded-[2rem]",
                                insight.impact === 'high'
                                  ? "shadow-emerald-500/10 group/insight"
                                  : insight.impact === 'medium'
                                    ? "shadow-amber-500/10 group/insight"
                                    : "shadow-blue-500/10 group/insight"
                              )}
                            >
                              <div className="flex items-start gap-5">
                                <div
                                  className={cn(
                                    "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                                    insight.impact === 'high'
                                      ? "bg-emerald-500/10"
                                      : insight.impact === 'medium'
                                        ? "bg-amber-500/10"
                                        : "bg-blue-500/10"
                                  )}
                                >
                                  <Sparkles
                                    className={cn(
                                      "h-5 w-5",
                                      insight.impact === 'high'
                                        ? "text-emerald-500"
                                        : insight.impact === 'medium'
                                          ? "text-amber-500"
                                          : "text-blue-500"
                                    )}
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <h3 className="font-black text-sm mb-1 tracking-tight">{insight.title}</h3>
                                  <p className="text-xs text-muted-foreground/80 mb-4 leading-relaxed">{insight.description}</p>
                                  {insight.action && (
                                    <Button size="sm" variant="secondary" className="h-10 px-5 text-xs font-bold rounded-xl glass hover:bg-white/10 border-white/10" onClick={insight.action}>
                                      {t('dashboard.insights.apply', 'Применить')}
                                      <ArrowRight className="h-3.5 w-3.5 ml-2 transition-transform group-hover/insight:translate-x-1" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Owner: Staff Breakdown */}
                  {!isStaffMember && analytics?.staffStats && analytics.staffStats.length > 0 && (
                    <motion.div variants={itemVariants} className="space-y-4 pt-2">
                       <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <h2 className="text-sm font-black uppercase tracking-[0.2em] opacity-60">
                            {t('analytics.staff.teamBreakdown', 'Разбор по команде')}
                          </h2>
                        </div>
                      </div>

                      <Card className="glass border-white/20 shadow-glass rounded-[2rem] overflow-hidden">
                        <div className="divide-y divide-white/5">
                          {analytics.staffStats.map((staff, i) => (
                            <div key={staff.staffId} className="p-5 flex items-center gap-4 hover:bg-white/5 transition-colors group/staff">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary border border-primary/20 shrink-0">
                                {staff.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="font-black text-sm truncate">{staff.name}</span>
                                  <span className="text-xs font-black text-primary">{staff.revenue.toLocaleString()} ₸</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                     <motion.div 
                                       initial={{ width: 0 }}
                                       animate={{ width: `${Math.min(100, (staff.bookings / (analytics.totalConversions || 1)) * 100)}%` }}
                                       className="h-full bg-primary"
                                     />
                                  </div>
                                  <span className="text-[10px] font-black opacity-40 shrink-0">
                                    {staff.bookings} {t('analytics.staff.units', 'записей')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {/* Devices */}
                  <motion.div variants={itemVariants} className="space-y-4 pt-2">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] px-1 opacity-60">{t('dashboard.insights.devices', 'Устройства')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Card className="p-5 sm:p-4 flex sm:flex-col items-center gap-4 sm:gap-2 text-center glass border-white/10 shadow-glass rounded-3xl group/device hover:bg-white/5 transition-colors">
                        <Smartphone className="h-6 w-6 sm:h-5 sm:w-5 text-blue-500 group-hover/device:scale-110 transition-transform" />
                        <div className="flex-1 sm:flex-none text-left sm:text-center">
                          <div className="text-2xl font-black text-gradient tabular-nums">{devicePercentages.mobile}%</div>
                          <div className="text-xs uppercase font-black tracking-widest text-muted-foreground opacity-50">{t('dashboard.insights.mobile', 'Телефон')}</div>
                        </div>
                      </Card>
                      <Card className="p-5 sm:p-4 flex sm:flex-col items-center gap-4 sm:gap-2 text-center glass border-white/10 shadow-glass rounded-3xl group/device hover:bg-white/5 transition-colors">
                        <Monitor className="h-6 w-6 sm:h-5 sm:w-5 text-emerald-500 group-hover/device:scale-110 transition-transform" />
                        <div className="flex-1 sm:flex-none text-left sm:text-center">
                          <div className="text-2xl font-black text-gradient tabular-nums">{devicePercentages.desktop}%</div>
                          <div className="text-xs uppercase font-black tracking-widest text-muted-foreground opacity-50">{t('dashboard.insights.desktop', 'ПК')}</div>
                        </div>
                      </Card>
                      <Card className="p-5 sm:p-4 flex sm:flex-col items-center gap-4 sm:gap-2 text-center glass border-white/10 shadow-glass rounded-3xl group/device hover:bg-white/5 transition-colors">
                        <Globe className="h-6 w-6 sm:h-5 sm:w-5 text-violet-500 group-hover/device:scale-110 transition-transform" />
                        <div className="flex-1 sm:flex-none text-left sm:text-center">
                          <div className="text-2xl font-black text-gradient tabular-nums">{devicePercentages.tablet}%</div>
                          <div className="text-xs uppercase font-black tracking-widest text-muted-foreground opacity-50">{t('dashboard.insights.tablet', 'Планшет')}</div>
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                </motion.div>
              </TabsContent>

              {/* Traffic Tab */}
              <TabsContent value="traffic" className="mt-4">
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <EngagementMetrics
                    avgSessionDuration={stats.avgSessionDuration}
                    bounceRate={stats.bounceRate}
                    returningVisitors={stats.returningVisitors}
                    ctr={stats.ctr}
                    totalViews={stats.views}
                    uniqueVisitors={stats.uniqueVisitors}
                  />

                  <TrafficSourcesChart sources={stats.sources} variant="bar" />

                  <GeographyChart data={stats.geoData} totalVisitors={stats.uniqueVisitors} />
                </motion.div>
              </TabsContent>

              {/* Blocks Tab */}
              <TabsContent value="blocks" className="mt-4">
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <BlockPerformance
                    blocks={stats.topBlocks}
                    totalViews={stats.views}
                    showChart={true}
                  />

                  {/* Top Blocks List */}
                  {stats.topBlocks.length > 0 && (
                    <div className="space-y-3">
                      <h2 className="font-bold px-1">{t('dashboard.insights.topBlocks', 'Детали по блокам')}</h2>
                      <Card className="divide-y divide-border/50">
                        {stats.topBlocks.slice(0, 5).map((block, index) => (
                          <motion.div
                            key={block.blockId}
                            className="p-4 flex items-center gap-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center font-bold text-muted-foreground">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{block.blockTitle}</div>
                              <div className="text-sm text-muted-foreground">
                                {block.clicks} {t('dashboard.insights.clicksCount', 'кликов')} • CTR: {block.ctr.toFixed(1)}%
                              </div>
                            </div>
                            <div className="w-20">
                              <Progress value={Math.min(100, block.ctr * 5)} className="h-2" />
                            </div>
                          </motion.div>
                        ))}
                      </Card>
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              {/* Funnel Tab */}
              <TabsContent value="funnel" className="mt-4">
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <ConversionFunnel
                    views={stats.views}
                    clicks={stats.clicks}
                    shares={stats.shares}
                    conversions={stats.conversions}
                  />

                  {/* Conversion insights */}
                  <Card className="p-4">
                    <h3 className="font-bold mb-3">{t('analytics.funnel.insights', 'Анализ конверсии')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">
                          {t('analytics.funnel.clickRate', 'Клики / Просмотры')}
                        </span>
                        <span className="font-bold">{stats.ctr.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">
                          {t('analytics.funnel.conversionRate', 'Конверсии / Просмотры')}
                        </span>
                        <span className="font-bold">
                          {stats.views > 0 ? ((stats.conversions / stats.views) * 100).toFixed(2) : 0}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-muted-foreground">
                          {t('analytics.funnel.avgPerDay', 'Среднее в день')}
                        </span>
                        <span className="font-bold">{stats.avgViewsPerDay} просмотров</span>
                      </div>
                    </div>
                  </Card>

                  {/* Premium gate for advanced funnel */}
                  {!isPremium && (
                    <Card className="p-4 bg-gradient-to-r from-primary/5 to-violet-500/5 border-primary/20">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-sm">{t('analytics.premium.title', 'Расширенная воронка')}</h3>
                          <p className="text-xs text-muted-foreground">
                            {t('analytics.premium.desc', 'A/B тесты, heatmaps и детальная аналитика в Pro')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </motion.div>
              </TabsContent>

              {/* Experiments Tab */}
              {isPremium && (
                <TabsContent value="experiments" className="mt-4">
                  <ExperimentsList pageId={pageId} />
                </TabsContent>
              )}
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
});

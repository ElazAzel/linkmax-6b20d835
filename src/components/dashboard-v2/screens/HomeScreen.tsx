'use client';

/**
 * HomeScreen v2.0 - Activation hub with outcome-based checklist
 * Moves checklist above page card, removes "Why LinkMAX", adds celebration + dynamic CTAs
 */
import { memo, useMemo, useEffect, useRef, ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import PenTool from 'lucide-react/dist/esm/icons/pen-tool';
import Crown from 'lucide-react/dist/esm/icons/crown';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import Store from 'lucide-react/dist/esm/icons/store';
import Users from 'lucide-react/dist/esm/icons/users';
import History from 'lucide-react/dist/esm/icons/history';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DashboardHeader } from '../layout/DashboardHeader';
import { StatusBadge } from '../common/StatusBadge';
import { ActionCard } from '../common/ActionCard';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { cn } from '@/lib/utils/utils';
import { getI18nText } from '@/lib/i18n-helpers';
import type { PageData, ProfileBlock } from '@/types/page';
import { StatCard } from '@/components/shared/StatCard';
import { ActivationChecklist, ActivationCelebration } from '@/components/onboarding/ActivationChecklist';
import { SearchReadinessCard } from '@/components/dashboard-v2/widgets/SearchReadinessCard';
import { KaspiQRWidget } from '@/components/dashboard-v2/widgets/KaspiQRWidget';
import { MetricsGrid } from '@/components/dashboard-v2/widgets/MetricsGrid';
import { ConversionFunnelWidget } from '@/components/dashboard-v2/widgets/ConversionFunnelWidget';
import { SourcesWidget } from '@/components/dashboard-v2/widgets/SourcesWidget';
import { useActivationChecklist } from '@/hooks/onboarding/useActivationChecklist';
import { IncomingWidget } from '@/components/dashboard-v2/widgets/IncomingWidget';
import { OperatorSummaryWidget } from '@/components/dashboard-v2/widgets/OperatorSummaryWidget';
import { WalletOverviewWidget } from '@/components/dashboard-v2/widgets/WalletOverviewWidget';
import { useRepeatCustomers } from '@/hooks/crm/useRepeatCustomers';
import { trackActivationEvent, trackCreatorReturnedAfterGap } from '@/lib/activation-events';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/user/useAuth';
import { differenceInDays, parseISO } from 'date-fns';
import { storage } from '@/lib/storage';
import Repeat from 'lucide-react/dist/esm/icons/repeat';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';

interface HomeScreenProps {
  pageData: PageData | null;
  loading: boolean;
  isPremium: boolean;
  realLeadsCount?: number;
  onOpenEditor: () => void;
  onPreview: () => void;
  onShare: () => void;
  onOpenTemplates: () => void;
  onOpenMarketplace: () => void;
  pageSwitcher?: ReactNode;
  onOpenVersions?: () => void;
  onOpenInsights?: () => void;
  onOpenActivity?: () => void;
}

export const HomeScreen = memo(function HomeScreen({
  pageData,
  loading,
  isPremium,
  onOpenEditor,
  onPreview,
  onShare,
  onOpenTemplates,
  onOpenMarketplace,
  pageSwitcher,
  onOpenVersions,
  onOpenInsights,
  onOpenActivity,
  realLeadsCount = 0,
}: HomeScreenProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const gapDetectedRef = useRef(false);

  const viewCount = pageData?.viewCount || 0;

  // Activation checklist with outcome-based data
  const activation = useActivationChecklist({
    pageData,
    onOpenEditor,
    onShare,
    pageId: pageData?.id,
    leadsCount: realLeadsCount,
  });
  const [checklistDismissed, setChecklistDismissed] = useState(false);

  useEffect(() => {
    if (!pageData?.id || activation.steps.length === 0) return;

    const trackingKey = `activation_funnel_steps_${pageData.id}`;
    const trackedSteps = storage.get<string[]>(trackingKey) || [];
    const trackedSet = new Set(trackedSteps);

    const completionEvents: Record<string, 'funnel_step_create_page_completed' | 'funnel_step_add_block_completed' | 'funnel_step_publish_completed' | 'funnel_step_first_lead_completed'> = {
      'create-page': 'funnel_step_create_page_completed',
      'add-block': 'funnel_step_add_block_completed',
      'publish': 'funnel_step_publish_completed',
      'first-lead': 'funnel_step_first_lead_completed',
    };

    let hasUpdates = false;

    activation.steps.forEach((step) => {
      if (!step.completed || trackedSet.has(step.id)) return;
      const eventType = completionEvents[step.id];
      if (!eventType) return;
      trackActivationEvent(pageData.id, eventType);
      trackedSet.add(step.id);
      hasUpdates = true;
    });

    if (hasUpdates) {
      storage.set(trackingKey, Array.from(trackedSet));
    }
  }, [activation.steps, pageData?.id]);

  // Creator return-after-gap detection
  useEffect(() => {
    if (!user || !pageData?.id || gapDetectedRef.current) return;
    gapDetectedRef.current = true;
    (async () => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('last_active_date')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.last_active_date) {
        const gap = differenceInDays(new Date(), parseISO(profile.last_active_date));
        if (gap >= 3) {
          trackCreatorReturnedAfterGap(pageData.id, gap);
        }
      }
    })();
  }, [user, pageData?.id]);

  // Page state flags (safe with optional chaining)
  const isPublished = pageData?.isPublished || false;
  const hasContent = (pageData?.blocks?.length || 0) > 1 ||
    (pageData?.blocks?.length === 1 && pageData?.blocks[0].type !== 'profile');

  // Context-aware tip — outcome-focused, not cosmetic
  const dynamicTip = useMemo(() => {
    if (!isPublished && hasContent) {
      return t('activation.tips.publish', 'Опубликуйте страницу, чтобы она стала доступна по ссылке');
    }
    if (isPublished && viewCount === 0) {
      return t('activation.tips.shareForVisitor', 'Поделитесь ссылкой — 5 из 10 пользователей получают первого посетителя в первый час');
    }
    if (isPublished && viewCount > 0 && realLeadsCount === 0) {
      return t('activation.tips.addForm', 'Добавьте форму сбора контактов — каждая 5-я страница с формой получает лиды');
    }
    if (!hasContent) {
      return t('activation.tips.addBlock', 'Добавьте первый блок — ссылку, товар или видео');
    }
    return t('activation.tips.growTraffic', 'Поделитесь ссылкой в соцсетях, чтобы привлечь больше посетителей');
  }, [hasContent, isPublished, viewCount, realLeadsCount, t]);

  if (loading || !pageData) {
    return <LoadingSkeleton />;
  }

  const profileBlock = pageData.blocks.find((b) => b.type === 'profile') as ProfileBlock | undefined;
  const rawName = profileBlock?.name;
  const name = rawName
    ? typeof rawName === 'object'
      ? getI18nText(rawName, i18n.language as 'ru' | 'en' | 'kk') || t('dashboard.home.myPage', 'Моя страница')
      : rawName
    : t('dashboard.home.myPage', 'Моя страница');
  const avatarUrl = profileBlock?.avatar || '';
  const blockCount = pageData.blocks.length;
  const slug = pageData.slug || 'mypage';

  // Real stats from props
  const weeklyStats = {
    views: viewCount,
    leads: realLeadsCount,
  };

  return (
    <div className="min-h-screen safe-area-top">
      <DashboardHeader
        title={t('dashboard.home.title', 'Главная')}
        subtitle={t('dashboard.home.subtitle', 'Обзор вашей страницы')}
        onMenuClick={() => {}}
        actions={pageSwitcher}
      />

      <div className="px-4 md:px-5 py-6 space-y-6">
        {/* Activation Checklist — ABOVE page card for visibility */}
        {activation.isVisible && !checklistDismissed && (
          <ActivationChecklist
            steps={activation.steps}
            completedCount={activation.completedCount}
            totalCount={activation.totalCount}
            progress={activation.progress}
            canDismiss={activation.canDismiss}
            onDismiss={() => {
              activation.dismiss();
              setChecklistDismissed(true);
            }}
            onStepClick={(step) => {
              activation.handleStepClick(step);
              navigate(step.href);
            }}
          />
        )}

        {/* Celebration card when all steps complete */}
        {activation.showCelebration && (
          <ActivationCelebration onDismiss={activation.dismissCelebration} />
        )}

        {/* Operator Widgets — incoming leads + bookings + summary (after activation) */}
        {(checklistDismissed || activation.showCelebration || !activation.isVisible) && isPublished && (
          <>
            <IncomingWidget
              pageId={pageData?.id}
              onOpenActivity={onOpenActivity}
              onShare={onShare}
            />
            <OperatorSummaryWidget
              pageId={pageData?.id}
              pageSlug={slug}
              pageNiche={pageData?.niche}
              pageUpdatedAt={pageData?.updatedAt}
              onOpenActivity={onOpenActivity}
              onOpenEditor={onOpenEditor}
            />
            
            <WalletOverviewWidget 
              onViewFinance={() => navigate('/finance')}
              className="glass border-white/10 shadow-glass"
            />
            
            <KaspiQRWidget
              ownerId={pageData?.userId || ''}
              className="glass border-white/10 shadow-glass"
            />

            {/* Performance Hub / Metrics */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                {t('dashboard.home.performance', 'Эффективность')}
              </h3>
              <MetricsGrid pageId={pageData?.id} />
              <ConversionFunnelWidget pageId={pageData?.id} />
              <SourcesWidget className="mt-1" />
            </div>
          </>
        )}

        {/* Primary Page Card */}
        <Card className="p-5 md:p-8 space-y-6 glass border-white/20 shadow-glass-lg relative overflow-hidden group rounded-[2.5rem] md:rounded-[3rem]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-30 group-hover:opacity-50 transition-opacity duration-1000 -z-10" />
          
          {/* Page Header */}
          <div className="flex items-center gap-6">
            <div className="relative group/avatar shrink-0">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-primary via-secondary to-primary rounded-2xl blur-md opacity-20 group-hover/avatar:opacity-40 transition duration-1000 animate-pulse" />
              <Avatar className="h-20 w-20 md:h-24 md:w-24 rounded-2xl border-2 border-white/30 relative shadow-glass">
                <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
                <AvatarFallback className="rounded-2xl text-2xl md:text-3xl font-black bg-white/10 text-primary backdrop-blur-xl">
                  {name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-black tracking-tighter truncate text-foreground drop-shadow-sm">{name}</h2>
                {isPremium && (
                  <Badge className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-[length:200%_auto] animate-[gradient-shift_3s_ease_infinite] text-white border-none shadow-glass-lg shrink-0 font-black text-[10px] px-3 py-1 rounded-full">
                    <Crown className="h-3 w-3 mr-1.5" />
                    PRO
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground/70 tracking-tight">lnkmx.my/{slug}</span>
                <StatusBadge status={isPublished ? 'published' : 'draft'} size="sm" />
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 md:gap-5">
            <button onClick={onOpenEditor} className="text-left transition-smooth active:scale-95 group/stat">
              <StatCard
                icon={<LayoutGrid className="w-5 h-5 group-hover/stat:scale-110 group-hover/stat:text-primary transition-all" />}
                value={blockCount}
                label={t('dashboard.home.blocks', 'блоков')}
                variant="glass"
                compact
              />
            </button>
            <button onClick={onOpenInsights} className="text-left transition-smooth active:scale-95 group/stat">
              <StatCard
                icon={<Eye className="h-5 w-5 text-emerald-500 group-hover/stat:scale-110 transition-transform" />}
                value={viewCount}
                label={t('dashboard.home.views', 'просмотров')}
                variant="glass"
                compact
              />
            </button>
            <button onClick={onOpenActivity} className="text-left transition-smooth active:scale-95 group/stat">
              <StatCard
                icon={<MessageSquare className="h-5 w-5 text-violet-500 group-hover/stat:scale-110 transition-transform" />}
                value={weeklyStats.leads}
                label={t('dashboard.home.leads', 'заявок')}
                variant="glass"
                compact
              />
            </button>
          </div>

          {/* Primary Actions — Premium pill buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            {!isPublished ? (
              <>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-16 flex-1 rounded-2xl text-base font-black glass-subtle hover:bg-white/20 transition-all border-white/10 group/btn"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenEditor(); }}
                >
                  <PenTool className="h-5 w-5 mr-3 shrink-0 opacity-70 group-hover/btn:scale-110 transition-transform" />
                  {t('dashboard.home.edit', 'Редактировать')}
                </Button>
                <Button
                  size="lg"
                  className="h-16 flex-1 rounded-2xl text-base font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-glass-lg hover:shadow-emerald-500/40 transition-all active:scale-[0.98] group/btn"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onShare(); }}
                >
                  <Share2 className="h-5 w-5 mr-3 shrink-0 group-hover/btn:scale-110 transition-transform" />
                  {t('dashboard.home.publish', 'Опубликовать')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="h-16 flex-1 rounded-2xl text-base font-black bg-primary hover:bg-primary/90 text-white shadow-glass-lg hover:shadow-primary/40 transition-all active:scale-[0.98] group/btn"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenEditor(); }}
                >
                  <PenTool className="h-5 w-5 mr-3 shrink-0 group-hover/btn:scale-110 transition-transform" />
                  {t('dashboard.home.edit', 'Редактировать')}
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-16 flex-1 rounded-2xl text-base font-black glass-subtle hover:bg-white/20 transition-all border-white/10 group/btn"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onShare(); }}
                >
                  <Share2 className="h-5 w-5 mr-3 shrink-0 opacity-70 group-hover/btn:scale-110 transition-transform" />
                  {t('dashboard.home.share', 'Поделиться')}
                </Button>
              </>
            )}
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1 h-12 rounded-xl glass-subtle border-none hover:bg-white/10 text-xs font-bold uppercase tracking-widest opacity-70 hover:opacity-100" onClick={onPreview}>
              <Eye className="h-4 w-4 mr-2" />
              {t('dashboard.home.preview', 'Предпросмотр')}
            </Button>
            {isPublished && (
              <Button
                variant="ghost"
                className="h-12 w-12 rounded-xl p-0 glass-subtle border-none hover:bg-white/10 opacity-70 hover:opacity-100"
                onClick={() => window.open(`/${slug}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>

        {/* Search Readiness Card */}
        {isPublished && pageData && (
          <SearchReadinessCard pageData={pageData} />
        )}

        {/* Quick Actions Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('dashboard.home.quickActions', 'Быстрые действия')}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {/* Show templates only for pages without content */}
            {!hasContent && (
              <ActionCard
                icon={LayoutTemplate}
                iconBg="bg-emerald-500/20"
                iconColor="text-emerald-600"
                title={t('dashboard.home.templates', 'Шаблоны')}
                description={t('dashboard.home.templatesDesc', 'Готовые страницы')}
                onClick={onOpenTemplates}
                gradient="from-emerald-500/15 to-green-500/15"
                border="border-emerald-500/20"
              />
            )}

            {/* Show version history for pages with content */}
            {hasContent && onOpenVersions && (
              <ActionCard
                icon={History}
                iconBg="bg-blue-500/20"
                iconColor="text-blue-600"
                title={t('dashboard.home.versions', 'История')}
                description={t('dashboard.home.versionsDesc', 'Версии страницы')}
                onClick={onOpenVersions}
                gradient="from-blue-500/15 to-cyan-500/15"
                border="border-blue-500/20"
              />
            )}

            <ActionCard
              icon={Store}
              iconBg="bg-violet-500/20"
              iconColor="text-violet-600"
              title={t('dashboard.home.marketplace', 'Маркетплейс')}
              description={t('dashboard.home.marketplaceDesc', 'От сообщества')}
              onClick={onOpenMarketplace}
              gradient="from-violet-500/15 to-purple-500/15"
              border="border-violet-500/20"
            />

            <ActionCard
              icon={Users}
              iconBg="bg-pink-500/20"
              iconColor="text-pink-600"
              title={t('dashboard.home.gallery', 'Галерея')}
              description={t('dashboard.home.galleryDesc', 'Вдохновление')}
              onClick={() => navigate('/gallery')}
              gradient="from-pink-500/15 to-rose-500/15"
              border="border-pink-500/20"
            />

            {!isPremium && (
              <ActionCard
                icon={Crown}
                iconBg="bg-amber-500/20"
                iconColor="text-amber-600"
                title={t('dashboard.home.premium', 'Premium')}
                description={t('dashboard.home.premiumDesc', 'Больше возможностей')}
                onClick={() => navigate('/pricing')}
                gradient="from-amber-500/15 to-orange-500/15"
                border="border-amber-500/20"
              />
            )}
          </div>
        </div>

        {/* Lifecycle Nudge — data-driven contextual tip */}
        {(() => {
          // Lifecycle-aware nudge replaces static tip
          if (isPublished && viewCount > 0 && realLeadsCount === 0) {
            return (
              <Card className="p-5 bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/10">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold mb-1">{t('lifecycle.trafficNoLeads.title', 'Есть трафик, но нет заявок')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('lifecycle.trafficNoLeads.hint', 'Добавьте форму сбора контактов или блок записи — каждая 5-я страница с формой получает заявки')}
                    </p>
                  </div>
                </div>
              </Card>
            );
          }
          if (repeatCount > 0) {
            return (
              <Card className="p-5 bg-gradient-to-br from-violet-500/5 to-purple-500/5 border-violet-500/10">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                    <Repeat className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold mb-1">{t('lifecycle.repeatCustomers.title', 'Постоянные клиенты')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('lifecycle.repeatCustomers.hint', 'У вас {{count}} постоянных клиентов — отличная работа! 🎉', { count: repeatCount })}
                    </p>
                  </div>
                </div>
              </Card>
            );
          }
          if (isPublished && realLeadsCount > 0) {
            return (
              <Card className="p-5 bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-500/10">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold mb-1">{t('lifecycle.hasLeads.title', 'Заявки поступают')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('lifecycle.hasLeads.hint', 'Напишите клиентам после визита — это повышает возврат на 30%')}
                    </p>
                  </div>
                </div>
              </Card>
            );
          }
          return (
            <Card className="p-5 bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/10">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold mb-1">{t('dashboard.home.tip', 'Совет')}</h4>
                  <p className="text-sm text-muted-foreground">{dynamicTip}</p>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* "Why LinkMAX" card REMOVED — user already converted, this is landing copy */}
      </div>
    </div>
  );
});

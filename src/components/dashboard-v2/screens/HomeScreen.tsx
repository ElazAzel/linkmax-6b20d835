'use client';

/**
 * HomeScreen - Dashboard overview with primary page card and quick actions
 * Now includes PageSwitcher in the header for multi-page context
 */
import { memo, useMemo, ReactNode, useState } from 'react';
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
import { ActivationChecklist } from '@/components/onboarding/ActivationChecklist';
import { useActivationChecklist } from '@/hooks/onboarding/useActivationChecklist';

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

  // Activation checklist
  const activation = useActivationChecklist({
    pageData,
    onOpenEditor,
    onShare,
  });
  const [checklistDismissed, setChecklistDismissed] = useState(false);

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
  const viewCount = pageData.viewCount || 0;
  const isPublished = pageData.isPublished || false;
  const slug = pageData.slug || 'mypage';

  // Page has content if it has more than just a profile block
  const hasContent = pageData.blocks.length > 1 ||
    (pageData.blocks.length === 1 && pageData.blocks[0].type !== 'profile');

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
        rightElement={pageSwitcher}
      />

      <div className="px-5 py-6 space-y-6">
        {/* Primary Page Card */}
        <Card className="p-6 space-y-5 glass-card border-white/20 shadow-glass-lg relative overflow-hidden group">
          <div className="absolute inset-0 bg-liquid-mesh opacity-10 -z-10 pointer-events-none" />
          {/* Page Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-2xl border-2 border-border">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="rounded-2xl text-xl font-bold bg-primary/10 text-primary">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold truncate">{name}</h2>
                {isPremium && (
                  <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 shrink-0">
                    <Crown className="h-3 w-3 mr-1" />
                    PRO
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">lnkmx.my/{slug}</span>
                <StatusBadge status={isPublished ? 'published' : 'draft'} size="sm" />
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <button onClick={onOpenEditor} className="text-left transition-transform active:scale-95">
              <StatCard
                icon={<LayoutGrid className="w-5 h-5" />}
                value={blockCount}
                label={t('dashboard.home.blocks', 'блоков')}
                variant="glass"
                compact
              />
            </button>
            <button onClick={onOpenInsights} className="text-left transition-transform active:scale-95">
              <StatCard
                icon={<Eye className="w-5 h-5 text-emerald-500" />}
                value={viewCount}
                label={t('dashboard.home.views', 'просмотров')}
                variant="glass"
                compact
              />
            </button>
            <button onClick={onOpenActivity} className="text-left transition-transform active:scale-95">
              <StatCard
                icon={<MessageSquare className="w-5 h-5 text-violet-500" />}
                value={weeklyStats.leads}
                label={t('dashboard.home.leads', 'заявок')}
                variant="glass"
                compact
              />
            </button>
          </div>

          {/* Primary Actions */}
          <div className="flex gap-3">
            <Button
              size="lg"
              className="h-14 flex-1 rounded-2xl text-[13px] sm:text-base font-bold shadow-lg shadow-primary/25"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onOpenEditor();
              }}
            >
              <PenTool className="h-5 w-5 mr-2 shrink-0" />
              {t('dashboard.home.edit', 'Редактировать')}
            </Button>
            <Button
              size="lg"
              variant={isPublished ? 'secondary' : 'default'}
              className={cn(
                "h-14 flex-1 rounded-2xl text-[13px] sm:text-base font-bold",
                !isPublished && "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
              )}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onShare();
              }}
            >
              <Share2 className="h-5 w-5 mr-2 shrink-0" />
              {isPublished ? t('dashboard.home.share', 'Поделиться') : t('dashboard.home.publish', 'Опубликовать')}
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={onPreview}>
              <Eye className="h-4 w-4 mr-2" />
              {t('dashboard.home.preview', 'Предпросмотр')}
            </Button>
            {isPublished && (
              <Button
                variant="outline"
                className="h-12 w-12 rounded-xl p-0"
                onClick={() => window.open(`/${slug}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
        </Card>

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
              description={t('dashboard.home.galleryDesc', 'Вдохновение')}
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

        {/* AI Recommendation */}
        <Card className="p-5 bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/10">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold mb-1">{t('dashboard.home.tip', 'Совет')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.home.tipContent', 'Добавьте блок с ценами, чтобы увеличить конверсию на 40%')}
              </p>
            </div>
          </div>
        </Card>

        {/* Phase B: Why LinkMAX — value props */}
        <Card className="p-5 border-border/40 bg-card/50">
          <h4 className="font-bold mb-3 text-sm uppercase tracking-wider text-muted-foreground">
            {t('phaseB.whyLnkmx.title', 'Почему LinkMAX')}
          </h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {t('phaseB.whyLnkmx.noSetup', 'CRM за 15 минут — без внедрения')}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {t('phaseB.whyLnkmx.mobile', 'Вся работа со смартфона')}
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              {t('phaseB.whyLnkmx.premium', 'Дизайн премиум из коробки')}
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
});

/**
 * HomeScreen - Dashboard overview with primary page card and quick actions
 * Now includes PageSwitcher in the header for multi-page context
 */
import { memo, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Share2,
  PenTool,
  Crown,
  ExternalLink,
  Sparkles,
  LayoutTemplate,
  Store,
  Users,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DashboardHeader } from '../layout/DashboardHeader';
import { StatusBadge } from '../common/StatusBadge';
import { ActionCard } from '../common/ActionCard';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { cn } from '@/lib/utils';
import { getI18nText } from '@/lib/i18n-helpers';
import type { PageData, ProfileBlock } from '@/types/page';

interface HomeScreenProps {
  pageData: PageData | null;
  loading: boolean;
  isPremium: boolean;
  onOpenEditor: () => void;
  onPreview: () => void;
  onShare: () => void;
  onOpenTemplates: () => void;
  onOpenMarketplace: () => void;
  pageSwitcher?: ReactNode;
  onOpenVersions?: () => void;
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
}: HomeScreenProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

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

  // Stats for this week (mock for now, would come from analytics hook)
  const weeklyStats = {
    views: viewCount,
    clicks: Math.floor(viewCount * 0.3),
    leads: Math.floor(viewCount * 0.05),
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
        <Card className="p-6 space-y-5">
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
            <div className="p-4 rounded-2xl bg-muted/50 text-center">
              <div className="text-2xl font-black text-primary">{blockCount}</div>
              <div className="text-xs text-muted-foreground font-medium">
                {t('dashboard.home.blocks', 'блоков')}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-muted/50 text-center">
              <div className="text-2xl font-black text-emerald-500">{viewCount}</div>
              <div className="text-xs text-muted-foreground font-medium">
                {t('dashboard.home.views', 'просмотров')}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-muted/50 text-center">
              <div className="text-2xl font-black text-violet-500">{weeklyStats.leads}</div>
              <div className="text-xs text-muted-foreground font-medium">
                {t('dashboard.home.leads', 'заявок')}
              </div>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              className="h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/25"
              onClick={onOpenEditor}
            >
              <PenTool className="h-5 w-5 mr-2" />
              {t('dashboard.home.edit', 'Редактировать')}
            </Button>
            <Button
              size="lg"
              variant={isPublished ? 'secondary' : 'default'}
              className={cn(
                "h-14 rounded-2xl text-base font-bold",
                !isPublished && "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
              )}
              onClick={onShare}
            >
              <Share2 className="h-5 w-5 mr-2" />
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
      </div>
    </div>
  );
});

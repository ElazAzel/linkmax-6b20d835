/**
 * ProjectsTab - Home screen showing project card and quick actions
 * Mobile-native design with large touch targets
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Share2,
  PenTool,
  Settings,
  LayoutTemplate,
  Store,
  Crown,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { PageData } from '@/types/page';
import type { User } from '@supabase/supabase-js';

interface ProjectsTabProps {
  pageData: PageData;
  user: User | null;
  isPremium: boolean;
  onOpenEditor: () => void;
  onOpenSettings: () => void;
  onPreview: () => void;
  onShare: () => void;
  onOpenTemplates: () => void;
  onOpenMarketplace: () => void;
}

export const ProjectsTab = memo(function ProjectsTab({
  pageData,
  user,
  isPremium,
  onOpenEditor,
  onOpenSettings,
  onPreview,
  onShare,
  onOpenTemplates,
  onOpenMarketplace,
}: ProjectsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const profileBlock = pageData.blocks.find(b => b.type === 'profile');
  // Safe access to profile data with type guard
  const profileData = profileBlock && profileBlock.type === 'profile' ? profileBlock : null;
  const rawName = profileData?.name || 'Мой сайт';
  const name = typeof rawName === 'object' ? (rawName.ru || rawName.en || 'Мой сайт') : rawName;
  const avatarUrl = profileData?.avatar || '';
  const blockCount = pageData.blocks.length;
  const viewCount = pageData.viewCount || 0;
  const isPublished = pageData.isPublished || false;
  const slug = pageData.slug || 'mypage';

  return (
    <div className="min-h-screen safe-area-top">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-nav px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">{t('projects.title', 'Проекты')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('projects.subtitle', 'Ваши страницы')}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-12 w-12 rounded-2xl"
            onClick={onOpenSettings}
          >
            <Settings className="h-6 w-6" />
          </Button>
        </div>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Main Project Card */}
        <Card className="glass-card p-6 space-y-5">
          {/* Project Header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-2xl border-2 border-border">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="rounded-2xl text-xl font-bold bg-primary/10 text-primary">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold truncate">{name}</h2>
                {isPremium && (
                  <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                    <Crown className="h-3 w-3 mr-1" />
                    PRO
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                lnkmx.my/{slug}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-muted/50 text-center">
              <div className="text-2xl font-black text-primary">{blockCount}</div>
              <div className="text-xs text-muted-foreground font-medium">
                {t('projects.blocks', 'блоков')}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-muted/50 text-center">
              <div className="text-2xl font-black text-emerald-500">{viewCount}</div>
              <div className="text-xs text-muted-foreground font-medium">
                {t('projects.views', 'просмотров')}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-muted/50 text-center">
              <div className={cn(
                "text-2xl font-black",
                isPublished ? "text-emerald-500" : "text-amber-500"
              )}>
                {isPublished ? '✓' : '○'}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {isPublished ? t('projects.published', 'опубликован') : t('projects.draft', 'черновик')}
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
              {t('projects.edit', 'Редактировать')}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-14 rounded-2xl text-base font-bold"
              onClick={onShare}
            >
              <Share2 className="h-5 w-5 mr-2" />
              {t('projects.publish', 'Опубликовать')}
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl"
              onClick={onPreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              {t('projects.preview', 'Предпросмотр')}
            </Button>
            <Button
              variant="outline"
              className="h-12 w-12 rounded-xl p-0"
              onClick={() => window.open(`/${slug}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Quick Actions Grid */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('projects.quickActions', 'Быстрые действия')}
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onOpenTemplates}
              className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/15 to-green-500/15 border border-emerald-500/20 transition-all active:scale-[0.98]"
            >
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-3">
                <LayoutTemplate className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="font-bold text-left">{t('projects.templates', 'Шаблоны')}</p>
              <p className="text-xs text-muted-foreground text-left mt-0.5">
                {t('projects.templatesDesc', 'Готовые страницы')}
              </p>
            </button>

            <button
              onClick={onOpenMarketplace}
              className="p-5 rounded-3xl bg-gradient-to-br from-violet-500/15 to-purple-500/15 border border-violet-500/20 transition-all active:scale-[0.98]"
            >
              <div className="h-12 w-12 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-3">
                <Store className="h-6 w-6 text-violet-600" />
              </div>
              <p className="font-bold text-left">{t('projects.marketplace', 'Маркетплейс')}</p>
              <p className="text-xs text-muted-foreground text-left mt-0.5">
                {t('projects.marketplaceDesc', 'От сообщества')}
              </p>
            </button>

            <button
              onClick={() => navigate('/gallery')}
              className="p-5 rounded-3xl bg-gradient-to-br from-pink-500/15 to-rose-500/15 border border-pink-500/20 transition-all active:scale-[0.98]"
            >
              <div className="h-12 w-12 rounded-2xl bg-pink-500/20 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-pink-600" />
              </div>
              <p className="font-bold text-left">{t('projects.gallery', 'Галерея')}</p>
              <p className="text-xs text-muted-foreground text-left mt-0.5">
                {t('projects.galleryDesc', 'Вдохновение')}
              </p>
            </button>

            <button
              onClick={() => navigate('/pricing')}
              className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 border border-amber-500/20 transition-all active:scale-[0.98]"
            >
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-3">
                <Crown className="h-6 w-6 text-amber-600" />
              </div>
              <p className="font-bold text-left">{t('projects.premium', 'Premium')}</p>
              <p className="text-xs text-muted-foreground text-left mt-0.5">
                {t('projects.premiumDesc', 'Больше возможностей')}
              </p>
            </button>
          </div>
        </div>

        {/* Tips Section */}
        <Card className="p-5 bg-gradient-to-br from-primary/5 to-violet-500/5 border-primary/10">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-bold mb-1">{t('projects.tip', 'Совет')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('projects.tipContent', 'Добавьте блок с ценами, чтобы увеличить конверсию на 40%')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
});

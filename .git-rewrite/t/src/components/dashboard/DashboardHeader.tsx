import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AutoSaveIndicator, SaveStatus } from '@/components/editor/AutoSaveIndicator';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { StreakDisplay } from '@/components/streak/StreakDisplay';
import { TokenBalanceDisplay } from '@/components/tokens/TokenBalanceDisplay';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  LogOut,
  Save,
  Eye,
  Upload,
  Wand2,
  LayoutTemplate,
  Trophy,
  Users,
  Crown,
  MoreHorizontal,
  Settings,
  ImageIcon,
  Coins,
} from 'lucide-react';

interface DashboardHeaderProps {
  saving: boolean;
  saveStatus: SaveStatus;
  achievementCount: number;
  showSettings: boolean;
  onToggleSettings: () => void;
  onSave: () => void;
  onPreview: () => void;
  onShare: () => void;
  onSignOut: () => void;
  onOpenAIBuilder: () => void;
  onOpenTemplates: () => void;
  onOpenAchievements: () => void;
  onOpenCRM: () => void;
  userId?: string;
  onOpenGallery: () => void;
  onOpenTokens: () => void;
}

export function DashboardHeader({
  saving,
  saveStatus,
  achievementCount,
  showSettings,
  onToggleSettings,
  onSave,
  onPreview,
  onShare,
  onSignOut,
  onOpenAIBuilder,
  onOpenTemplates,
  onOpenAchievements,
  onOpenCRM,
  onOpenGallery,
  userId,
  onOpenTokens,
}: DashboardHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 hidden md:block">
      <div className="mx-5 mt-4">
        <div className="backdrop-blur-2xl bg-card/60 border border-border/30 rounded-3xl shadow-glass-lg">
          <div className="container mx-auto px-5 h-16 flex items-center justify-between gap-3">
            {/* Logo - BOLD */}
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 rounded-2xl blur-xl" />
                <img
                  src="/logo.png"
                  alt="LinkMAX"
                  className="relative h-10 w-10 animate-scale-in hover-scale rounded-2xl shadow-glass object-contain"
                />
              </div>
              <h1 className="text-2xl font-black text-primary tracking-tight">LinkMAX</h1>
              <AutoSaveIndicator status={saveStatus} />
            </div>

            {/* Actions - BOLD */}
            <div className="flex items-center gap-2">
              {/* Create Group */}
              <Button variant="ghost" size="default" onClick={onOpenAIBuilder} className="h-11 px-4 rounded-2xl font-bold">
                <Wand2 className="h-5 w-5 mr-2" />
                AI
              </Button>

              <Button variant="ghost" size="default" onClick={onOpenTemplates} className="h-11 px-4 rounded-2xl font-bold">
                <LayoutTemplate className="h-5 w-5 mr-2" />
                {t('templates.title', 'Шаблоны')}
              </Button>

              <div className="h-8 w-px bg-border/40" />

              {/* Business Group */}
              <Button variant="ghost" size="default" onClick={onOpenCRM} className="h-11 px-4 rounded-2xl font-bold">
                <Users className="h-5 w-5 mr-2" />
                CRM
              </Button>

              <Button
                variant={showSettings ? 'default' : 'ghost'}
                size="default"
                onClick={onToggleSettings}
                className="h-11 px-4 rounded-2xl font-bold"
              >
                <Settings className="h-5 w-5 mr-2" />
                {t('common.settings', 'Настройки')}
              </Button>

              <div className="h-8 w-px bg-border/40" />

              {/* Gamification & Community Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="default" className="relative h-11 px-4 rounded-2xl font-bold">
                    <MoreHorizontal className="h-5 w-5 mr-2" />
                    {t('common.more', 'Ещё')}
                    {achievementCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs font-bold flex items-center justify-center text-primary-foreground shadow-glass">
                        {achievementCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                  <DropdownMenuLabel className="text-sm font-bold">{t('menu.gamification', 'Геймификация')}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={onOpenAchievements} className="rounded-xl py-3 font-medium">
                    <Trophy className="h-5 w-5 mr-3" />
                    {t('achievements.title', 'Достижения')}
                    {achievementCount > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-sm px-2 py-0.5 rounded-lg font-bold">
                        {achievementCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenTokens} className="rounded-xl py-3 font-medium">
                    <Coins className="h-5 w-5 mr-3" />
                    {t('tokens.title', 'Токены')}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuLabel className="text-sm font-bold">{t('menu.community', 'Сообщество')}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={onOpenGallery} className="rounded-xl py-3 font-medium">
                    <ImageIcon className="h-5 w-5 mr-3" />
                    {t('gallery.title', 'Галерея')}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-2" />
                  <DropdownMenuItem onClick={() => navigate('/pricing')} className="rounded-xl py-3 font-medium">
                    <Crown className="h-5 w-5 mr-3" />
                    {t('pricing.title', 'Тарифы')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Compact Streak */}
              <StreakDisplay userId={userId} compact />

              {/* Token Balance */}
              <TokenBalanceDisplay onClick={onOpenTokens} compact />

              <LanguageSwitcher />

              <div className="h-8 w-px bg-border/40" />

              {/* Main Actions */}
              <Button variant="outline" size="default" onClick={onSave} disabled={saving} className="h-11 px-5 rounded-2xl font-bold">
                <Save className="h-5 w-5 mr-2" />
                {saving ? '...' : t('common.save', 'Сохранить')}
              </Button>

              <Button variant="outline" size="default" onClick={onPreview} className="h-11 px-5 rounded-2xl font-bold">
                <Eye className="h-5 w-5 mr-2" />
                {t('common.preview', 'Предпросмотр')}
              </Button>

              <Button size="default" onClick={onShare} data-onboarding="share-button" className="h-11 px-5 rounded-2xl font-bold shadow-glass-lg">
                <Upload className="h-5 w-5 mr-2" />
                {t('common.share', 'Поделиться')}
              </Button>

              <div className="h-8 w-px bg-border/40" />

              <Button
                variant="ghost"
                size="lg"
                onClick={onSignOut}
                className="hover:bg-destructive/10 hover:text-destructive h-11 w-11 rounded-2xl"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

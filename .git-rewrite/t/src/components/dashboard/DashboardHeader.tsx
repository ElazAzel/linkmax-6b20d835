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
      <div className="mx-4 mt-3">
        <div className="backdrop-blur-2xl bg-card/75 border border-border/30 rounded-2xl shadow-glass-lg">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-2">
            {/* Logo - Clean */}
            <div className="flex items-center gap-3">
              <div className="relative group cursor-pointer" onClick={() => navigate('/')}>
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:bg-primary/30 transition-colors" />
                <img
                  src="/logo.png"
                  alt="LinkMAX"
                  className="relative h-9 w-9 rounded-xl shadow-sm object-contain group-hover:scale-105 transition-transform"
                />
              </div>
              <h1 className="text-xl font-black text-primary tracking-tight">LinkMAX</h1>
              <div className="ml-1">
                <AutoSaveIndicator status={saveStatus} />
              </div>
            </div>

            {/* Actions - Refined */}
            <div className="flex items-center gap-1.5">
              {/* Create Group */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onOpenAIBuilder} 
                className="h-9 px-3 rounded-xl font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Wand2 className="h-4 w-4 mr-1.5" />
                AI
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onOpenTemplates} 
                className="h-9 px-3 rounded-xl font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <LayoutTemplate className="h-4 w-4 mr-1.5" />
                {t('templates.title', 'Шаблоны')}
              </Button>

              <div className="h-6 w-px bg-border/40 mx-1" />

              {/* Business Group */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onOpenCRM} 
                className="h-9 px-3 rounded-xl font-semibold hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Users className="h-4 w-4 mr-1.5" />
                CRM
              </Button>

              <Button
                variant={showSettings ? 'secondary' : 'ghost'}
                size="sm"
                onClick={onToggleSettings}
                className="h-9 px-3 rounded-xl font-semibold transition-colors"
              >
                <Settings className="h-4 w-4 mr-1.5" />
                {t('common.settings', 'Настройки')}
              </Button>

              <div className="h-6 w-px bg-border/40 mx-1" />

              {/* Gamification & Community Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-9 px-3 rounded-xl font-semibold">
                    <MoreHorizontal className="h-4 w-4 mr-1.5" />
                    {t('common.more', 'Ещё')}
                    {achievementCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground shadow-sm animate-pulse">
                        {achievementCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
                  <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-2">{t('menu.gamification', 'Геймификация')}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={onOpenAchievements} className="rounded-lg py-2.5 font-medium cursor-pointer">
                    <Trophy className="h-4 w-4 mr-2.5" />
                    {t('achievements.title', 'Достижения')}
                    {achievementCount > 0 && (
                      <span className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-md font-bold">
                        {achievementCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenTokens} className="rounded-lg py-2.5 font-medium cursor-pointer">
                    <Coins className="h-4 w-4 mr-2.5" />
                    {t('tokens.title', 'Токены')}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-2">{t('menu.community', 'Сообщество')}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={onOpenGallery} className="rounded-lg py-2.5 font-medium cursor-pointer">
                    <ImageIcon className="h-4 w-4 mr-2.5" />
                    {t('gallery.title', 'Галерея')}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-1.5" />
                  <DropdownMenuItem onClick={() => navigate('/pricing')} className="rounded-lg py-2.5 font-medium cursor-pointer">
                    <Crown className="h-4 w-4 mr-2.5" />
                    {t('pricing.title', 'Тарифы')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Compact Streak */}
              <StreakDisplay userId={userId} compact />

              {/* Token Balance */}
              <TokenBalanceDisplay onClick={onOpenTokens} compact />

              <LanguageSwitcher />

              <div className="h-6 w-px bg-border/40 mx-1" />

              {/* Main Actions */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onSave} 
                disabled={saving} 
                className="h-9 px-4 rounded-xl font-semibold"
              >
                <Save className="h-4 w-4 mr-1.5" />
                {saving ? '...' : t('common.save', 'Сохранить')}
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={onPreview} 
                className="h-9 px-4 rounded-xl font-semibold"
              >
                <Eye className="h-4 w-4 mr-1.5" />
                {t('common.preview', 'Предпросмотр')}
              </Button>

              <Button 
                size="sm" 
                onClick={onShare} 
                data-onboarding="share-button" 
                className="h-9 px-4 rounded-xl font-semibold shadow-lg shadow-primary/25"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                {t('common.share', 'Поделиться')}
              </Button>

              <div className="h-6 w-px bg-border/40 mx-1" />

              <Button
                variant="ghost"
                size="icon"
                onClick={onSignOut}
                className="hover:bg-destructive/10 hover:text-destructive h-9 w-9 rounded-xl transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

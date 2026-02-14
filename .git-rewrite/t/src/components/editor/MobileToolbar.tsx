import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  Eye,
  Upload,
  Settings,
  Wand2,
  LayoutTemplate,
  Trophy,
  Users,
  Globe,
  MoreHorizontal,
  X,
  Store,
  Coins,
  ImageIcon,
  Crown,
  Flame,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { AutoSaveIndicator, type SaveStatus } from './AutoSaveIndicator';
import { StreakDisplay } from '@/components/streak/StreakDisplay';
import { TokenBalanceDisplay } from '@/components/tokens/TokenBalanceDisplay';
import { cn } from '@/lib/utils';

interface MobileToolbarProps {
  saving: boolean;
  saveStatus: SaveStatus;
  onSave: () => void;
  onPreview: () => void;
  onShare: () => void;
  onOpenSettings: () => void;
  onOpenAIBuilder: () => void;
  onOpenTemplates: () => void;
  onOpenMarketplace: () => void;
  onOpenAchievements: () => void;
  onOpenCRM: () => void;
  onOpenTokens: () => void;
  onOpenGallery: () => void;
  achievementCount: number;
  userId?: string;
}

export const MobileToolbar = memo(function MobileToolbar({
  saving,
  saveStatus,
  onSave,
  onPreview,
  onShare,
  onOpenSettings,
  onOpenAIBuilder,
  onOpenTemplates,
  onOpenMarketplace,
  onOpenAchievements,
  onOpenCRM,
  onOpenTokens,
  onOpenGallery,
  achievementCount,
  userId,
}: MobileToolbarProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  // Main actions for bottom bar - simplified to 4 main actions
  const mainActions = [
    {
      icon: Eye,
      label: t('mobileToolbar.preview', 'Смотреть'),
      onClick: onPreview,
      variant: 'ghost' as const,
      color: 'text-blue-500',
    },
    {
      icon: Upload,
      label: t('mobileToolbar.share', 'Опубликовать'),
      onClick: onShare,
      variant: 'default' as const,
      primary: true,
    },
    {
      icon: Settings,
      label: t('mobileToolbar.settings', 'Настройки'),
      onClick: onOpenSettings,
      variant: 'ghost' as const,
      color: 'text-muted-foreground',
    },
    {
      icon: MoreHorizontal,
      label: t('mobileToolbar.more', 'Меню'),
      onClick: () => setMoreOpen(true),
      variant: 'ghost' as const,
      color: 'text-muted-foreground',
    },
  ];

  const moreActions = [
    {
      icon: Store,
      label: t('mobileToolbar.marketplace', 'Маркетплейс'),
      description: t('mobileToolbar.marketplaceDesc', 'Шаблоны от сообщества'),
      onClick: () => {
        setMoreOpen(false);
        onOpenMarketplace();
      },
      highlight: true,
      color: 'from-violet-500/20 to-purple-500/20',
      iconColor: 'text-violet-500',
    },
    {
      icon: Wand2,
      label: t('mobileToolbar.aiBuilder', 'AI Конструктор'),
      description: t('mobileToolbar.aiBuilderDesc', 'Создать страницу с AI'),
      onClick: () => {
        setMoreOpen(false);
        onOpenAIBuilder();
      },
      color: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-500',
    },
    {
      icon: LayoutTemplate,
      label: t('mobileToolbar.templates', 'Шаблоны'),
      description: t('mobileToolbar.templatesDesc', 'Готовые шаблоны'),
      onClick: () => {
        setMoreOpen(false);
        onOpenTemplates();
      },
      color: 'from-emerald-500/20 to-green-500/20',
      iconColor: 'text-emerald-500',
    },
    {
      icon: Trophy,
      label: t('mobileToolbar.achievements', 'Достижения'),
      description: t('mobileToolbar.achievementsDesc', 'Ваш прогресс'),
      onClick: () => {
        setMoreOpen(false);
        onOpenAchievements();
      },
      badge: achievementCount > 0 ? achievementCount : undefined,
      color: 'from-amber-500/20 to-yellow-500/20',
      iconColor: 'text-amber-500',
    },
    {
      icon: Coins,
      label: t('tokens.title', 'Токены'),
      description: t('mobileToolbar.tokensDesc', 'Ваш баланс и транзакции'),
      onClick: () => {
        setMoreOpen(false);
        onOpenTokens();
      },
      color: 'from-primary/20 to-violet-500/20',
      iconColor: 'text-primary',
    },
    {
      icon: Users,
      label: t('mobileToolbar.crm', 'CRM'),
      description: t('mobileToolbar.crmDesc', 'Управление лидами'),
      onClick: () => {
        setMoreOpen(false);
        onOpenCRM();
      },
      color: 'from-pink-500/20 to-rose-500/20',
      iconColor: 'text-pink-500',
    },
    {
      icon: ImageIcon,
      label: t('gallery.title', 'Галерея'),
      description: t('mobileToolbar.galleryDesc', 'Работы сообщества'),
      onClick: () => {
        setMoreOpen(false);
        onOpenGallery();
      },
      color: 'from-cyan-500/20 to-teal-500/20',
      iconColor: 'text-cyan-500',
    },
    {
      icon: Crown,
      label: t('pricing.title', 'Тарифы'),
      description: t('mobileToolbar.pricingDesc', 'Премиум возможности'),
      onClick: () => {
        setMoreOpen(false);
        navigate('/pricing');
      },
      color: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-500',
    },
  ];

  return (
    <>
      {/* Bottom Toolbar - Premium Mobile App Style */}
      <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div className="mx-4 mb-4 bg-card/90 backdrop-blur-2xl border border-border/20 rounded-[28px] shadow-2xl shadow-black/20 overflow-hidden">
          {/* Auto-save indicator - minimal */}
          <div className="flex items-center justify-center py-2 border-b border-border/10 bg-background/30">
            <AutoSaveIndicator status={saveStatus} />
          </div>
          
          {/* Main actions - Large touch targets */}
          <div className="flex items-center justify-around h-20 px-3">
            {mainActions.map((action) => (
              <Button
                key={action.label}
                variant={action.primary ? "default" : "ghost"}
                size="lg"
                onClick={action.onClick}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-16 min-w-0 flex-1 max-w-20 transition-all duration-300 rounded-2xl",
                  action.primary && "bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 active:scale-95 mx-2",
                  !action.primary && "hover:bg-muted/50 active:scale-95",
                  !action.primary && action.color
                )}
              >
                <action.icon className={cn("h-6 w-6", action.primary && "h-7 w-7")} />
                <span className={cn(
                  "text-[11px] font-bold leading-tight",
                  action.primary && "text-xs"
                )}>
                  {action.label}
                </span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* More Sheet - Premium Mobile App Design */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent 
          side="bottom" 
          className="z-[100] h-auto max-h-[92vh] rounded-t-[32px] p-0 bg-card/98 backdrop-blur-3xl border-t border-border/20 shadow-2xl [&>button]:hidden"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/25" />
          </div>
          
          <SheetHeader className="px-6 pb-5 border-b border-border/10">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-black">{t('mobileToolbar.moreOptions', 'Меню')}</SheetTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMoreOpen(false)} 
                className="rounded-2xl h-12 w-12 hover:bg-muted/50"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <SheetDescription className="sr-only">{t('mobileToolbar.moreOptions', 'Дополнительные инструменты')}</SheetDescription>
          </SheetHeader>
          
          <div className="p-5 space-y-3 pb-safe overflow-y-auto max-h-[65vh]">
            {moreActions.map((action, index) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={cn(
                  "w-full flex items-center gap-4 p-5 rounded-3xl transition-all duration-300 active:scale-[0.98]",
                  `bg-gradient-to-r ${action.color} border border-border/10 hover:border-border/30`
                )}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className={cn(
                  "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg",
                  "bg-background/90 backdrop-blur-xl",
                  action.iconColor
                )}>
                  <action.icon className="h-7 w-7" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{action.label}</span>
                    {action.badge && (
                      <span className="h-6 px-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{action.description}</span>
                </div>
              </button>
            ))}
            
            {/* Status Section - Premium style */}
            <div className="pt-5 border-t border-border/10 mt-6 space-y-4">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                {t('mobileToolbar.status', 'Статус')}
              </h3>
              
              <div className="flex items-center justify-between p-5 rounded-3xl bg-gradient-to-r from-orange-500/15 to-amber-500/15 border border-orange-500/20">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                    <Flame className="h-6 w-6 text-orange-500" />
                  </div>
                  <span className="text-lg font-bold">{t('streak.title', 'Streak')}</span>
                </div>
                <StreakDisplay userId={userId} compact />
              </div>
              
              <div className="flex items-center justify-between p-5 rounded-3xl bg-gradient-to-r from-primary/15 to-violet-500/15 border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Coins className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-lg font-bold">{t('tokens.title', 'Токены')}</span>
                </div>
                <TokenBalanceDisplay onClick={() => { setMoreOpen(false); onOpenTokens(); }} compact />
              </div>
              
              {/* Language Switcher */}
              <div className="flex items-center justify-between p-5 rounded-3xl bg-muted/30">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-background/80 flex items-center justify-center">
                    <Globe className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <span className="text-lg font-bold">{t('common.language', 'Язык')}</span>
                </div>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});

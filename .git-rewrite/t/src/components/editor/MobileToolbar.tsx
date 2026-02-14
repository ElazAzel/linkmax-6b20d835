import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  achievementCount: number;
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
  achievementCount,
}: MobileToolbarProps) {
  const { t } = useTranslation();
  const [moreOpen, setMoreOpen] = useState(false);

  const mainActions = [
    {
      icon: Save,
      label: t('mobileToolbar.save', 'Сохранить'),
      onClick: onSave,
      disabled: saving,
      variant: 'ghost' as const,
    },
    {
      icon: Eye,
      label: t('mobileToolbar.preview', 'Просмотр'),
      onClick: onPreview,
      variant: 'ghost' as const,
    },
    {
      icon: Upload,
      label: t('mobileToolbar.share', 'Поделиться'),
      onClick: onShare,
      variant: 'default' as const,
      primary: true,
    },
    {
      icon: Settings,
      label: t('mobileToolbar.settings', 'Настройки'),
      onClick: onOpenSettings,
      variant: 'ghost' as const,
    },
    {
      icon: MoreHorizontal,
      label: t('mobileToolbar.more', 'Ещё'),
      onClick: () => setMoreOpen(true),
      variant: 'ghost' as const,
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
    },
    {
      icon: Wand2,
      label: t('mobileToolbar.aiBuilder', 'AI Конструктор'),
      description: t('mobileToolbar.aiBuilderDesc', 'Создать страницу с AI'),
      onClick: () => {
        setMoreOpen(false);
        onOpenAIBuilder();
      },
    },
    {
      icon: LayoutTemplate,
      label: t('mobileToolbar.templates', 'Шаблоны'),
      description: t('mobileToolbar.templatesDesc', 'Готовые шаблоны'),
      onClick: () => {
        setMoreOpen(false);
        onOpenTemplates();
      },
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
    },
    {
      icon: Users,
      label: t('mobileToolbar.crm', 'CRM'),
      description: t('mobileToolbar.crmDesc', 'Управление лидами'),
      onClick: () => {
        setMoreOpen(false);
        onOpenCRM();
      },
    },
  ];

  return (
    <>
      {/* Bottom Toolbar - Premium Mobile-First */}
      <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div className="mx-3 mb-3 bg-card/85 backdrop-blur-2xl border border-border/30 rounded-[28px] shadow-glass-xl overflow-hidden">
          {/* Auto-save indicator - compact */}
          <div className="flex items-center justify-center py-1.5 border-b border-border/15 bg-background/20">
            <AutoSaveIndicator status={saveStatus} />
          </div>
          
          <div className="flex items-center justify-around h-[72px] px-2">
            {mainActions.map((action, index) => (
              <Button
                key={action.label}
                variant={action.primary ? "default" : "ghost"}
                size="lg"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 h-14 px-3 min-w-0 transition-all duration-300 rounded-2xl",
                  action.primary && "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] min-w-[68px]",
                  !action.primary && "hover:bg-muted/50 active:scale-[0.96]",
                  index === 0 && "text-emerald-500",
                  index === 1 && "text-blue-500"
                )}
              >
                <action.icon className={cn("h-5 w-5", action.primary && "h-6 w-6")} />
                <span className={cn("text-[10px] font-bold", action.primary && "text-xs")}>{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* More Sheet - Premium Design */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent 
          side="bottom" 
          className="z-[100] h-auto max-h-[90vh] rounded-t-[32px] p-0 bg-card/95 backdrop-blur-2xl border-t border-border/30 shadow-glass-xl [&>button]:hidden"
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          
          <SheetHeader className="px-6 pb-4 border-b border-border/15">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-black">{t('mobileToolbar.moreOptions', 'Дополнительно')}</SheetTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setMoreOpen(false)} 
                className="rounded-full h-10 w-10 hover:bg-muted/50"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SheetDescription className="sr-only">{t('mobileToolbar.moreOptions', 'Дополнительные инструменты')}</SheetDescription>
          </SheetHeader>
          
          <div className="p-4 space-y-2 pb-safe overflow-y-auto">
            {moreActions.map((action, index) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 active:scale-[0.98]",
                  action.highlight 
                    ? "bg-gradient-to-r from-primary/10 to-violet-500/10 border border-primary/30 hover:border-primary/50" 
                    : "bg-muted/30 hover:bg-muted/50"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center shadow-sm",
                  action.highlight ? "bg-primary/20 text-primary" : "bg-background/80"
                )}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold">{action.label}</span>
                    {action.badge && (
                      <span className="h-5 px-2 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{action.description}</span>
                </div>
              </button>
            ))}
            
            {/* Language Switcher */}
            <div className="pt-4 border-t border-border/20 mt-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-background/80 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="text-base font-bold">{t('common.language', 'Язык')}</span>
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

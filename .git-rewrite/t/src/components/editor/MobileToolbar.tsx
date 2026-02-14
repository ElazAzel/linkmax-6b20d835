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
      {/* Bottom Toolbar - BOLD Mobile-First */}
      <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div className="mx-4 mb-4 bg-card/80 backdrop-blur-2xl border border-border/30 rounded-3xl shadow-glass-xl overflow-hidden">
          {/* Auto-save indicator - top of toolbar */}
          <div className="flex items-center justify-center py-2 border-b border-border/20 bg-background/30">
            <AutoSaveIndicator status={saveStatus} />
          </div>
          <div className="flex items-center justify-around h-20 px-3">
            {mainActions.map((action) => (
              <Button
                key={action.label}
                variant={action.primary ? "default" : "ghost"}
                size="lg"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "flex flex-col items-center gap-1 h-16 px-4 min-w-0 transition-all duration-300 rounded-2xl",
                  action.primary && "bg-primary/90 backdrop-blur-xl text-primary-foreground hover:bg-primary shadow-glass-lg hover:scale-105 min-w-[72px]",
                  !action.primary && "hover:bg-card/60"
                )}
              >
                <action.icon className="h-6 w-6" />
                <span className="text-xs font-bold">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* More Sheet - BOLD Design */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[75vh] rounded-t-[2.5rem] p-0 bg-card/90 backdrop-blur-2xl border-t border-border/30 shadow-glass-xl">
          <SheetHeader className="p-6 pb-4 border-b border-border/20">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-black">{t('mobileToolbar.moreOptions', 'Дополнительно')}</SheetTitle>
              <Button variant="ghost" size="lg" onClick={() => setMoreOpen(false)} className="rounded-2xl hover:bg-card/60 h-12 w-12">
                <X className="h-6 w-6" />
              </Button>
            </div>
            <SheetDescription className="sr-only">{t('mobileToolbar.moreOptions', 'Дополнительные инструменты')}</SheetDescription>
          </SheetHeader>
          
          <div className="p-5 space-y-3 pb-safe">
            {moreActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="w-full flex items-center gap-5 p-5 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/20 hover:bg-card/70 hover:border-border/40 transition-all duration-300 active:scale-[0.98] shadow-glass"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 backdrop-blur-xl border border-primary/20 flex items-center justify-center shadow-glass">
                  <action.icon className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{action.label}</span>
                    {action.badge && (
                      <span className="h-6 px-2.5 rounded-full bg-primary/90 backdrop-blur-xl text-primary-foreground text-sm font-bold flex items-center justify-center shadow-glass">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{action.description}</span>
                </div>
              </button>
            ))}
            
            {/* Language Switcher */}
            <div className="pt-5 border-t border-border/20 mt-5">
              <div className="flex items-center justify-between p-4 rounded-3xl bg-card/50 backdrop-blur-xl border border-border/20">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center">
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

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
import { cn } from '@/lib/utils';

interface MobileToolbarProps {
  saving: boolean;
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
      label: 'Save',
      onClick: onSave,
      disabled: saving,
      variant: 'ghost' as const,
    },
    {
      icon: Eye,
      label: 'Preview',
      onClick: onPreview,
      variant: 'ghost' as const,
    },
    {
      icon: Upload,
      label: 'Share',
      onClick: onShare,
      variant: 'default' as const,
      primary: true,
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: onOpenSettings,
      variant: 'ghost' as const,
    },
    {
      icon: MoreHorizontal,
      label: 'More',
      onClick: () => setMoreOpen(true),
      variant: 'ghost' as const,
    },
  ];

  const moreActions = [
    {
      icon: Wand2,
      label: 'AI Builder',
      description: 'Generate page with AI',
      onClick: () => {
        setMoreOpen(false);
        onOpenAIBuilder();
      },
    },
    {
      icon: LayoutTemplate,
      label: 'Templates',
      description: 'Ready-made templates',
      onClick: () => {
        setMoreOpen(false);
        onOpenTemplates();
      },
    },
    {
      icon: Trophy,
      label: 'Achievements',
      description: 'Your progress',
      onClick: () => {
        setMoreOpen(false);
        onOpenAchievements();
      },
      badge: achievementCount > 0 ? achievementCount : undefined,
    },
    {
      icon: Users,
      label: 'CRM',
      description: 'Manage your leads',
      onClick: () => {
        setMoreOpen(false);
        onOpenCRM();
      },
    },
  ];

  return (
    <>
      {/* Bottom Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t shadow-lg safe-area-bottom">
        <div className="flex items-center justify-around h-16 px-2">
          {mainActions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className={cn(
                "flex flex-col items-center gap-0.5 h-14 px-3 min-w-0",
                action.primary && "bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
              )}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* More Sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-3xl p-0">
          <SheetHeader className="p-4 pb-2 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>More Options</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setMoreOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SheetDescription className="sr-only">Additional tools and features</SheetDescription>
          </SheetHeader>
          
          <div className="p-4 space-y-2 pb-safe">
            {moreActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors active:scale-[0.98]"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <action.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{action.label}</span>
                    {action.badge && (
                      <span className="h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{action.description}</span>
                </div>
              </button>
            ))}
            
            {/* Language Switcher */}
            <div className="pt-4 border-t mt-4">
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Language</span>
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

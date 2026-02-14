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
  Grid3X3,
  List,
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
import type { EditorMode } from '@/types/page';

interface MobileToolbarProps {
  saving: boolean;
  saveStatus: SaveStatus;
  editorMode: EditorMode;
  onSave: () => void;
  onPreview: () => void;
  onShare: () => void;
  onOpenSettings: () => void;
  onOpenAIBuilder: () => void;
  onOpenTemplates: () => void;
  onOpenAchievements: () => void;
  onOpenCRM: () => void;
  onToggleEditorMode: () => void;
  achievementCount: number;
}

export const MobileToolbar = memo(function MobileToolbar({
  saving,
  saveStatus,
  editorMode,
  onSave,
  onPreview,
  onShare,
  onOpenSettings,
  onOpenAIBuilder,
  onOpenTemplates,
  onOpenAchievements,
  onOpenCRM,
  onToggleEditorMode,
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

  const isGridMode = editorMode === 'grid';

  const moreActions = [
    {
      icon: isGridMode ? List : Grid3X3,
      label: isGridMode ? 'Linear Mode' : 'Grid Mode',
      description: isGridMode ? 'Switch to linear layout' : 'Switch to grid layout',
      onClick: () => {
        setMoreOpen(false);
        onToggleEditorMode();
      },
    },
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
      {/* Bottom Toolbar - Liquid Glass */}
      <div className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
        <div className="mx-3 mb-3 bg-card/70 backdrop-blur-2xl border border-border/30 rounded-2xl shadow-glass-xl overflow-hidden">
          {/* Auto-save indicator - top of toolbar */}
          <div className="flex items-center justify-center py-1.5 border-b border-border/20 bg-background/30">
            <AutoSaveIndicator status={saveStatus} />
          </div>
          <div className="flex items-center justify-around h-16 px-2">
            {mainActions.map((action) => (
              <Button
                key={action.label}
                variant={action.primary ? "default" : "ghost"}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className={cn(
                  "flex flex-col items-center gap-0.5 h-14 px-3 min-w-0 transition-all duration-300",
                  action.primary && "bg-primary/90 backdrop-blur-xl text-primary-foreground hover:bg-primary shadow-glass-lg rounded-xl hover:scale-105",
                  !action.primary && "hover:bg-card/60 rounded-xl"
                )}
              >
                <action.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* More Sheet - Liquid Glass */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-[2rem] p-0 bg-card/80 backdrop-blur-2xl border-t border-border/30 shadow-glass-xl">
          <SheetHeader className="p-5 pb-3 border-b border-border/20">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-semibold">More Options</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setMoreOpen(false)} className="rounded-full hover:bg-card/60">
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
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/20 hover:bg-card/60 hover:border-border/40 transition-all duration-300 active:scale-[0.98] shadow-glass"
              >
                <div className="h-12 w-12 rounded-2xl bg-primary/10 backdrop-blur-xl border border-primary/20 flex items-center justify-center shadow-glass">
                  <action.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{action.label}</span>
                    {action.badge && (
                      <span className="h-5 px-2 rounded-full bg-primary/90 backdrop-blur-xl text-primary-foreground text-xs font-bold flex items-center justify-center shadow-glass">
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
              <div className="flex items-center justify-between p-3 rounded-2xl bg-card/40 backdrop-blur-xl border border-border/20">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  </div>
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

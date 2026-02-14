import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AutoSaveIndicator, SaveStatus } from '@/components/editor/AutoSaveIndicator';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { EditorModeToggle } from '@/components/editor/EditorModeToggle';
import { StreakDisplay } from '@/components/streak/StreakDisplay';
import type { EditorMode } from '@/types/page';
import {
  LogOut,
  Save,
  Eye,
  Upload,
  Wand2,
  MessageCircle,
  LayoutTemplate,
  Trophy,
  Users,
} from 'lucide-react';

interface DashboardHeaderProps {
  saving: boolean;
  saveStatus: SaveStatus;
  achievementCount: number;
  showSettings: boolean;
  editorMode: EditorMode;
  onToggleEditorMode: () => void;
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
}

export function DashboardHeader({
  saving,
  saveStatus,
  achievementCount,
  showSettings,
  editorMode,
  onToggleEditorMode,
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
}: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 hidden md:block">
      <div className="mx-4 mt-3">
        <div className="backdrop-blur-2xl bg-card/50 border border-border/30 rounded-2xl shadow-glass-lg">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-2">
            {/* Logo */}
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg" />
                <img
                  src="/pwa-maskable-512x512.png"
                  alt="LinkMAX"
                  className="relative h-8 w-8 animate-scale-in hover-scale rounded-xl"
                />
              </div>
              <h1 className="text-xl font-bold text-primary">LinkMAX</h1>
              <AutoSaveIndicator status={saveStatus} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onOpenAIBuilder}>
                <Wand2 className="h-4 w-4 mr-2" />
                AI Builder
              </Button>

              <Button variant="ghost" size="sm" onClick={onOpenTemplates}>
                <LayoutTemplate className="h-4 w-4 mr-2" />
                Templates
              </Button>

              <EditorModeToggle
                currentMode={editorMode}
                onToggle={onToggleEditorMode}
              />

              {/* Compact Streak */}
              <StreakDisplay userId={userId} compact />

              <LanguageSwitcher />

              <Button
                variant={showSettings ? 'default' : 'ghost'}
                size="sm"
                onClick={onToggleSettings}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Settings
              </Button>

              <Button variant="ghost" size="sm" onClick={onOpenCRM}>
                <Users className="h-4 w-4 mr-2" />
                CRM
              </Button>

              <Button variant="ghost" size="sm" onClick={onOpenGallery}>
                <Users className="h-4 w-4 mr-2" />
                Gallery
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenAchievements}
                className="relative"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Achievements
                {achievementCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                    {achievementCount}
                  </span>
                )}
              </Button>

              <div className="h-6 w-px bg-border/50" />

              <Button variant="outline" size="sm" onClick={onSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>

              <Button variant="outline" size="sm" onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>

              <Button size="sm" onClick={onShare} data-onboarding="share-button">
                <Upload className="h-4 w-4 mr-2" />
                Share
              </Button>

              <div className="h-6 w-px bg-border/50" />

              <Button
                variant="ghost"
                size="sm"
                onClick={onSignOut}
                className="hover:bg-destructive/10 hover:text-destructive"
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

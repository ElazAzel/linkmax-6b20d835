/**
 * EditorScreen - Page editor with block management
 * Mobile-first design with GridEditor and block editing capabilities
 */
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import Undo2 from 'lucide-react/dist/esm/icons/undo-2';
import Redo2 from 'lucide-react/dist/esm/icons/redo-2';
import History from 'lucide-react/dist/esm/icons/history';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb';
import X from 'lucide-react/dist/esm/icons/x';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '../layout/DashboardHeader';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { GridEditor } from '@/components/editor/GridEditor';
import { cn } from '@/lib/utils/utils';
import { usePageIntelligence } from '@/hooks/editor/usePageIntelligence';
import type { PageData, Block, ProfileBlock } from '@/types/page';
import type { FreeTier } from '@/hooks/user/useFreemiumLimits';
import type { PremiumTier } from '@/hooks/user/usePremiumStatus';

interface EditorScreenProps {
  pageData: PageData | null;
  loading: boolean;
  isPremium: boolean;
  currentTier?: FreeTier;
  premiumTier?: PremiumTier;
  onInsertBlock: (blockType: string, position: number) => { success: boolean; blockId?: string; error?: string };
  onEditBlock: (block: Block) => void;
  onDeleteBlock: (blockId: string) => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  onReorderBlocks: (blocks: Block[]) => void;
  onDuplicateBlock?: (id: string) => void;
  onPreview: () => void;
  onShare: () => void;
  onOpenTemplates: () => void;
  onOpenAI: () => void;
  // Undo/Redo
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  // Versions
  onOpenVersions?: () => void;
}

export const EditorScreen = memo(function EditorScreen({
  pageData,
  loading,
  isPremium,
  currentTier = 'identity',
  premiumTier,
  onInsertBlock,
  onEditBlock,
  onDeleteBlock,
  onUpdateBlock,
  onReorderBlocks,
  onDuplicateBlock,
  onPreview,
  onShare,
  onOpenTemplates,
  onOpenAI,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onOpenVersions,
}: EditorScreenProps) {
  const { t } = useTranslation();
  const [dismissedHint, setDismissedHint] = useState<string | null>(null);

  // Intelligence layer — pure computation, <1ms
  const intelligence = usePageIntelligence(pageData, pageData?.niche);

  if (loading || !pageData) {
    return <LoadingSkeleton />;
  }

  const isPublished = pageData.isPublished || false;
  const blockCount = pageData.blocks.length;

  // Count non-profile blocks to determine if user is experienced
  const contentBlockCount = pageData.blocks.filter(b => b.type !== 'profile').length;

  // Page has content if it has more than just a profile block
  const hasContent = pageData.blocks.length > 1 ||
    (pageData.blocks.length === 1 && pageData.blocks[0].type !== 'profile');

  // Show AI builder only for new users (less than 2 content blocks)
  const showAIBuilder = contentBlockCount < 2;

  return (
    <div className="min-h-screen safe-area-top">
      {/* Header with actions */}
      <div className="sticky top-0 z-40 glass-nav border-b border-white/10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-gradient truncate">
                {t('dashboard.editor.title', 'Редактор')}
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  {blockCount} {t('dashboard.editor.blocks', 'блоков')}
                </p>
              </div>
            </div>

            {/* Center: Undo/Redo */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl"
                onClick={onPreview}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className={cn(
                  "h-9 rounded-xl font-semibold px-4",
                  !isPublished && "bg-primary hover:bg-primary/90 text-primary-foreground"
                )}
                onClick={onShare}
              >
                <Share2 className="h-4 w-4 mr-1.5" />
                {isPublished ? t('editor.share', 'Поделиться') : t('editor.publish', 'Опубликовать')}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick tools bar */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-t border-border/5">
          {/* Show templates only for pages without content */}
          {!hasContent && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl shrink-0 gap-1.5"
              onClick={onOpenTemplates}
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              {t('editor.templates', 'Шаблоны')}
            </Button>
          )}

          {/* Show version history for pages with content */}
          {hasContent && onOpenVersions && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl shrink-0 gap-1.5"
              onClick={onOpenVersions}
            >
              <History className="h-3.5 w-3.5" />
              {t('editor.versions', 'История')}
            </Button>
          )}

        </div>
      </div>

      {/* Intelligence hint banner */}
      {intelligence && intelligence.nextActions.length > 0 && (() => {
        const top = intelligence.nextActions.find((a) => a.id !== dismissedHint);
        if (!top) return null;
        return (
          <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
            <Lightbulb className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs text-foreground/80 flex-1 truncate">
              {t(top.titleKey, top.actionType.replace(/_/g, ' '))}
            </span>
            <Badge variant="outline" className="text-[9px] shrink-0">
              {top.priority}
            </Badge>
            <button
              onClick={() => setDismissedHint(top.id)}
              className="p-0.5 rounded hover:bg-muted"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        );
      })()}

      {/* Grid Editor */}
      <div className="pt-4">
        <GridEditor
          blocks={pageData.blocks}
          isPremium={isPremium}
          currentTier={currentTier}
          premiumTier={premiumTier}
          gridConfig={pageData.gridConfig}
          onInsertBlock={onInsertBlock}
          onEditBlock={onEditBlock}
          onDeleteBlock={onDeleteBlock}
          onUpdateBlock={onUpdateBlock}
          onReorderBlocks={onReorderBlocks}
          onDuplicateBlock={onDuplicateBlock}
        />
      </div>
    </div>
  );
});

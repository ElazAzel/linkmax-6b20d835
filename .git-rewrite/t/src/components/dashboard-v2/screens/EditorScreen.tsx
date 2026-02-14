/**
 * EditorScreen - Page editor with block management
 * Mobile-first design with GridEditor and block editing capabilities
 */
import { memo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Share2, Sparkles, LayoutTemplate, Undo2, Redo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '../layout/DashboardHeader';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { GridEditor } from '@/components/editor/GridEditor';
import { cn } from '@/lib/utils';
import type { PageData, Block, ProfileBlock } from '@/types/page';
import type { FreeTier } from '@/hooks/useFreemiumLimits';
import type { PremiumTier } from '@/hooks/usePremiumStatus';

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
  onPreview: () => void;
  onShare: () => void;
  onOpenTemplates: () => void;
  onOpenAI: () => void;
  // Undo/Redo
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const EditorScreen = memo(function EditorScreen({
  pageData,
  loading,
  isPremium,
  currentTier = 'free',
  premiumTier,
  onInsertBlock,
  onEditBlock,
  onDeleteBlock,
  onUpdateBlock,
  onReorderBlocks,
  onPreview,
  onShare,
  onOpenTemplates,
  onOpenAI,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: EditorScreenProps) {
  const { t } = useTranslation();

  if (loading || !pageData) {
    return <LoadingSkeleton />;
  }

  const isPublished = pageData.isPublished || false;
  const blockCount = pageData.blocks.length;

  return (
    <div className="min-h-screen safe-area-top">
      {/* Header with actions */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Title */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">
                {t('dashboard.editor.title', 'Редактор')}
              </h1>
              <p className="text-xs text-muted-foreground">
                {blockCount} {t('dashboard.editor.blocks', 'блоков')}
              </p>
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
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-xl shrink-0 gap-1.5"
            onClick={onOpenTemplates}
          >
            <LayoutTemplate className="h-3.5 w-3.5" />
            {t('editor.templates', 'Шаблоны')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-xl shrink-0 gap-1.5"
            onClick={onOpenAI}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {t('editor.aiGenerate', 'AI')}
          </Button>
        </div>
      </div>

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
        />
      </div>
    </div>
  );
});

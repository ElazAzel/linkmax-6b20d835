/**
 * EditorTab - Main editor view with block canvas
 * Features: undo/redo, unified block manager, floating toolbar, auto-translate
 */
import { memo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Undo2,
  Redo2,
  Plus,
  Layers,
  Eye,
  Upload,
  Wand2,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PreviewEditor } from '@/components/editor/PreviewEditor';
import { BlockManager } from '@/components/editor/BlockManager';
import { BlockInsertButton } from '@/components/editor/BlockInsertButton';
import { AutoSaveIndicator, type SaveStatus } from '@/components/editor/AutoSaveIndicator';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Block, GridConfig } from '@/types/page';
import type { FreeTier } from '@/hooks/useFreemiumLimits';
import type { PremiumTier } from '@/hooks/usePremiumStatus';
import type { EditorHistoryType } from '@/hooks/useEditorHistory';

interface EditorTabProps {
  blocks: Block[];
  isPremium: boolean;
  currentTier?: FreeTier;
  premiumTier?: PremiumTier;
  gridConfig?: GridConfig;
  saving: boolean;
  saveStatus: SaveStatus;
  editorHistory: EditorHistoryType;
  pageNiche?: string;
  onInsertBlock: (blockType: string, position: number) => void;
  onEditBlock: (block: Block) => void;
  onDeleteBlock: (id: string) => void;
  onReorderBlocks: (blocks: Block[]) => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  onSave: () => void;
  onPreview: () => void;
  onShare: () => void;
  onOpenAI: () => void;
  onOpenTemplates: () => void;
}

export const EditorTab = memo(function EditorTab({
  blocks,
  isPremium,
  currentTier = 'free',
  premiumTier,
  gridConfig,
  saving,
  saveStatus,
  editorHistory,
  pageNiche,
  onInsertBlock,
  onEditBlock,
  onDeleteBlock,
  onReorderBlocks,
  onUpdateBlock,
  onSave,
  onPreview,
  onShare,
  onOpenAI,
  onOpenTemplates,
}: EditorTabProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { currentLanguage, isTranslating, translateBlocksToLanguage, autoTranslateEnabled } = useLanguage();
  
  // UI State
  const [showBlockManager, setShowBlockManager] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');

  // Auto-translate blocks when language changes
  useEffect(() => {
    if (!autoTranslateEnabled || blocks.length === 0) return;

    translateBlocksToLanguage(blocks, currentLanguage).then((translatedBlocks) => {
      if (translatedBlocks !== blocks) {
        onReorderBlocks(translatedBlocks);
      }
    });
  }, [autoTranslateEnabled, blocks, currentLanguage, onReorderBlocks, translateBlocksToLanguage]);

  // Handle undo with toast
  const handleUndo = useCallback(() => {
    if (editorHistory.canUndo) {
      editorHistory.undo();
      toast.success(t('editor.undone', 'Отменено'), {
        action: {
          label: t('editor.redo', 'Повторить'),
          onClick: () => editorHistory.redo(),
        },
      });
    }
  }, [editorHistory, t]);

  // Handle redo with toast
  const handleRedo = useCallback(() => {
    if (editorHistory.canRedo) {
      editorHistory.redo();
      toast.success(t('editor.redone', 'Повторено'), {
        action: {
          label: t('editor.undo', 'Отменить'),
          onClick: () => editorHistory.undo(),
        },
      });
    }
  }, [editorHistory, t]);

  // Handle insert block
  const handleInsertBlock = useCallback((blockType: string) => {
    onInsertBlock(blockType, blocks.length);
    setShowAddBlock(false);
  }, [onInsertBlock, blocks.length]);

  // Handle delete with history
  const handleDeleteBlock = useCallback((id: string) => {
    onDeleteBlock(id);
    toast.success(t('editor.blockDeleted', 'Блок удалён'), {
      action: {
        label: t('editor.undo', 'Отменить'),
        onClick: handleUndo,
      },
    });
  }, [onDeleteBlock, t, handleUndo]);

  // Handle reorder
  const handleReorderBlocks = useCallback((newBlocks: Block[]) => {
    onReorderBlocks(newBlocks);
  }, [onReorderBlocks]);

  // Handle block select from manager
  const handleBlockSelect = useCallback((blockId: string) => {
    const element = document.querySelector(`[data-block-id="${blockId}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      onEditBlock(block);
    }
  }, [blocks, onEditBlock]);

  // Handle duplicate
  const handleDuplicate = useCallback((blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      const index = blocks.indexOf(block);
      onInsertBlock(block.type, index + 1);
      toast.success(t('editor.blockDuplicated', 'Блок дублирован'));
    }
  }, [blocks, onInsertBlock, t]);

  return (
    <div className="min-h-screen safe-area-top relative">
      {/* Top Toolbar - Fixed */}
      <header className="sticky top-0 z-40 glass-nav">
        <div className="flex items-center justify-between px-3 py-2">
          {/* Left: Undo/Redo */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-xl transition-all",
                editorHistory.canUndo && "bg-muted/50"
              )}
              onClick={handleUndo}
              disabled={!editorHistory.canUndo}
            >
              <Undo2 className="h-4.5 w-4.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-10 w-10 rounded-xl transition-all",
                editorHistory.canRedo && "bg-muted/50"
              )}
              onClick={handleRedo}
              disabled={!editorHistory.canRedo}
            >
              <Redo2 className="h-4.5 w-4.5" />
            </Button>
            
            {/* History indicator */}
            {editorHistory.historyLength > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                {editorHistory.currentIndex + 1}/{editorHistory.historyLength}
              </Badge>
            )}
          </div>

          {/* Center: Save status + Desktop Preview Toggle (desktop only) */}
          <div className="flex items-center gap-2">
            <AutoSaveIndicator status={saveStatus} />
            
            {/* Desktop preview mode toggle - only on desktop */}
            {!isMobile && (
              <div className="flex items-center gap-0.5 bg-muted/50 rounded-xl p-0.5">
                <Button
                  variant={previewMode === 'mobile' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setPreviewMode('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'desktop' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setPreviewMode('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Right: Language Switcher + Block Manager + Templates */}
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={onOpenTemplates}
            >
              <Wand2 className="h-4.5 w-4.5 text-violet-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => setShowBlockManager(true)}
            >
              <Layers className="h-4.5 w-4.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Canvas */}
      <div className={cn(
        "pb-32",
        !isMobile && previewMode === 'mobile' && "max-w-md mx-auto"
      )}>
        <PreviewEditor
          blocks={blocks}
          isPremium={isPremium}
          currentTier={currentTier}
          premiumTier={premiumTier}
          gridConfig={gridConfig}
          onInsertBlock={onInsertBlock}
          onEditBlock={onEditBlock}
          onDeleteBlock={handleDeleteBlock}
          onReorderBlocks={handleReorderBlocks}
          onUpdateBlock={onUpdateBlock}
        />
      </div>

      {/* Floating Bottom Toolbar */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-3">
        <div className={cn(
          "mx-auto",
          !isMobile && previewMode === 'mobile' ? "max-w-md" : "max-w-2xl"
        )}>
          <div className="flex items-center justify-between gap-1.5 p-1.5 rounded-[20px] bg-card/92 backdrop-blur-2xl border border-border/15 shadow-2xl">
            {/* Add Block - Primary */}
            <Button
              size="lg"
              className="flex-1 h-12 rounded-2xl text-sm font-bold shadow-md shadow-primary/20"
              onClick={() => setShowAddBlock(true)}
            >
              <Plus className="h-4.5 w-4.5 mr-1.5" />
              {t('editor.addBlock', 'Добавить')}
            </Button>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="secondary"
                size="icon"
                className="h-12 w-12 rounded-2xl"
                onClick={onOpenAI}
              >
                <Wand2 className="h-4.5 w-4.5 text-violet-500" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-12 w-12 rounded-2xl"
                onClick={onPreview}
              >
                <Eye className="h-4.5 w-4.5 text-blue-500" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="h-12 w-12 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25"
                onClick={onShare}
              >
                <Upload className="h-4.5 w-4.5 text-emerald-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Block Manager */}
      <BlockManager
        open={showBlockManager}
        onOpenChange={setShowBlockManager}
        blocks={blocks}
        onBlockSelect={handleBlockSelect}
        onBlockHide={(blockId) => {
          toast.success(t('editor.blockHidden', 'Блок скрыт'));
        }}
        onBlockDuplicate={handleDuplicate}
        onBlockDelete={handleDeleteBlock}
        onReorder={handleReorderBlocks}
      />

      {/* Add Block Sheet */}
      <BlockInsertButton
        onInsert={handleInsertBlock}
        isPremium={isPremium}
        currentTier={currentTier}
        currentBlockCount={blocks.length}
        pageNiche={pageNiche}
        existingBlocks={blocks.map(b => b.type)}
        isOpen={showAddBlock}
        onOpenChange={setShowAddBlock}
        hideTrigger
      />
    </div>
  );
});

/**
 * EditorScreen - Page editor with block management
 * Mobile-first design with GridEditor and block editing capabilities
 * P5: Structure view, review modes, friction recovery, sections wired
 */
import { memo, useCallback, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import LayoutTemplate from 'lucide-react/dist/esm/icons/layout-template';
import Undo2 from 'lucide-react/dist/esm/icons/undo-2';
import Redo2 from 'lucide-react/dist/esm/icons/redo-2';
import History from 'lucide-react/dist/esm/icons/history';
import Lightbulb from 'lucide-react/dist/esm/icons/lightbulb';
import Layers from 'lucide-react/dist/esm/icons/layers';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import MousePointerClick from 'lucide-react/dist/esm/icons/mouse-pointer-click';
import X from 'lucide-react/dist/esm/icons/x';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '../layout/DashboardHeader';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { GridEditor } from '@/components/editor/GridEditor';
import { StructureView } from '@/components/editor/StructureView';
import { cn } from '@/lib/utils/utils';
import { usePageIntelligence } from '@/hooks/editor/usePageIntelligence';
import { useFrictionRecovery } from '@/hooks/editor/useFrictionRecovery';
import { useEditorStore } from '@/store/useEditorStore';
import { dissolveSection, deleteSection, duplicateSection } from '@/lib/editor/section-engine';
import { trackEditorAction } from '@/lib/editor/editor-analytics';
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
  const [structureOpen, setStructureOpen] = useState(false);

  // P5: Store state for sections & review
  const {
    sectionMeta,
    collapsedSections,
    toggleSectionCollapse,
    setSectionMeta,
    removeSectionMeta,
    reviewMode,
    setReviewMode,
  } = useEditorStore();

  // Intelligence layer — pure computation, <1ms
  const intelligence = usePageIntelligence(pageData, pageData?.niche);

  // P5: Friction recovery
  const { signal: frictionSignal, pushEvent: pushFrictionEvent, dismiss: dismissFriction, accept: acceptFriction } = useFrictionRecovery();

  // P5: Wrapped handlers that feed friction detector
  const handleInsertBlockWithFriction = useCallback((blockType: string, position: number) => {
    const result = onInsertBlock(blockType, position);
    pushFrictionEvent('block_added', blockType);
    return result;
  }, [onInsertBlock, pushFrictionEvent]);

  const handleDeleteBlockWithFriction = useCallback((blockId: string) => {
    const block = pageData?.blocks.find(b => b.id === blockId);
    onDeleteBlock(blockId);
    pushFrictionEvent('block_deleted', block?.type);
  }, [onDeleteBlock, pushFrictionEvent, pageData]);

  const handleUndoWithFriction = useCallback(() => {
    onUndo?.();
    pushFrictionEvent('undo');
  }, [onUndo, pushFrictionEvent]);

  const handleRedoWithFriction = useCallback(() => {
    onRedo?.();
    pushFrictionEvent('redo');
  }, [onRedo, pushFrictionEvent]);

  // P5: Block move handlers for StructureView
  const handleBlockMoveUp = useCallback((blockId: string) => {
    if (!pageData) return;
    const idx = pageData.blocks.findIndex(b => b.id === blockId);
    if (idx <= 0) return;
    // Don't swap past profile block
    if (pageData.blocks[idx - 1].type === 'profile') return;
    const newBlocks = [...pageData.blocks];
    [newBlocks[idx - 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx - 1]];
    onReorderBlocks(newBlocks);
  }, [pageData, onReorderBlocks]);

  const handleBlockMoveDown = useCallback((blockId: string) => {
    if (!pageData) return;
    const idx = pageData.blocks.findIndex(b => b.id === blockId);
    if (idx < 0 || idx >= pageData.blocks.length - 1) return;
    const newBlocks = [...pageData.blocks];
    [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
    onReorderBlocks(newBlocks);
  }, [pageData, onReorderBlocks]);

  // P5: Section handlers for StructureView
  const handleDissolveSection = useCallback((sectionId: string) => {
    if (!pageData) return;
    const newBlocks = dissolveSection(pageData.blocks, sectionId);
    onReorderBlocks(newBlocks);
    removeSectionMeta(sectionId);
    trackEditorAction('section_dissolved', { source: 'structure' });
  }, [pageData, onReorderBlocks, removeSectionMeta]);

  const handleDeleteSection = useCallback((sectionId: string) => {
    if (!pageData) return;
    const newBlocks = deleteSection(pageData.blocks, sectionId);
    onReorderBlocks(newBlocks);
    removeSectionMeta(sectionId);
    trackEditorAction('section_deleted', { source: 'structure' });
  }, [pageData, onReorderBlocks, removeSectionMeta]);

  const handleDuplicateSection = useCallback((sectionId: string) => {
    if (!pageData) return;
    const result = duplicateSection(pageData.blocks, sectionId);
    onReorderBlocks(result.blocks);
    const originalMeta = sectionMeta.get(sectionId);
    if (originalMeta) {
      setSectionMeta(result.newSectionId, {
        ...originalMeta,
        id: result.newSectionId,
        label: `${originalMeta.label} (copy)`,
        createdAt: Date.now(),
      });
    }
    trackEditorAction('section_duplicated', { source: 'structure' });
  }, [pageData, onReorderBlocks, sectionMeta, setSectionMeta]);

  const handleRenameSection = useCallback((sectionId: string, label: string) => {
    const existing = sectionMeta.get(sectionId);
    if (existing) {
      setSectionMeta(sectionId, { ...existing, label });
    } else {
      setSectionMeta(sectionId, { id: sectionId, label, collapsed: false, createdAt: Date.now() });
    }
  }, [sectionMeta, setSectionMeta]);

  // P5: Review mode toggle
  const toggleReviewMode = useCallback((mode: 'problematic' | 'cta_contact') => {
    setReviewMode(reviewMode === mode ? 'normal' : mode);
    trackEditorAction(reviewMode === mode ? 'review_mode_exited' : 'review_mode_entered', { source: 'toolbar' });
  }, [reviewMode, setReviewMode]);

  // Friction action handler
  const handleFrictionAction = useCallback(() => {
    if (!frictionSignal) return;
    acceptFriction();
    if (frictionSignal.suggestedActionKey === 'open_structure_view') {
      setStructureOpen(true);
    } else if (frictionSignal.suggestedActionKey === 'review_mode') {
      setReviewMode('problematic');
    }
  }, [frictionSignal, acceptFriction, setReviewMode]);

  if (loading || !pageData) {
    return <LoadingSkeleton />;
  }

  const isPublished = pageData.isPublished || false;
  const blockCount = pageData.blocks.length;
  const contentBlockCount = pageData.blocks.filter(b => b.type !== 'profile').length;
  const hasContent = pageData.blocks.length > 1 ||
    (pageData.blocks.length === 1 && pageData.blocks[0].type !== 'profile');

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
                onClick={handleUndoWithFriction}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-xl"
                onClick={handleRedoWithFriction}
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

          {/* P5: Structure View button */}
          {hasContent && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl shrink-0 gap-1.5"
              onClick={() => setStructureOpen(true)}
            >
              <Layers className="h-3.5 w-3.5" />
              {t('editor.structure', 'Структура')}
            </Button>
          )}

          {/* P5: Review mode filter chips */}
          {hasContent && (
            <>
              <Button
                variant={reviewMode === 'problematic' ? 'default' : 'outline'}
                size="sm"
                className="h-8 rounded-xl shrink-0 gap-1.5"
                onClick={() => toggleReviewMode('problematic')}
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {t('editor.problematic', 'Проблемные')}
              </Button>
              <Button
                variant={reviewMode === 'cta_contact' ? 'default' : 'outline'}
                size="sm"
                className="h-8 rounded-xl shrink-0 gap-1.5"
                onClick={() => toggleReviewMode('cta_contact')}
              >
                <MousePointerClick className="h-3.5 w-3.5" />
                {t('editor.cta', 'CTA')}
              </Button>
            </>
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

      {/* P5: Friction recovery hint */}
      {frictionSignal && (
        <div className="mx-4 mt-2 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <Lightbulb className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-xs text-foreground/80 flex-1">
            {t(`friction.${frictionSignal.suggestedActionKey}`, frictionSignal.suggestedAction)}
          </span>
          <button
            onClick={handleFrictionAction}
            className="text-xs font-semibold text-primary hover:underline shrink-0"
          >
            {t('friction.try', 'Попробовать')}
          </button>
          <button
            onClick={dismissFriction}
            className="p-0.5 rounded hover:bg-muted shrink-0"
          >
            <X className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      )}

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

      {/* P5: Structure View 2.0 */}
      <StructureView
        open={structureOpen}
        onOpenChange={setStructureOpen}
        blocks={pageData.blocks}
        onBlockSelect={(blockId) => {
          setStructureOpen(false);
          onEditBlock(pageData.blocks.find(b => b.id === blockId) || pageData.blocks[0]);
        }}
        onBlockDuplicate={onDuplicateBlock}
        onBlockDelete={onDeleteBlock}
        sectionMeta={sectionMeta}
        collapsedSections={collapsedSections}
        onToggleSectionCollapse={toggleSectionCollapse}
        onDissolveSection={handleDissolveSection}
        onDeleteSection={handleDeleteSection}
        onDuplicateSection={handleDuplicateSection}
        onRenameSection={handleRenameSection}
        blockQuality={intelligence?.blockQuality}
        reviewMode={reviewMode}
        onSetReviewMode={setReviewMode}
      />
    </div>
  );
});

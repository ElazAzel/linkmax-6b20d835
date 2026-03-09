import { memo, useCallback, useState, useMemo, useId } from 'react';
import { useTranslation } from 'react-i18next';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Copy from 'lucide-react/dist/esm/icons/copy';
import FlaskConical from 'lucide-react/dist/esm/icons/flask-conical';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { BlockRenderer } from '@/components/editor/BlockRenderer';
import { BlockInsertButton } from './BlockInsertButton';
import { InlineProfileEditor } from '../blocks/InlineProfileEditor';
import { InlineTextEditor } from './InlineTextEditor';
import { BulkActionBar } from './BulkActionBar';
import { useIsMobile } from '@/hooks/ui/use-mobile';
import { useEditorStore } from '@/store/useEditorStore';
import { ExperimentSetupDialog } from '@/components/dashboard-v2/dialogs/ExperimentSetupDialog';
import { selectRange } from '@/lib/editor/selection-engine';
import { bulkDelete, bulkDuplicate, bulkMoveUp, bulkMoveDown } from '@/lib/editor/bulk-actions';
import { copyBlock } from '@/lib/editor/clipboard-engine';
import { supportsInlineEdit } from '@/lib/editor/inline-edit-config';
import { trackEditorAction } from '@/lib/editor/editor-analytics';
import { cn } from '@/lib/utils/utils';
import { BLOCK_MANIFEST } from '@/lib/blocks/block-manifest';
import type { Block, ProfileBlock, GridConfig, BlockType } from '@/types/page';
import { BLOCK_SIZE_DIMENSIONS } from '@/types/blocks/base';
import type { FreeTier } from '@/hooks/user/useFreemiumLimits';
import type { PremiumTier } from '@/hooks/user/usePremiumStatus';
import { motion } from 'framer-motion';

// ─── Insert-Between Divider ────────────────────────────────────────
function InsertBetweenDivider({
  position,
  onInsert,
  isPremium,
  currentTier,
  currentBlockCount,
  isMobile,
}: {
  position: number;
  onInsert: (blockType: string, position: number) => void;
  isPremium: boolean;
  currentTier: FreeTier;
  currentBlockCount: number;
  isMobile: boolean;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleInsert = useCallback((blockType: string) => {
    onInsert(blockType, position);
  }, [onInsert, position]);

  return (
    <div className="relative group/divider py-1 col-span-2">
      <div className={cn(
        "flex items-center gap-2 transition-all duration-300",
        isMobile ? "opacity-100" : "opacity-0 group-hover/divider:opacity-100"
      )}>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className={cn(
            "shrink-0 flex items-center justify-center rounded-full transition-all duration-300",
            "glass-subtle bg-primary/10 hover:bg-primary hover:text-primary-foreground border-white/20 shadow-lg shadow-primary/10",
            "active:scale-95 hover:scale-110",
            isMobile ? "h-8 w-8" : "h-7 w-7"
          )}
          aria-label="Insert block here"
        >
          <Plus className={isMobile ? "h-5 w-5" : "h-4 w-4"} strokeWidth={3} />
        </button>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      <BlockInsertButton
        onInsert={handleInsert}
        isPremium={isPremium}
        currentTier={currentTier}
        currentBlockCount={currentBlockCount}
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        hideTrigger
      />
    </div>
  );
}


interface GridEditorProps {
  blocks: Block[];
  isPremium: boolean;
  currentTier?: FreeTier;
  premiumTier?: PremiumTier;
  gridConfig?: GridConfig;
  onInsertBlock: (blockType: string, position: number) => void;
  onEditBlock: (block: Block) => void;
  onDeleteBlock: (id: string) => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  onReorderBlocks?: (blocks: Block[]) => void;
  onDuplicateBlock?: (id: string) => void;
}

interface SortableGridBlockItemProps {
  block: Block;
  onEdit: (block: Block) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onUpdateBlock?: (id: string, updates: Partial<Block>) => void;
  isPremium?: boolean;
  premiumTier?: PremiumTier;
  isDragging?: boolean;
  isMobile?: boolean;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  onStartExperiment?: (block: Block) => void;
  onBlockClick?: (block: Block, e: React.MouseEvent) => void;
  onBlockDoubleClick?: (block: Block) => void;
}

function SortableGridBlockItem({
  block,
  onEdit,
  onDelete,
  onDuplicate,
  onUpdateBlock,
  isPremium,
  premiumTier,
  isMobile = false,
  isSelected = false,
  isMultiSelected = false,
  onStartExperiment,
  onBlockClick,
  onBlockDoubleClick,
}: SortableGridBlockItemProps) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const blockSize = block.blockSize || 'small';
  const dimensions = BLOCK_SIZE_DIMENSIONS[blockSize] || BLOCK_SIZE_DIMENSIONS['small'];
  const colSpanClass = dimensions.gridCols === 2 ? 'col-span-2' : 'col-span-1';
  const rowSpanClass = dimensions.gridRows === 2 ? 'row-span-2' : 'row-span-1';
  const isFrameless = block.type === 'separator' || block.type === 'socials';

  // Get block type label from manifest
  const manifest = BLOCK_MANIFEST[block.type as BlockType];
  const typeLabel = manifest ? t(manifest.labelKey, block.type) : block.type;

  const selected = isSelected || isMultiSelected;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group overflow-hidden transition-all duration-300 rounded-2xl border-0',
        !isFrameless && 'bg-card/50',
        colSpanClass,
        rowSpanClass,
        isDragging && 'opacity-50 ring-4 ring-primary/30 scale-95 z-50',
        !isFrameless && 'min-h-[140px]',
        !isFrameless && dimensions.gridRows === 2 && 'min-h-[296px]',
        // P4: Selection ring
        selected && !isDragging && 'ring-2 ring-primary/60 ring-offset-1 ring-offset-background',
        isMultiSelected && !isDragging && 'ring-2 ring-primary/40',
      )}
    >
      {/* Drag Handle */}
      <div
        className={cn(
          "absolute top-2 left-2 z-40 touch-none",
          isMobile
            ? "opacity-100"
            : "cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity",
          isDragging && "opacity-0"
        )}
        {...attributes}
        {...listeners}
      >
        <div className="bg-background/80 backdrop-blur-md p-2 rounded-xl border border-border/10 shadow-sm active:scale-95 transition-transform">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      {/* Block Content */}
      <div className="w-full h-full relative z-0">
        <div className="pointer-events-none w-full h-full">
          <BlockRenderer block={block} isPreview isOwnerPremium={isPremium} ownerTier={premiumTier} />
        </div>

        {/* Click Overlay */}
        <div
          className="absolute inset-0 z-20 cursor-pointer rounded-2xl ring-offset-background transition-colors hover:bg-black/5 active:bg-black/10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBlockClick?.(block, e);
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBlockDoubleClick?.(block);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          role="button"
          tabIndex={0}
          aria-label={`Edit ${block.type} block`}
        />
      </div>

      {/* Inline editor overlay */}
      {onUpdateBlock && (
        <InlineTextEditor
          block={block}
          onSave={(id, updates) => onUpdateBlock(id, updates)}
        />
      )}

      {/* Block type label - bottom-left */}
      <div className="absolute bottom-2 left-2 z-30 pointer-events-none">
        <span className="inline-block px-2 py-0.5 rounded-md bg-background/70 backdrop-blur-sm text-[10px] font-bold text-muted-foreground uppercase tracking-wider border border-border/10">
          {typeLabel}
        </span>
      </div>

      {/* Controls - top-right */}
      <div className={cn(
        "absolute top-2 right-2 flex gap-1.5 z-30 transition-opacity",
        isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 w-8 p-0 rounded-lg shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onEdit(block);
          }}
          onTouchEnd={(e) => { e.stopPropagation(); }}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        {block.type !== 'profile' && (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-lg shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDuplicate?.(block.id);
            }}
            onTouchEnd={(e) => { e.stopPropagation(); }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        )}
        {isPremium && block.type !== 'profile' && (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-lg shadow-sm border-primary/20 hover:border-primary/50"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onStartExperiment?.(block);
            }}
          >
            <FlaskConical className="h-4 w-4 text-primary" />
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          className="h-8 w-8 p-0 rounded-lg shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(block.id);
          }}
          onTouchEnd={(e) => { e.stopPropagation(); }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Drag overlay component
function DragOverlayBlockItem({ block, isPremium, premiumTier }: { block: Block; isPremium?: boolean; premiumTier?: PremiumTier }) {
  const blockSize = block.blockSize || 'small';
  const dimensions = BLOCK_SIZE_DIMENSIONS[blockSize] || BLOCK_SIZE_DIMENSIONS['small'];
  const widthClass = dimensions.gridCols === 2 ? 'w-full md:w-[600px]' : 'w-full md:w-[300px]';

  return (
    <div
      className={cn(
        'relative bg-card rounded-2xl border-2 border-primary shadow-xl overflow-hidden cursor-grabbing',
        widthClass,
        dimensions.gridRows === 2 ? 'h-[296px]' : 'h-[140px]'
      )}
    >
      <div className="w-full h-full overflow-hidden opacity-80">
        <BlockRenderer block={block} isPreview isOwnerPremium={isPremium} ownerTier={premiumTier} />
      </div>
      <div className="absolute top-0 right-0 z-40 p-3 pt-3 pr-3">
        <div className="bg-primary/20 backdrop-blur-md p-2 rounded-xl">
          <GripVertical className="h-5 w-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

export const GridEditor = memo(function GridEditor({
  blocks,
  isPremium,
  currentTier = 'identity',
  premiumTier,
  gridConfig,
  onInsertBlock,
  onEditBlock,
  onDeleteBlock,
  onUpdateBlock,
  onReorderBlocks,
  onDuplicateBlock,
}: GridEditorProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [experimentBlock, setExperimentBlock] = useState<Block | null>(null);

  const dndContextId = useId();

  // P4: Multi-select state
  const {
    selectedBlockIds,
    lastSelectedId,
    toggleBlockSelection,
    setSelectedBlockIds,
    clearSelection,
    setClipboardContent,
    setInlineEditing,
  } = useEditorStore();

  const profileBlock = blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
  const contentBlocks = blocks.filter(b => b.type !== 'profile');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 }
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeBlock = activeId ? contentBlocks.find(b => b.id === activeId) : null;

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = contentBlocks.findIndex(b => b.id === active.id);
      const newIndex = contentBlocks.findIndex(b => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedContent = arrayMove(contentBlocks, oldIndex, newIndex);
        const newBlocks = profileBlock ? [profileBlock, ...reorderedContent] : reorderedContent;
        onReorderBlocks?.(newBlocks);
      }
    }
  }, [contentBlocks, profileBlock, onReorderBlocks]);

  const handleInsertBlock = useCallback((blockType: string, position?: number) => {
    const pos = typeof position === 'number' ? position : blocks.length;
    onInsertBlock(blockType, pos);
  }, [onInsertBlock, blocks.length]);

  // P4: Block click handler with multi-select support
  const handleBlockClick = useCallback((block: Block, e: React.MouseEvent) => {
    const meta = e.metaKey || e.ctrlKey;
    const shift = e.shiftKey;

    if (meta) {
      // Cmd/Ctrl+click: toggle selection
      toggleBlockSelection(block.id, true);
      trackEditorAction('selection_changed', { blockType: block.type, source: 'grid' });
    } else if (shift && lastSelectedId) {
      // Shift+click: range select
      const range = selectRange(blocks, lastSelectedId, block.id);
      setSelectedBlockIds(range);
      trackEditorAction('selection_changed', { blockType: block.type, source: 'grid' });
    } else {
      // Normal click: single select
      toggleBlockSelection(block.id, false);
    }
  }, [toggleBlockSelection, lastSelectedId, blocks, setSelectedBlockIds]);

  // P4: Double-click handler for inline edit
  const handleBlockDoubleClick = useCallback((block: Block) => {
    if (supportsInlineEdit(block.type as BlockType)) {
      setInlineEditing(block.id);
      trackEditorAction('inline_edit_opened', { blockType: block.type, source: 'grid' });
    } else {
      onEditBlock(block);
    }
  }, [setInlineEditing, onEditBlock]);

  // P4: Bulk action handlers
  const handleBulkDelete = useCallback(() => {
    const result = bulkDelete(blocks, selectedBlockIds);
    if (result.success && result.newBlocks) {
      for (const id of result.affectedIds) {
        onDeleteBlock(id);
      }
      clearSelection();
      trackEditorAction('bulk_action_used', { source: 'grid' });
    }
  }, [blocks, selectedBlockIds, onDeleteBlock, clearSelection]);

  const handleBulkDuplicate = useCallback(() => {
    for (const id of selectedBlockIds) {
      const block = blocks.find(b => b.id === id);
      if (block && block.type !== 'profile') {
        onDuplicateBlock?.(id);
      }
    }
    trackEditorAction('bulk_action_used', { source: 'grid' });
  }, [blocks, selectedBlockIds, onDuplicateBlock]);

  const handleBulkMoveUp = useCallback(() => {
    const result = bulkMoveUp(blocks, selectedBlockIds);
    if (result.success && result.newBlocks) {
      onReorderBlocks?.(result.newBlocks);
    }
  }, [blocks, selectedBlockIds, onReorderBlocks]);

  const handleBulkMoveDown = useCallback(() => {
    const result = bulkMoveDown(blocks, selectedBlockIds);
    if (result.success && result.newBlocks) {
      onReorderBlocks?.(result.newBlocks);
    }
  }, [blocks, selectedBlockIds, onReorderBlocks]);

  // Build grid items
  const gridItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    const profileOffset = profileBlock ? 1 : 0;

    contentBlocks.forEach((block, index) => {
      items.push(
        <InsertBetweenDivider
          key={`divider-${block.id}`}
          position={index + profileOffset}
          onInsert={onInsertBlock}
          isPremium={isPremium}
          currentTier={currentTier}
          currentBlockCount={blocks.length}
          isMobile={isMobile}
        />
      );
      items.push(
        <SortableGridBlockItem
          key={block.id}
          block={block}
          onEdit={onEditBlock}
          onDelete={onDeleteBlock}
          onDuplicate={onDuplicateBlock}
          onUpdateBlock={onUpdateBlock}
          isPremium={isPremium}
          premiumTier={premiumTier}
          isMobile={isMobile}
          isSelected={selectedBlockIds.size <= 1 && selectedBlockIds.has(block.id)}
          isMultiSelected={selectedBlockIds.size > 1 && selectedBlockIds.has(block.id)}
          onStartExperiment={setExperimentBlock}
          onBlockClick={handleBlockClick}
          onBlockDoubleClick={handleBlockDoubleClick}
        />
      );
    });

    return items;
  }, [contentBlocks, profileBlock, onInsertBlock, isPremium, currentTier, blocks.length, isMobile, onEditBlock, onDeleteBlock, onDuplicateBlock, onUpdateBlock, premiumTier, selectedBlockIds, handleBlockClick, handleBlockDoubleClick]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-2 pb-32 md:pb-24">
      {/* Profile block */}
      {profileBlock && (
        <div className="relative" data-onboarding="profile-block">
          <InlineProfileEditor
            block={profileBlock}
            onUpdate={(updates) => onUpdateBlock(profileBlock.id, updates)}
          />
        </div>
      )}

      {/* Grid container */}
      <DndContext
        key={dndContextId}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={contentBlocks.map(b => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-3 grid-flow-row-dense">
            {gridItems}
          </div>
        </SortableContext>

        <DragOverlay adjustScale={true}>
          {activeBlock && (
            <DragOverlayBlockItem block={activeBlock} isPremium={isPremium} premiumTier={premiumTier} />
          )}
        </DragOverlay>
      </DndContext>

      {/* Bottom Add Button */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <motion.div
          className="col-span-1 md:col-span-2 border-2 border-dashed border-border rounded-2xl flex items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <BlockInsertButton
            onInsert={(blockType) => handleInsertBlock(blockType)}
            isPremium={isPremium}
            currentTier={currentTier}
            currentBlockCount={blocks.length}
          />
        </motion.div>
      </div>

      {/* Empty state */}
      {contentBlocks.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl mx-2 bg-card">
          <p className="text-base text-muted-foreground mb-4 px-6">
            {t('dashboard.addFirstBlock', 'Нажмите + чтобы добавить первый блок')}
          </p>
          <BlockInsertButton
            onInsert={(blockType) => handleInsertBlock(blockType)}
            isPremium={isPremium}
            currentTier={currentTier}
            currentBlockCount={blocks.length}
          />
        </div>
      )}

      {/* Fixed FAB on mobile */}
      {isMobile && (
        <motion.div
          className="fixed bottom-24 right-4 z-40"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <BlockInsertButton
            onInsert={(blockType) => handleInsertBlock(blockType)}
            isPremium={isPremium}
            currentTier={currentTier}
            currentBlockCount={blocks.length}
          />
        </motion.div>
      )}

      {/* P4: Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedBlockIds.size}
        onDuplicate={handleBulkDuplicate}
        onDelete={handleBulkDelete}
        onMoveUp={handleBulkMoveUp}
        onMoveDown={handleBulkMoveDown}
        onClearSelection={clearSelection}
      />

      {/* Experiment Setup Dialog */}
      {experimentBlock && (
        <ExperimentSetupDialog
          isOpen={!!experimentBlock}
          onOpenChange={(open) => !open && setExperimentBlock(null)}
          pageId={(profileBlock as any)?.page_id || ''}
          block={experimentBlock}
        />
      )}
    </div>
  );
});

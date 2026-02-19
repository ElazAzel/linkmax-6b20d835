import { memo, useCallback, useState, useMemo, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, GripVertical, Plus, GripHorizontal } from 'lucide-react';
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
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { BlockRenderer } from '@/components/BlockRenderer';
import { BlockInsertButton } from './BlockInsertButton';
import { InlineProfileEditor } from '../blocks/InlineProfileEditor';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Block, ProfileBlock, GridConfig } from '@/types/page';
import { BLOCK_SIZE_DIMENSIONS } from '@/types/blocks/base';
import type { FreeTier } from '@/hooks/useFreemiumLimits';
import type { PremiumTier } from '@/hooks/usePremiumStatus';
import { motion, AnimatePresence } from 'framer-motion';

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
}

interface SortableGridBlockItemProps {
  block: Block;
  onEdit: (block: Block) => void;
  onDelete: (id: string) => void;
  isPremium?: boolean;
  premiumTier?: PremiumTier;
  isDragging?: boolean;
  isMobile?: boolean;
}

function SortableGridBlockItem({
  block,
  onEdit,
  onDelete,
  isPremium,
  premiumTier,
  isMobile = false,
}: SortableGridBlockItemProps) {
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

  // Determine grid span based on block size
  const blockSize = block.blockSize || 'small';
  const dimensions = BLOCK_SIZE_DIMENSIONS[blockSize] || BLOCK_SIZE_DIMENSIONS['small'];

  // Map dimensions to Tailwind classes
  const colSpanClass = dimensions.gridCols === 2 ? 'col-span-2' : 'col-span-1';
  const rowSpanClass = dimensions.gridRows === 2 ? 'row-span-2' : 'row-span-1';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all',
        colSpanClass,
        rowSpanClass,
        isDragging && 'opacity-50 ring-2 ring-primary z-50',
        'min-h-[140px]',
        dimensions.gridRows === 2 && 'min-h-[296px]'
      )}
    // Removed listeners from main container to separate drag and click
    >
      {/* Mobile Drag Handle - Always visible overlay */}
      {isMobile && (
        <div
          className="absolute top-0 right-0 z-40 p-3 touch-none"
          {...attributes}
          {...listeners}
        >
          <div className="bg-background/80 backdrop-blur-md p-2 rounded-xl border border-border/10 shadow-sm active:scale-95 transition-transform">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Desktop Drag Handle - Hover only */}
      {!isMobile && (
        <div
          className={cn(
            "absolute top-2 left-2 z-30 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity touch-none",
            isDragging && "opacity-0"
          )}
          {...attributes}
          {...listeners}
        >
          <div className="bg-background/80 backdrop-blur-sm rounded-lg p-1.5 shadow-sm border border-border/10">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Block Content */}
      <div className="w-full h-full relative z-0">
        <div className="pointer-events-none w-full h-full">
          <BlockRenderer block={block} isPreview isOwnerPremium={isPremium} ownerTier={premiumTier} />
        </div>

        {/* Click Overlay - High z-index to capture all taps/clicks */}
        <div
          className="absolute inset-0 z-20 cursor-pointer rounded-2xl ring-offset-background transition-colors hover:bg-black/5 active:bg-black/10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit(block);
          }}
          onPointerDown={(e) => {
            // Don't interfere with drag handles
            if ((e.target as HTMLElement).closest('[data-drag-handle]')) return;
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
          }}
          role="button"
          tabIndex={0}
          aria-label={`Edit ${block.type} block`}
        />
      </div>

      {/* Edit/Delete Controls */}
      <div className={cn(
        "absolute top-2 right-2 flex gap-1.5 z-30 transition-opacity",
        // On mobile, positioned slightly differently to avoid conflict with drag handle if needed
        // But with dedicated handle, we can position them nicely.
        // Let's hide them on Mobile because tapping the block opens the editor anyway
        // or keep them but ensure no overlap.
        // Current design: Mobile handles separate.
        isMobile ? "hidden" : "opacity-0 group-hover:opacity-100"
      )}>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 w-8 p-0 rounded-lg shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(block);
          }}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="h-8 w-8 p-0 rounded-lg shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Actions Hint (Since we hid buttons) 
          Actually, let's just let the tap open the editor.
      */}
    </div>
  );
}

// Drag overlay component
function DragOverlayBlockItem({ block, isPremium, premiumTier }: { block: Block; isPremium?: boolean; premiumTier?: PremiumTier }) {
  const blockSize = block.blockSize || 'small';
  const dimensions = BLOCK_SIZE_DIMENSIONS[blockSize] || BLOCK_SIZE_DIMENSIONS['small'];
  const widthClass = dimensions.gridCols === 2 ? 'w-full' : 'w-1/2';

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
      {/* Show handle in overlay to indicate dragging state */}
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
  currentTier = 'free',
  premiumTier,
  gridConfig,
  onInsertBlock,
  onEditBlock,
  onDeleteBlock,
  onUpdateBlock,
  onReorderBlocks,
}: GridEditorProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState<string | null>(null);

  const dndContextId = useId();

  const profileBlock = blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
  const contentBlocks = blocks.filter(b => b.type !== 'profile');

  // Note: blockIdsKey removed from DndContext key to prevent full remounts on block changes
  // SortableContext items prop handles reconciliation naturally

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5 // Minimal distance to detect drag vs click on the handle
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // Give onClick time to fire before drag activates
        tolerance: 8
      }
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

  const handleInsertBlock = useCallback((blockType: string) => {
    const position = blocks.length;
    onInsertBlock(blockType, position);
  }, [onInsertBlock, blocks.length]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-32 md:pb-24">
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
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-2 gap-4 grid-flow-row-dense">
            <AnimatePresence>
              {contentBlocks.map((block) => (
                <SortableGridBlockItem
                  key={block.id}
                  block={block}
                  onEdit={onEditBlock}
                  onDelete={onDeleteBlock}
                  isPremium={isPremium}
                  premiumTier={premiumTier}
                  isMobile={isMobile}
                />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>

        <DragOverlay adjustScale={true}>
          {activeBlock && (
            <DragOverlayBlockItem block={activeBlock} isPremium={isPremium} premiumTier={premiumTier} />
          )}
        </DragOverlay>
      </DndContext>

      {/* Bottom Add Button */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          className="col-span-1 md:col-span-2 border-2 border-dashed border-border rounded-2xl flex items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors py-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <BlockInsertButton
            onInsert={handleInsertBlock}
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
            onInsert={handleInsertBlock}
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
            onInsert={handleInsertBlock}
            isPremium={isPremium}
            currentTier={currentTier}
            currentBlockCount={blocks.length}
          />
        </motion.div>
      )}
    </div>
  );
});

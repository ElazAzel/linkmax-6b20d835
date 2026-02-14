import { memo, useCallback, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, GripVertical } from 'lucide-react';
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
import { BlockRenderer } from '@/components/BlockRenderer';
import { BlockInsertButton } from './BlockInsertButton';
import { InlineProfileEditor } from '../blocks/InlineProfileEditor';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Block, ProfileBlock, GridConfig, BlockSizePreset } from '@/types/page';
import { BLOCK_SIZE_DIMENSIONS } from '@/types/page';
import type { FreeTier } from '@/hooks/useFreemiumLimits';
import type { PremiumTier } from '@/hooks/usePremiumStatus';

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

// Check if block is full width (with fallback for legacy sizes)
function isFullWidthBlock(blockSize?: BlockSizePreset): boolean {
  if (!blockSize) return true; // Default to full width
  
  // Handle legacy sizes - convert to new format
  if (blockSize.startsWith('full')) return true;
  if (blockSize.startsWith('half')) return false;
  
  const dims = BLOCK_SIZE_DIMENSIONS[blockSize];
  return dims?.gridCols === 1;
}

interface SortableGridBlockItemProps {
  block: Block;
  isFullWidth: boolean;
  onEdit: (block: Block) => void;
  onDelete: (id: string) => void;
  isPremium?: boolean;
  premiumTier?: PremiumTier;
  isDragging?: boolean;
}

function SortableGridBlockItem({
  block,
  isFullWidth,
  onEdit,
  onDelete,
  isPremium,
  premiumTier,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group bg-card rounded-2xl border border-border shadow-sm overflow-hidden transition-all',
        isFullWidth ? 'col-span-2' : 'col-span-1',
        isDragging && 'opacity-50 ring-2 ring-primary z-50'
      )}
    >
      {/* Drag handle - visible on hover, top-left */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-grab active:cursor-grabbing"
      >
        <div className="bg-background/95 rounded-lg p-1.5 shadow-sm border">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Block content */}
      <div 
        className="w-full h-full overflow-hidden cursor-pointer"
        onClick={() => onEdit(block)}
      >
        <BlockRenderer block={block} isPreview isOwnerPremium={isPremium} ownerTier={premiumTier} />
      </div>

      {/* Edit/Delete - visible on hover, positioned clearly */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5 z-10">
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
    </div>
  );
}

// Drag overlay component (ghost element while dragging) - BOLD
function DragOverlayBlockItem({ block, isPremium, premiumTier }: { block: Block; isPremium?: boolean; premiumTier?: PremiumTier }) {
  const isFullWidth = isFullWidthBlock(block.blockSize);
  
  return (
    <div
      className={cn(
        'relative bg-card rounded-2xl border-2 border-primary shadow-xl overflow-hidden',
        isFullWidth ? 'w-full' : 'w-1/2'
      )}
      style={{
        maxWidth: isFullWidth ? '640px' : '320px',
      }}
    >
      <div className="w-full h-full overflow-hidden opacity-80">
        <BlockRenderer block={block} isPreview isOwnerPremium={isPremium} ownerTier={premiumTier} />
      </div>
    </div>
  );
}

// Component to show add button in empty half-slot
function AddBlockSlot({
  onInsert,
  isPremium,
  currentTier,
  blockCount,
}: {
  onInsert: (blockType: string) => void;
  isPremium: boolean;
  currentTier?: FreeTier;
  blockCount: number;
}) {
  return (
    <div className="col-span-1 border-2 border-dashed border-border rounded-2xl flex items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors min-h-[140px]">
      <BlockInsertButton
        onInsert={onInsert}
        isPremium={isPremium}
        currentTier={currentTier}
        currentBlockCount={blockCount}
      />
    </div>
  );
}

// Organize blocks into rows based on their size
interface BlockRow {
  blocks: Block[];
  hasEmptySlot: boolean;
}

function organizeBlocksIntoRows(blocks: Block[]): BlockRow[] {
  const rows: BlockRow[] = [];
  let currentRow: Block[] = [];
  let currentRowCols = 0;

  for (const block of blocks) {
    const isFullWidth = isFullWidthBlock(block.blockSize);
    const blockCols = isFullWidth ? 2 : 1;

    // If this block would overflow, start a new row
    if (currentRowCols + blockCols > 2) {
      if (currentRow.length > 0) {
        rows.push({
          blocks: currentRow,
          hasEmptySlot: currentRowCols === 1,
        });
      }
      currentRow = [block];
      currentRowCols = blockCols;
    } else {
      currentRow.push(block);
      currentRowCols += blockCols;
    }

    // If row is full, push it
    if (currentRowCols === 2) {
      rows.push({
        blocks: currentRow,
        hasEmptySlot: false,
      });
      currentRow = [];
      currentRowCols = 0;
    }
  }

  // Push remaining blocks
  if (currentRow.length > 0) {
    rows.push({
      blocks: currentRow,
      hasEmptySlot: currentRowCols === 1,
    });
  }

  return rows;
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

  const profileBlock = blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
  const contentBlocks = blocks.filter(b => b.type !== 'profile');

  // DnD sensors - optimized for both desktop and mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Memoize organized rows for better performance
  const rows = useMemo(() => organizeBlocksIntoRows(contentBlocks), [contentBlocks]);

  // Find active block for overlay
  const activeBlock = activeId ? contentBlocks.find(b => b.id === activeId) : null;

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = contentBlocks.findIndex(b => b.id === active.id);
      const newIndex = contentBlocks.findIndex(b => b.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedContent = arrayMove(contentBlocks, oldIndex, newIndex);
        
        // Reconstruct full blocks array with profile first
        const newBlocks = profileBlock 
          ? [profileBlock, ...reorderedContent]
          : reorderedContent;
        
        onReorderBlocks?.(newBlocks);
      }
    }
  }, [contentBlocks, profileBlock, onReorderBlocks]);

  // Handle adding block
  const handleInsertBlock = useCallback((blockType: string, afterIndex?: number) => {
    const position = afterIndex !== undefined ? afterIndex + 1 : contentBlocks.length;
    onInsertBlock(blockType, position);
  }, [onInsertBlock, contentBlocks.length]);

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

      {/* Grid container with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={contentBlocks.map(b => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {rows.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-2 gap-4"
              >
                {row.blocks.map((block) => (
                  <SortableGridBlockItem
                    key={block.id}
                    block={block}
                    isFullWidth={isFullWidthBlock(block.blockSize)}
                    onEdit={onEditBlock}
                    onDelete={onDeleteBlock}
                    isPremium={isPremium}
                    premiumTier={premiumTier}
                  />
                ))}
                
                {/* Show add button in empty slot */}
                {row.hasEmptySlot && (
                  <AddBlockSlot
                    onInsert={(type) => handleInsertBlock(type, rowIndex)}
                    isPremium={isPremium}
                    currentTier={currentTier}
                    blockCount={blocks.length}
                  />
                )}
              </div>
            ))}

            {/* Add row for new blocks */}
            {rows.length === 0 || !rows[rows.length - 1]?.hasEmptySlot ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 border-2 border-dashed border-border rounded-2xl flex items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors py-8">
                  <BlockInsertButton
                    onInsert={(type) => handleInsertBlock(type)}
                    isPremium={isPremium}
                    currentTier={currentTier}
                    currentBlockCount={blocks.length}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay>
          {activeBlock && (
            <DragOverlayBlockItem block={activeBlock} isPremium={isPremium} premiumTier={premiumTier} />
          )}
        </DragOverlay>
      </DndContext>

      {/* Empty state */}
      {contentBlocks.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl mx-2 bg-card">
          <p className="text-base text-muted-foreground mb-4 px-6">
            {t('dashboard.addFirstBlock', 'Нажмите + чтобы добавить первый блок')}
          </p>
          <BlockInsertButton
            onInsert={(type) => handleInsertBlock(type)}
            isPremium={isPremium}
            currentTier={currentTier}
            currentBlockCount={blocks.length}
          />
        </div>
      )}

      {/* Fixed FAB on mobile */}
      {isMobile && contentBlocks.length > 0 && (
        <div className="fixed bottom-20 right-4 z-40">
          <BlockInsertButton
            onInsert={(type) => handleInsertBlock(type)}
            isPremium={isPremium}
            currentTier={currentTier}
            currentBlockCount={blocks.length}
          />
        </div>
      )}
    </div>
  );
});

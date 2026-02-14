import { memo, useCallback, useState, useMemo, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, GripVertical, ChevronUp, ChevronDown, Plus } from 'lucide-react';
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
import { createRowKey } from '@/lib/block-utils';
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
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  isPremium?: boolean;
  premiumTier?: PremiumTier;
  isDragging?: boolean;
  isMobile?: boolean;
}

function SortableGridBlockItem({
  block,
  isFullWidth,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
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
      {/* Left controls: Move arrows (always visible on mobile, hover on desktop) */}
      <div className={cn(
        "absolute top-2 left-2 z-20 flex flex-col gap-1 transition-opacity",
        isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
        {/* Move arrows - reliable fallback for DnD issues on mobile */}
        <div className="flex flex-col gap-0.5">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-lg shadow-sm touch-none"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp?.();
            }}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-lg shadow-sm touch-none"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown?.();
            }}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Drag handle - hidden on mobile for cleaner UX, move arrows are primary */}
        {!isMobile && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <div className="bg-background/95 rounded-lg p-1.5 shadow-sm border">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>

      {/* Block content */}
      <div 
        className="w-full h-full overflow-hidden cursor-pointer"
        onClick={() => onEdit(block)}
      >
        <BlockRenderer block={block} isPreview isOwnerPremium={isPremium} ownerTier={premiumTier} />
      </div>

      {/* Edit/Delete - visible on hover (desktop) or always (mobile) */}
      <div className={cn(
        "absolute top-2 right-2 flex gap-1.5 z-10 transition-opacity",
        isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
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

// Inline add button between rows - opens sheet on click
function InlineAddButton({
  onInsert,
  isPremium,
  currentTier,
  blockCount,
  position,
}: {
  onInsert: (blockType: string, position: number) => void;
  isPremium: boolean;
  currentTier?: FreeTier;
  blockCount: number;
  position: number;
}) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  return (
    <div className="relative flex items-center justify-center py-2 group/insert">
      {/* Line with plus button */}
      <div className="absolute inset-x-0 flex items-center px-4">
        <div className="flex-1 border-t border-dashed border-transparent group-hover/insert:border-border/40 transition-colors" />
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-7 p-0 rounded-full border-dashed opacity-0 group-hover/insert:opacity-100 transition-all hover:scale-110 hover:border-primary hover:bg-primary/10"
          onClick={() => setIsSheetOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <div className="flex-1 border-t border-dashed border-transparent group-hover/insert:border-border/40 transition-colors" />
      </div>
      
      {/* Sheet for block selection */}
      <BlockInsertButton
        onInsert={(type) => {
          onInsert(type, position);
          setIsSheetOpen(false);
        }}
        isPremium={isPremium}
        currentTier={currentTier}
        currentBlockCount={blockCount}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        hideTrigger
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
  
  // Unique ID for DndContext to prevent stale DOM reference issues
  const dndContextId = useId();

  const profileBlock = blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
  const contentBlocks = blocks.filter(b => b.type !== 'profile');
  
  // Create stable block IDs string to detect when we need to reset DnD
  const blockIdsKey = useMemo(() => contentBlocks.map(b => b.id).join(','), [contentBlocks]);

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

  // Handle adding block at specific position
  const handleInsertBlock = useCallback((blockType: string, insertPosition?: number) => {
    // insertPosition is already the correct position to insert at
    // Profile block is always at position 0, so content blocks start at position 1
    const profileOffset = profileBlock ? 1 : 0;
    const position = insertPosition !== undefined 
      ? insertPosition + profileOffset 
      : contentBlocks.length + profileOffset;
    onInsertBlock(blockType, position);
  }, [onInsertBlock, contentBlocks.length, profileBlock]);

  // Handle arrow move - moves block up or down in the list
  const handleMoveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    const currentIndex = contentBlocks.findIndex(b => b.id === blockId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= contentBlocks.length) return;
    
    const reorderedContent = arrayMove(contentBlocks, currentIndex, newIndex);
    const newBlocks = profileBlock 
      ? [profileBlock, ...reorderedContent]
      : reorderedContent;
    
    onReorderBlocks?.(newBlocks);
  }, [contentBlocks, profileBlock, onReorderBlocks]);

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

      {/* Grid container with DnD - key resets context when blocks change to prevent stale DOM refs */}
      <DndContext
        key={`${dndContextId}-${blockIdsKey}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={contentBlocks.map(b => b.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-1">
            {rows.map((row) => {
              // Calculate the position for inserting after this row
              const lastBlockInRow = row.blocks[row.blocks.length - 1];
              const insertPosition = lastBlockInRow 
                ? contentBlocks.findIndex(b => b.id === lastBlockInRow.id) + 1
                : 0;
              
              // Use stable key based on block IDs in row
              const rowKey = createRowKey(row.blocks);
              
              return (
                <div key={rowKey}>
                  {/* Row with blocks */}
                  <div className="grid grid-cols-2 gap-4">
                    {row.blocks.map((block) => {
                      const blockIndex = contentBlocks.findIndex(b => b.id === block.id);
                      return (
                        <SortableGridBlockItem
                          key={block.id}
                          block={block}
                          isFullWidth={isFullWidthBlock(block.blockSize)}
                          onEdit={onEditBlock}
                          onDelete={onDeleteBlock}
                          onMoveUp={() => handleMoveBlock(block.id, 'up')}
                          onMoveDown={() => handleMoveBlock(block.id, 'down')}
                          canMoveUp={blockIndex > 0}
                          canMoveDown={blockIndex < contentBlocks.length - 1}
                          isPremium={isPremium}
                          premiumTier={premiumTier}
                          isMobile={isMobile}
                        />
                      );
                    })}
                    
                    {/* Show add button in empty slot */}
                    {row.hasEmptySlot && (
                      <AddBlockSlot
                        onInsert={(type) => handleInsertBlock(type, insertPosition - 1)}
                        isPremium={isPremium}
                        currentTier={currentTier}
                        blockCount={blocks.length}
                      />
                    )}
                  </div>
                  
                  {/* Plus button between rows */}
                  <InlineAddButton
                    onInsert={(type, pos) => handleInsertBlock(type, pos)}
                    isPremium={isPremium}
                    currentTier={currentTier}
                    blockCount={blocks.length}
                    position={insertPosition}
                  />
                </div>
              );
            })}

            {/* Bottom add button if there are blocks but no inline add after last row */}
            {rows.length === 0 && (
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
            )}
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

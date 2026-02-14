import { memo, useEffect, useCallback, useState } from 'react';
import { Plus, Move, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockRenderer } from '@/components/BlockRenderer';
import { BlockInsertButton } from './BlockInsertButton';
import { InlineProfileEditor } from '../blocks/InlineProfileEditor';
import { useGridLayout, DEFAULT_GRID_CONFIG } from '@/hooks/useGridLayout';
import { useGridDragDrop } from '@/hooks/useGridDragDrop';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import type { Block, ProfileBlock, GridConfig, GridLayoutData } from '@/types/page';

interface GridEditorProps {
  blocks: Block[];
  isPremium: boolean;
  gridConfig?: GridConfig;
  onInsertBlock: (blockType: string, position: number) => void;
  onEditBlock: (block: Block) => void;
  onDeleteBlock: (id: string) => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
}

interface GridBlockItemProps {
  block: Block;
  style: React.CSSProperties;
  onEdit: (block: Block) => void;
  onDelete: (id: string) => void;
  isDragging: boolean;
  isResizing: boolean;
  onDragStart: (e: React.MouseEvent | React.TouchEvent) => void;
  onResizeStart: (handle: 'se', e: React.MouseEvent | React.TouchEvent) => void;
}

function GridBlockItem({
  block,
  style,
  onEdit,
  onDelete,
  isDragging,
  isResizing,
  onDragStart,
  onResizeStart,
}: GridBlockItemProps) {
  return (
    <div
      style={style}
      className={cn(
        'relative group bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all',
        isDragging && 'opacity-50 scale-95',
        isResizing && 'ring-2 ring-primary',
        'hover:shadow-md'
      )}
    >
      {/* Block content */}
      <div 
        className="w-full h-full overflow-hidden p-2 cursor-pointer"
        onClick={() => onEdit(block)}
      >
        <BlockRenderer block={block} isPreview />
      </div>

      {/* Drag handle */}
      <div
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
      >
        <div className="bg-background/80 backdrop-blur-sm rounded-md p-1.5 shadow-sm border border-border">
          <Move className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>

      {/* Resize handle (bottom-right) */}
      <div
        className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-se-resize z-10"
        onMouseDown={(e) => onResizeStart('se', e)}
        onTouchStart={(e) => onResizeStart('se', e)}
      >
        <div className="bg-background/80 backdrop-blur-sm rounded-md p-1 shadow-sm border border-border">
          <Maximize2 className="h-3 w-3 text-muted-foreground rotate-90" />
        </div>
      </div>

      {/* Edit/Delete actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
        <Button
          size="icon"
          variant="secondary"
          className="h-7 w-7"
          onClick={() => onEdit(block)}
        >
          <span className="sr-only">Edit</span>
          ✏️
        </Button>
        <Button
          size="icon"
          variant="destructive"
          className="h-7 w-7"
          onClick={() => onDelete(block.id)}
        >
          <span className="sr-only">Delete</span>
          🗑️
        </Button>
      </div>
    </div>
  );
}

export const GridEditor = memo(function GridEditor({
  blocks,
  isPremium,
  gridConfig = DEFAULT_GRID_CONFIG,
  onInsertBlock,
  onEditBlock,
  onDeleteBlock,
  onUpdateBlock,
}: GridEditorProps) {
  const isMobile = useIsMobile();
  const columns = isMobile ? gridConfig.columnsMobile : gridConfig.columnsDesktop;
  
  const { 
    getBlockStyle, 
    isPositionValid, 
    findFreePosition,
    totalRows 
  } = useGridLayout({ blocks, config: gridConfig, columns });

  const [containerWidth, setContainerWidth] = useState(0);
  const cellWidth = containerWidth > 0 
    ? (containerWidth - (columns - 1) * gridConfig.gapSize) / columns 
    : 100;

  // Handle block movement
  const handleMove = useCallback((blockId: string, newLayout: GridLayoutData) => {
    onUpdateBlock(blockId, { gridLayout: newLayout });
  }, [onUpdateBlock]);

  // Handle block resize
  const handleResize = useCallback((blockId: string, newLayout: GridLayoutData) => {
    onUpdateBlock(blockId, { gridLayout: newLayout });
  }, [onUpdateBlock]);

  const {
    dragState,
    hoveredCell,
    isValidDrop,
    onDragStart,
    onDragMove,
    onDragEnd,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
  } = useGridDragDrop({
    columns,
    cellWidth,
    cellHeight: gridConfig.cellHeight,
    gapSize: gridConfig.gapSize,
    onMove: handleMove,
    onResize: handleResize,
    isPositionValid,
  });

  // Global mouse/touch listeners for drag
  useEffect(() => {
    if (dragState.isDragging) {
      const handleMove = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        onDragMove(e);
      };
      const handleEnd = () => onDragEnd();
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [dragState.isDragging, onDragMove, onDragEnd]);

  // Global mouse/touch listeners for resize
  useEffect(() => {
    if (dragState.isResizing) {
      const handleMove = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        onResizeMove(e);
      };
      const handleEnd = () => onResizeEnd();
      
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      
      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
    }
  }, [dragState.isResizing, onResizeMove, onResizeEnd]);

  // Measure container width
  useEffect(() => {
    const container = document.querySelector('[data-grid-container]');
    if (container) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      observer.observe(container);
      return () => observer.disconnect();
    }
  }, []);

  const profileBlock = blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
  const contentBlocks = blocks.filter(b => b.type !== 'profile');

  // Handle adding block to grid
  const handleInsertBlock = useCallback((blockType: string) => {
    const freePos = findFreePosition(1, 1);
    // Position is handled in parent hook, we just trigger insert
    onInsertBlock(blockType, contentBlocks.length);
  }, [findFreePosition, onInsertBlock, contentBlocks.length]);

  return (
    <div className="max-w-4xl mx-auto px-3 py-4 space-y-4 pb-32 md:pb-24">
      {/* Profile block (full width, not in grid) */}
      {profileBlock && (
        <div className="relative group" data-onboarding="profile-block">
          <InlineProfileEditor
            block={profileBlock}
            onUpdate={(updates) => onUpdateBlock(profileBlock.id, updates)}
          />
        </div>
      )}

      {/* Grid container */}
      <div
        data-grid-container
        className="relative"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${totalRows + 2}, ${gridConfig.cellHeight}px)`,
          gap: `${gridConfig.gapSize}px`,
          minHeight: `${(totalRows + 2) * gridConfig.cellHeight}px`,
        }}
      >
        {/* Grid background lines (visual guide) */}
        {Array.from({ length: (totalRows + 2) * columns }).map((_, index) => {
          const col = (index % columns) + 1;
          const row = Math.floor(index / columns) + 1;
          return (
            <div
              key={`grid-cell-${index}`}
              className={cn(
                'border border-dashed border-border/30 rounded-lg transition-colors',
                hoveredCell?.col === col && hoveredCell?.row === row && (
                  isValidDrop ? 'bg-primary/10 border-primary/50' : 'bg-destructive/10 border-destructive/50'
                )
              )}
              style={{
                gridColumn: col,
                gridRow: row,
              }}
            />
          );
        })}

        {/* Blocks */}
        {contentBlocks.map((block) => (
          <GridBlockItem
            key={block.id}
            block={block}
            style={getBlockStyle(block.id)}
            onEdit={onEditBlock}
            onDelete={onDeleteBlock}
            isDragging={dragState.blockId === block.id && dragState.isDragging}
            isResizing={dragState.blockId === block.id && dragState.isResizing}
            onDragStart={(e) => onDragStart(block.id, e, block.gridLayout || {})}
            onResizeStart={(handle, e) => onResizeStart(block.id, handle, e, block.gridLayout || {})}
          />
        ))}
      </div>

      {/* Empty state */}
      {contentBlocks.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed border-border/50 rounded-2xl mx-2 bg-card/30 backdrop-blur-sm">
          <p className="text-sm text-muted-foreground mb-4 px-4">
            Click + to add your first block
          </p>
        </div>
      )}

      {/* Fixed FAB for adding blocks */}
      <div className="fixed bottom-20 right-4 z-40">
        <BlockInsertButton
          onInsert={handleInsertBlock}
          isPremium={isPremium}
          currentBlockCount={blocks.length}
        />
      </div>
    </div>
  );
});

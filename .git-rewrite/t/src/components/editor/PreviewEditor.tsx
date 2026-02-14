import { memo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockInsertButton } from './BlockInsertButton';
import { InlineEditableBlock } from './InlineEditableBlock';
import { InlineProfileEditor } from '../blocks/InlineProfileEditor';
import { BlockHint } from '../onboarding/BlockHint';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Block, ProfileBlock } from '@/types/page';

interface PreviewEditorProps {
  blocks: Block[];
  isPremium: boolean;
  onInsertBlock: (blockType: string, position: number) => void;
  onEditBlock: (block: Block) => void;
  onDeleteBlock: (id: string) => void;
  onReorderBlocks: (blocks: Block[]) => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  activeBlockHint?: { blockType: string; blockId: string } | null;
  onDismissHint?: () => void;
}

interface SortableBlockWrapperProps {
  block: Block;
  index: number;
  totalCount: number;
  totalBlocks: number;
  onEdit: (block: Block) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onInsertAfter: (blockType: string) => void;
  isPremium: boolean;
}

interface PreviewEditorContext {
  activeBlockHint?: { blockType: string; blockId: string } | null;
  onDismissHint?: () => void;
}

interface ExtendedSortableBlockWrapperProps extends SortableBlockWrapperProps {
  context?: PreviewEditorContext;
}

function SortableBlockWrapper({
  block,
  index,
  totalCount,
  totalBlocks,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onInsertAfter,
  isPremium,
  context,
}: ExtendedSortableBlockWrapperProps) {
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

  const showHint = context?.activeBlockHint?.blockId === block.id;
  const isFirst = index === 0;
  const isLast = index === totalCount - 1;

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <InlineEditableBlock
        block={block}
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        isFirst={isFirst}
        isLast={isLast}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
      
      {/* Block hint */}
      {showHint && context?.onDismissHint && (
        <BlockHint
          blockType={context.activeBlockHint!.blockType}
          blockId={block.id}
          onDismiss={context.onDismissHint}
        />
      )}
      
      {/* Insert button after each block */}
      <BlockInsertButton
        onInsert={onInsertAfter}
        isPremium={isPremium}
        currentBlockCount={totalBlocks}
        className="my-4"
      />
    </div>
  );
}

export const PreviewEditor = memo(function PreviewEditor({
  blocks,
  isPremium,
  onInsertBlock,
  onEditBlock,
  onDeleteBlock,
  onReorderBlocks,
  onUpdateBlock,
  activeBlockHint,
  onDismissHint,
}: PreviewEditorProps) {
  const sensors = useSensors(useSensor(PointerSensor));
  const isMobile = useIsMobile();
  const [showMobileFAB, setShowMobileFAB] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over.id);

      const reorderedBlocks = [...blocks];
      const [removed] = reorderedBlocks.splice(oldIndex, 1);
      reorderedBlocks.splice(newIndex, 0, removed);
      
      onReorderBlocks(reorderedBlocks);
    }
  };

  const handleMoveUp = (id: string) => {
    const allBlocks = [...blocks];
    const index = allBlocks.findIndex((block) => block.id === id);
    if (index > 0 && allBlocks[index - 1].type !== 'profile') {
      const reorderedBlocks = arrayMove(allBlocks, index, index - 1);
      onReorderBlocks(reorderedBlocks);
    }
  };

  const handleMoveDown = (id: string) => {
    const allBlocks = [...blocks];
    const index = allBlocks.findIndex((block) => block.id === id);
    if (index < allBlocks.length - 1) {
      const reorderedBlocks = arrayMove(allBlocks, index, index + 1);
      onReorderBlocks(reorderedBlocks);
    }
  };

  const profileBlock = blocks.find(b => b.type === 'profile');
  const contentBlocks = blocks.filter(b => b.type !== 'profile');

  return (
    <>
      <div className="max-w-lg mx-auto px-3 py-2 space-y-3 pb-32 md:pb-24">
        {/* Profile block with inline editing */}
        {profileBlock && (
          <div className="relative group" data-onboarding="profile-block">
            <InlineProfileEditor
              block={profileBlock as ProfileBlock}
              onUpdate={(updates) => onUpdateBlock(profileBlock.id, updates)}
            />
            <BlockInsertButton
              onInsert={(type) => onInsertBlock(type, 0)}
              isPremium={isPremium}
              currentBlockCount={blocks.length}
              className="my-3"
            />
          </div>
        )}

        {/* Draggable content blocks */}
        {contentBlocks.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={contentBlocks.map(b => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {contentBlocks.map((block, index) => (
                <SortableBlockWrapper
                  key={block.id}
                  block={block}
                  index={index}
                  totalCount={contentBlocks.length}
                  totalBlocks={blocks.length}
                  onEdit={onEditBlock}
                  onDelete={onDeleteBlock}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onInsertAfter={(type) => onInsertBlock(type, index + 1)}
                  isPremium={isPremium}
                  context={{ activeBlockHint, onDismissHint }}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl mx-2">
            <p className="text-sm text-muted-foreground mb-4 px-4">
              Click the + button to add your first block
            </p>
          </div>
        )}
      </div>

      {/* Mobile FAB for quick block insertion */}
      {isMobile && (
        <div className="fixed bottom-20 right-4 z-40">
          <BlockInsertButton
            onInsert={(type) => onInsertBlock(type, contentBlocks.length)}
            isPremium={isPremium}
            currentBlockCount={blocks.length}
          />
        </div>
      )}
    </>
  );
});

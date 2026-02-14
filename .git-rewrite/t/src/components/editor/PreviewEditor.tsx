import { memo } from 'react';
import { GridEditor } from './GridEditor';
import type { Block, GridConfig } from '@/types/page';
import type { FreeTier } from '@/hooks/useFreemiumLimits';
import type { PremiumTier } from '@/hooks/usePremiumStatus';

interface PreviewEditorProps {
  blocks: Block[];
  isPremium: boolean;
  currentTier?: FreeTier;
  premiumTier?: PremiumTier;
  gridConfig?: GridConfig;
  onInsertBlock: (blockType: string, position: number) => void;
  onEditBlock: (block: Block) => void;
  onDeleteBlock: (id: string) => void;
  onReorderBlocks: (blocks: Block[]) => void;
  onUpdateBlock: (id: string, updates: Partial<Block>) => void;
  activeBlockHint?: { blockType: string; blockId: string } | null;
  onDismissHint?: () => void;
}

export const PreviewEditor = memo(function PreviewEditor({
  blocks,
  isPremium,
  currentTier = 'free',
  premiumTier,
  gridConfig,
  onInsertBlock,
  onEditBlock,
  onDeleteBlock,
  onReorderBlocks,
  onUpdateBlock,
}: PreviewEditorProps) {
  // Always use grid mode
  return (
    <GridEditor
      blocks={blocks}
      isPremium={isPremium}
      currentTier={currentTier}
      premiumTier={premiumTier}
      gridConfig={gridConfig}
      onInsertBlock={onInsertBlock}
      onEditBlock={onEditBlock}
      onDeleteBlock={onDeleteBlock}
      onUpdateBlock={onUpdateBlock}
      onReorderBlocks={onReorderBlocks}
    />
  );
});

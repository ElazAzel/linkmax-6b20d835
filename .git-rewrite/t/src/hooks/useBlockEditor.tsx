import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Undo2 } from 'lucide-react';
import { createBlock } from '@/lib/block-factory';
import { PREMIUM_BLOCK_TYPES } from '@/lib/block-registry';
import { APP_CONFIG } from '@/lib/constants';
import { incrementChallengeProgress, recordActivity } from '@/services/social';
import type { Block, BlockType } from '@/types/page';
import type { DeletedBlockInfo, BlockInsertResult } from '@/types/blocks';

interface UseBlockEditorOptions {
  isPremium: boolean;
  addBlock: (block: Block, position?: number) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  blocks: Block[];
  playAdd?: () => void;
  playDelete?: () => void;
  playError?: () => void;
  hapticSuccess?: () => void;
  onBlockHint?: (blockType: string, blockId: string) => void;
  onQuestComplete?: (questKey: string) => void;
  onClaimBlockToken?: () => Promise<boolean>;
}

/**
 * Hook to manage block editing operations with undo support
 * 
 * Provides:
 * - Block insertion with premium checks
 * - Block editing modal state
 * - Block deletion with undo capability
 * - Sound and haptic feedback integration
 */
export function useBlockEditor({
  isPremium,
  addBlock,
  updateBlock,
  deleteBlock,
  blocks,
  playAdd,
  playDelete,
  playError,
  hapticSuccess,
  onBlockHint,
  onQuestComplete,
  onClaimBlockToken,
}: UseBlockEditorOptions) {
  const { t } = useTranslation();
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [deletedBlocks, setDeletedBlocks] = useState<DeletedBlockInfo[]>([]);
  
  // Track if an operation is in progress to prevent race conditions
  const operationInProgressRef = useRef(false);

  /**
   * Check if block type requires premium subscription
   */
  const isPremiumBlock = useCallback(
    (blockType: string): boolean => {
      return (PREMIUM_BLOCK_TYPES as readonly string[]).includes(blockType) && !isPremium;
    },
    [isPremium]
  );

  /**
   * Insert a new block at specified position
   */
  const handleInsertBlock = useCallback(
    (blockType: string, position: number): BlockInsertResult => {
      try {
        // Check premium requirement
        if (isPremiumBlock(blockType)) {
          toast.error(t('blocks.premiumRequired', 'This block requires Premium'));
          playError?.();
          return { success: false, error: 'Premium required' };
        }

        const newBlock = createBlock(blockType);
        addBlock(newBlock, position);
        playAdd?.();
        toast.success(t('blocks.added', 'Block added'));
        onBlockHint?.(blockType, newBlock.id);
        
        // Trigger add_block quest
        onQuestComplete?.('add_block');
        // Claim token reward for adding block (once per day)
        onClaimBlockToken?.();
        // Track challenge progress
        incrementChallengeProgress('add_blocks');
        recordActivity('new_block', { block_type: blockType });
        
        return { success: true, blockId: newBlock.id };
      } catch (error) {
        toast.error(t('blocks.addFailed', 'Failed to add block'));
        playError?.();
        return { success: false, error: 'Block creation failed' };
      }
    },
    [isPremiumBlock, addBlock, playAdd, playError, onBlockHint, onQuestComplete, onClaimBlockToken]
  );

  /**
   * Open block editor for a specific block
   */
  const handleEditBlock = useCallback((block: Block) => {
    setEditingBlock(block);
    setEditorOpen(true);
  }, []);

  /**
   * Save block changes and close editor
   */
  const handleSaveBlock = useCallback(
    (updates: Partial<Block>) => {
      if (editingBlock) {
        updateBlock(editingBlock.id, updates);
        setEditorOpen(false);
      }
    },
    [editingBlock, updateBlock]
  );

  /**
   * Close block editor without saving
   */
  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingBlock(null);
  }, []);

  /**
   * Delete block with undo support
   * Profile blocks cannot be deleted
   */
  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      // Prevent concurrent operations
      if (operationInProgressRef.current) return;
      
      const blockIndex = blocks.findIndex((b) => b.id === blockId);
      const block = blocks.find((b) => b.id === blockId);

      // Prevent profile block deletion
      if (!block || block.type === 'profile') return;

      operationInProgressRef.current = true;

      // Store for undo
      const deletedInfo: DeletedBlockInfo = {
        block,
        position: blockIndex,
        blockId: block.id,
        deletedAt: Date.now(),
      };

      setDeletedBlocks((prev) => [...prev, deletedInfo]);

      // Auto-remove from undo stack after timeout
      setTimeout(() => {
        setDeletedBlocks((prev) => prev.filter((d) => d.blockId !== block.id));
      }, APP_CONFIG.undoTimeout);

      // Perform deletion
      deleteBlock(blockId);
      playDelete?.();
      
      // Reset operation flag after a short delay
      setTimeout(() => {
        operationInProgressRef.current = false;
      }, 100);

      // Show toast with undo button
      toast(
        <div className="flex items-center gap-3">
          <span>{t('blocks.deleted', 'Block deleted')}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 gap-1"
            onClick={(e) => {
              e.stopPropagation();
              if (operationInProgressRef.current) return;
              operationInProgressRef.current = true;
              
              hapticSuccess?.();
              addBlock(block, blockIndex);
              setDeletedBlocks((prev) => prev.filter((d) => d.blockId !== block.id));
              toast.success(t('blocks.restored', 'Block restored'));
              
              setTimeout(() => {
                operationInProgressRef.current = false;
              }, 100);
            }}
          >
            <Undo2 className="h-3.5 w-3.5" />
            {t('editor.undo', 'Undo')}
          </Button>
        </div>,
        { duration: APP_CONFIG.undoTimeout }
      );
    },
    [blocks, deleteBlock, addBlock, playDelete, hapticSuccess, t]
  );

  /**
   * Restore last deleted block
   */
  const undoLastDelete = useCallback(() => {
    if (operationInProgressRef.current) return;
    
    const lastDeleted = deletedBlocks[deletedBlocks.length - 1];
    if (!lastDeleted) return;

    operationInProgressRef.current = true;
    hapticSuccess?.();
    addBlock(lastDeleted.block, lastDeleted.position);
    setDeletedBlocks((prev) => prev.slice(0, -1));
    toast.success(t('blocks.restored', 'Block restored'));
    
    setTimeout(() => {
      operationInProgressRef.current = false;
    }, 100);
  }, [deletedBlocks, addBlock, hapticSuccess, t]);

  return {
    // Editor state
    editingBlock,
    editorOpen,

    // Block operations
    handleInsertBlock,
    handleEditBlock,
    handleSaveBlock,
    handleDeleteBlock,
    closeEditor,

    // Undo
    deletedBlocks,
    undoLastDelete,
    hasUndo: deletedBlocks.length > 0,

    // Helpers
    isPremiumBlock,
  };
}

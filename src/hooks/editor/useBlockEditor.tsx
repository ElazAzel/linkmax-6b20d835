import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Undo2 from 'lucide-react/dist/esm/icons/undo-2';
import { createBlock } from '@/lib/blocks/block-factory';
import { PREMIUM_BLOCK_TYPES } from '@/lib/blocks/block-registry';
import { APP_CONFIG } from '@/lib/constants';
import { incrementChallengeProgress, recordActivity } from '@/services/social';
import { useEditorStore } from '@/store/useEditorStore';
import { trackEditorAction } from '@/lib/editor/editor-analytics';
import { addRecentBlockType, addRecentPreset } from '@/lib/editor/editor-session';
import type { Block } from '@/types/page';
import type { DeletedBlockInfo, BlockInsertResult } from '@/types/block-editor-types';
import type { EditorHistoryType } from '@/hooks/editor/useEditorHistory';
import type { BlockPreset } from '@/lib/editor/editor-presets';

interface UseBlockEditorOptions {
  isPremium: boolean;
  addBlock: (block: Block, position?: number) => void;
  updateBlock: (id: string, updates: Partial<Block>) => void;
  deleteBlock: (id: string) => void;
  blocks: Block[];
  editorHistory?: EditorHistoryType;
  playAdd?: () => void;
  playDelete?: () => void;
  playError?: () => void;
  hapticSuccess?: () => void;
  onBlockHint?: (blockType: string, blockId: string) => void;
  onQuestComplete?: (questKey: string) => void;
  onClaimBlockToken?: () => Promise<boolean>;
}

/**
 * Hook to manage block editing operations with undo support and history recording
 */
export function useBlockEditor({
  isPremium,
  addBlock,
  updateBlock,
  deleteBlock,
  blocks,
  editorHistory,
  playAdd,
  playDelete,
  playError,
  hapticSuccess,
  onBlockHint,
  onQuestComplete,
  onClaimBlockToken,
}: UseBlockEditorOptions) {
  const { t } = useTranslation();

  const {
    editingBlock,
    editorOpen,
    deletedBlocks,
    operationInProgress,
    setEditingBlock,
    setEditorOpen,
    setDeletedBlocks,
    setOperationInProgress,
    closeEditor,
    addRecentBlockType: storeAddRecent,
  } = useEditorStore();

  const opRef = useRef(false);

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
        if (isPremiumBlock(blockType)) {
          toast.error(t('blocks.premiumRequired', 'This block requires Premium'));
          playError?.();
          return { success: false, error: 'Premium required' };
        }

        const previousBlocks = [...blocks];
        const newBlock = createBlock(blockType);
        addBlock(newBlock, position);
        playAdd?.();
        toast.success(t('blocks.added', 'Block added'));
        onBlockHint?.(blockType, newBlock.id);

        // Record to history
        const newBlocks = [...previousBlocks];
        newBlocks.splice(position, 0, newBlock);
        editorHistory?.recordBlockAdd(previousBlocks, newBlocks, blockType, newBlock.id);

        // Track analytics + session
        trackEditorAction('block_added', { blockType, blockId: newBlock.id, position, source: 'grid' });
        storeAddRecent(blockType);
        addRecentBlockType(blockType);

        onQuestComplete?.('add_block');
        onClaimBlockToken?.();
        incrementChallengeProgress('add_blocks');
        recordActivity('new_block', { block_type: blockType });

        return { success: true, blockId: newBlock.id };
      } catch (error) {
        toast.error(t('blocks.addFailed', 'Failed to add block'));
        playError?.();
        return { success: false, error: 'Block creation failed' };
      }
    },
    [isPremiumBlock, addBlock, blocks, playAdd, playError, onBlockHint, onQuestComplete, onClaimBlockToken, t, editorHistory, storeAddRecent]
  );

  /**
   * Insert a preset block (with overrides)
   */
  const handleInsertPreset = useCallback(
    (preset: BlockPreset): BlockInsertResult => {
      try {
        if (isPremiumBlock(preset.blockType)) {
          toast.error(t('blocks.premiumRequired', 'This block requires Premium'));
          playError?.();
          return { success: false, error: 'Premium required' };
        }

        const previousBlocks = [...blocks];
        const position = blocks.length;
        const newBlock = createBlock(preset.blockType, preset.overrides);
        addBlock(newBlock, position);
        playAdd?.();
        toast.success(t('blocks.added', 'Block added'));

        const newBlocks = [...previousBlocks, newBlock];
        editorHistory?.recordBlockAdd(previousBlocks, newBlocks, preset.blockType, newBlock.id);

        trackEditorAction('preset_used', { blockType: preset.blockType, presetId: preset.id, source: 'palette' });
        storeAddRecent(preset.blockType);
        addRecentBlockType(preset.blockType);
        addRecentPreset(preset.id);
        useEditorStore.getState().addRecentPreset(preset.id);

        return { success: true, blockId: newBlock.id };
      } catch {
        toast.error(t('blocks.addFailed', 'Failed to add block'));
        playError?.();
        return { success: false, error: 'Preset creation failed' };
      }
    },
    [isPremiumBlock, addBlock, blocks, playAdd, playError, t, editorHistory, storeAddRecent]
  );

  /**
   * Open block editor for a specific block
   */
  const handleEditBlock = useCallback((block: Block) => {
    setEditingBlock(block);
    setEditorOpen(true);
    trackEditorAction('full_editor_opened', { blockType: block.type, blockId: block.id });
  }, [setEditingBlock, setEditorOpen]);

  /**
   * Save block changes
   */
  const handleSaveBlock = useCallback(
    (updates: Partial<Block>) => {
      if (editingBlock) {
        const previousBlocks = [...blocks];
        updateBlock(editingBlock.id, updates);

        // Record history for block update
        const newBlocks = blocks.map(b =>
          b.id === editingBlock.id ? { ...b, ...updates } : b
        ) as Block[];
        editorHistory?.recordBlockUpdate(previousBlocks, newBlocks, editingBlock.type, editingBlock.id);
        trackEditorAction('full_editor_saved', { blockType: editingBlock.type, blockId: editingBlock.id });
      }
    },
    [editingBlock, updateBlock, blocks, editorHistory]
  );

  /**
   * Delete block with undo support
   */
  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      if (operationInProgress || opRef.current) return;

      const blockIndex = blocks.findIndex((b) => b.id === blockId);
      const block = blocks.find((b) => b.id === blockId);

      if (!block || block.type === 'profile') return;

      setOperationInProgress(true);
      opRef.current = true;

      // Record history before deletion
      const previousBlocks = [...blocks];
      const newBlocks = blocks.filter((b) => b.id !== blockId);
      editorHistory?.recordBlockDelete(previousBlocks, newBlocks, block.type, block.id);

      const deletedInfo: DeletedBlockInfo = {
        block,
        position: blockIndex,
        blockId: block.id,
        deletedAt: Date.now(),
      };

      setDeletedBlocks((prev) => [...prev, deletedInfo]);

      setTimeout(() => {
        setDeletedBlocks((prev) => prev.filter((d) => d.blockId !== block.id));
      }, APP_CONFIG.undoTimeout);

      deleteBlock(blockId);
      playDelete?.();
      trackEditorAction('block_deleted', { blockType: block.type, blockId: block.id, position: blockIndex });

      setTimeout(() => {
        setOperationInProgress(false);
        opRef.current = false;
      }, 100);

      toast(
        <div className="flex items-center gap-3">
          <span>{t('blocks.deleted', 'Block deleted')}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 gap-1"
            onClick={(e) => {
              e.stopPropagation();
              if (opRef.current) return;
              opRef.current = true;

              hapticSuccess?.();
              addBlock(block, blockIndex);
              setDeletedBlocks((prev) => prev.filter((d) => d.blockId !== block.id));
              toast.success(t('blocks.restored', 'Block restored'));

              setTimeout(() => {
                opRef.current = false;
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
    [operationInProgress, blocks, setOperationInProgress, setDeletedBlocks, deleteBlock, playDelete, t, hapticSuccess, addBlock, editorHistory]
  );

  /**
   * Restore last deleted block
   */
  const undoLastDelete = useCallback(() => {
    if (operationInProgress || opRef.current) return;

    const lastDeleted = deletedBlocks[deletedBlocks.length - 1];
    if (!lastDeleted) return;

    setOperationInProgress(true);
    opRef.current = true;
    hapticSuccess?.();
    addBlock(lastDeleted.block, lastDeleted.position);
    setDeletedBlocks((prev) => prev.slice(0, -1));
    toast.success(t('blocks.restored', 'Block restored'));

    setTimeout(() => {
      setOperationInProgress(false);
      opRef.current = false;
    }, 100);
  }, [operationInProgress, deletedBlocks, setOperationInProgress, setDeletedBlocks, addBlock, hapticSuccess, t]);

  /**
   * Duplicate a block (deep clone + insert at position + 1)
   */
  const handleDuplicateBlock = useCallback(
    (blockId: string) => {
      const blockIndex = blocks.findIndex((b) => b.id === blockId);
      const block = blocks.find((b) => b.id === blockId);

      if (!block || block.type === 'profile') return;

      try {
        const previousBlocks = [...blocks];
        const cloned = JSON.parse(JSON.stringify(block)) as Block;
        cloned.id = `${block.type}-${Date.now()}`;
        addBlock(cloned, blockIndex + 1);
        playAdd?.();

        const newBlocks = [...previousBlocks];
        newBlocks.splice(blockIndex + 1, 0, cloned);
        editorHistory?.recordBlockAdd(previousBlocks, newBlocks, block.type, cloned.id);

        trackEditorAction('block_duplicated', { blockType: block.type, blockId: cloned.id, position: blockIndex + 1 });
        toast.success(t('blocks.duplicated', 'Block duplicated'));
      } catch {
        toast.error(t('blocks.duplicateFailed', 'Failed to duplicate block'));
        playError?.();
      }
    },
    [blocks, addBlock, playAdd, playError, t, editorHistory]
  );

  return {
    editingBlock,
    editorOpen,
    handleInsertBlock,
    handleInsertPreset,
    handleEditBlock,
    handleSaveBlock,
    handleDeleteBlock,
    handleDuplicateBlock,
    closeEditor,
    deletedBlocks,
    undoLastDelete,
    hasUndo: deletedBlocks.length > 0,
    isPremiumBlock,
  };
}

/**
 * useEditorHistory - Undo/Redo system with 7-step history
 * Provides complete action history management for the editor
 */
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Block } from '@/types/page';

export interface HistoryAction {
  id: string;
  type: 'add' | 'delete' | 'update' | 'reorder' | 'bulk';
  label: string;
  timestamp: number;
  previousState: Block[];
  newState: Block[];
  blockId?: string;
  blockType?: string;
}

interface UseEditorHistoryOptions {
  maxHistorySize?: number;
  onStateChange?: (blocks: Block[]) => void;
}

const MAX_HISTORY_SIZE = 7;

export type EditorHistoryType = ReturnType<typeof useEditorHistory>;

export function useEditorHistory(
  initialBlocks: Block[],
  options: UseEditorHistoryOptions = {}
) {
  const { t } = useTranslation();
  const { maxHistorySize = MAX_HISTORY_SIZE, onStateChange } = options;
  
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentBlocks, setCurrentBlocks] = useState<Block[]>(initialBlocks);
  
  // Ref to track the last action for toast dismissal
  const lastToastIdRef = useRef<string | number | undefined>(undefined);

  // Can undo/redo
  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  // Record a new action
  const recordAction = useCallback((
    type: HistoryAction['type'],
    previousState: Block[],
    newState: Block[],
    label: string,
    blockId?: string,
    blockType?: string
  ) => {
    const action: HistoryAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      label,
      timestamp: Date.now(),
      previousState: [...previousState],
      newState: [...newState],
      blockId,
      blockType,
    };

    setHistory((prev) => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      // Add new action and limit to max size
      const updated = [...newHistory, action].slice(-maxHistorySize);
      return updated;
    });

    setCurrentIndex((prev) => Math.min(prev + 1, maxHistorySize - 1));
    setCurrentBlocks(newState);
    onStateChange?.(newState);

    // Show toast with undo option
    if (lastToastIdRef.current) {
      toast.dismiss(lastToastIdRef.current);
    }

    lastToastIdRef.current = toast(label, {
      description: t('editor.history.undoHint', 'Нажмите чтобы отменить'),
      action: {
        label: t('editor.undo', 'Отменить'),
        onClick: () => {
          // Will trigger undo
          undo();
        },
      },
      duration: 5000,
    });
  }, [currentIndex, maxHistorySize, onStateChange, t]);

  // Undo last action
  const undo = useCallback(() => {
    if (!canUndo) return null;

    const action = history[currentIndex];
    if (!action) return null;

    setCurrentBlocks(action.previousState);
    setCurrentIndex((prev) => prev - 1);
    onStateChange?.(action.previousState);

    toast.success(t('editor.history.undone', 'Действие отменено'), {
      description: action.label,
      duration: 2000,
    });

    return action;
  }, [canUndo, history, currentIndex, onStateChange, t]);

  // Redo action
  const redo = useCallback(() => {
    if (!canRedo) return null;

    const nextIndex = currentIndex + 1;
    const action = history[nextIndex];
    if (!action) return null;

    setCurrentBlocks(action.newState);
    setCurrentIndex(nextIndex);
    onStateChange?.(action.newState);

    toast.success(t('editor.history.redone', 'Действие повторено'), {
      description: action.label,
      duration: 2000,
    });

    return action;
  }, [canRedo, history, currentIndex, onStateChange, t]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
  }, []);

  // Reset with new blocks (e.g., after loading)
  const resetWithBlocks = useCallback((blocks: Block[]) => {
    setCurrentBlocks(blocks);
    clearHistory();
  }, [clearHistory]);

  // Helper methods for common operations
  const recordBlockAdd = useCallback((
    previousBlocks: Block[],
    newBlocks: Block[],
    blockType: string,
    blockId: string
  ) => {
    recordAction(
      'add',
      previousBlocks,
      newBlocks,
      t('editor.history.blockAdded', 'Блок добавлен: {{type}}', { type: t(`blocks.${blockType}`, blockType) }),
      blockId,
      blockType
    );
  }, [recordAction, t]);

  const recordBlockDelete = useCallback((
    previousBlocks: Block[],
    newBlocks: Block[],
    blockType: string,
    blockId: string
  ) => {
    recordAction(
      'delete',
      previousBlocks,
      newBlocks,
      t('editor.history.blockDeleted', 'Блок удалён: {{type}}', { type: t(`blocks.${blockType}`, blockType) }),
      blockId,
      blockType
    );
  }, [recordAction, t]);

  const recordBlockUpdate = useCallback((
    previousBlocks: Block[],
    newBlocks: Block[],
    blockType: string,
    blockId: string
  ) => {
    recordAction(
      'update',
      previousBlocks,
      newBlocks,
      t('editor.history.blockUpdated', 'Блок изменён: {{type}}', { type: t(`blocks.${blockType}`, blockType) }),
      blockId,
      blockType
    );
  }, [recordAction, t]);

  const recordBlocksReorder = useCallback((
    previousBlocks: Block[],
    newBlocks: Block[]
  ) => {
    recordAction(
      'reorder',
      previousBlocks,
      newBlocks,
      t('editor.history.blocksReordered', 'Порядок блоков изменён')
    );
  }, [recordAction, t]);

  return {
    // Current state
    currentBlocks,
    history,
    currentIndex,
    
    // Capabilities
    canUndo,
    canRedo,
    historyLength: history.length,
    
    // Actions
    undo,
    redo,
    clearHistory,
    resetWithBlocks,
    
    // Recording helpers
    recordAction,
    recordBlockAdd,
    recordBlockDelete,
    recordBlockUpdate,
    recordBlocksReorder,
  };
}

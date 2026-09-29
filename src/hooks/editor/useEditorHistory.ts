/**
 * useEditorHistory - Undo/Redo for the block editor.
 *
 * `onStateChange` is called only on undo/redo with the full blocks array to
 * restore; the consumer must apply it to the page state (DashboardV2 wires it
 * to the cloud page state). Recording an action does not call it — the page
 * already holds the new state, and calling it caused an extra autosave.
 *
 * History lives in refs so callbacks never act on a stale snapshot (the undo
 * button in a toast used to undo the *previous* action).
 */
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { Block } from '@/types/page';
import { shouldMergeActions, mergeActions } from '@/lib/editor/history-compressor';

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

interface RecordOptions {
  /** Show a toast with an Undo button (used for destructive actions). */
  notify?: boolean;
}

const MAX_HISTORY_SIZE = 30;

export type EditorHistoryType = ReturnType<typeof useEditorHistory>;

export function useEditorHistory(
  initialBlocks: Block[],
  options: UseEditorHistoryOptions = {}
) {
  const { t } = useTranslation();
  const { maxHistorySize = MAX_HISTORY_SIZE } = options;

  // Latest callback without re-creating every function when it changes
  const onStateChangeRef = useRef(options.onStateChange);
  onStateChangeRef.current = options.onStateChange;

  const historyRef = useRef<HistoryAction[]>([]);
  const indexRef = useRef(-1);
  const [currentBlocks, setCurrentBlocks] = useState<Block[]>(initialBlocks);
  // Bumped on every change so consumers re-render with fresh canUndo/canRedo
  const [, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const lastToastIdRef = useRef<string | number | undefined>(undefined);

  const undo = useCallback(() => {
    const action = historyRef.current[indexRef.current];
    if (!action) return null;

    indexRef.current -= 1;
    setCurrentBlocks(action.previousState);
    onStateChangeRef.current?.(action.previousState);
    bump();

    toast.success(t('editor.history.undone', 'Действие отменено'), {
      description: action.label,
      duration: 2000,
    });
    return action;
  }, [bump, t]);

  const redo = useCallback(() => {
    const action = historyRef.current[indexRef.current + 1];
    if (!action) return null;

    indexRef.current += 1;
    setCurrentBlocks(action.newState);
    onStateChangeRef.current?.(action.newState);
    bump();

    toast.success(t('editor.history.redone', 'Действие повторено'), {
      description: action.label,
      duration: 2000,
    });
    return action;
  }, [bump, t]);

  const recordAction = useCallback((
    type: HistoryAction['type'],
    previousState: Block[],
    newState: Block[],
    label: string,
    blockId?: string,
    blockType?: string,
    recordOptions: RecordOptions = {},
  ) => {
    const action: HistoryAction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type,
      label,
      timestamp: Date.now(),
      previousState: [...previousState],
      newState: [...newState],
      blockId,
      blockType,
    };

    // Drop any redo branch
    const history = historyRef.current.slice(0, indexRef.current + 1);
    const last = history[history.length - 1];
    if (last && shouldMergeActions(last, action)) {
      history[history.length - 1] = mergeActions(last, action);
    } else {
      history.push(action);
    }
    historyRef.current = history.slice(-maxHistorySize);
    indexRef.current = historyRef.current.length - 1;
    setCurrentBlocks(newState);
    bump();

    if (recordOptions.notify) {
      if (lastToastIdRef.current) toast.dismiss(lastToastIdRef.current);
      lastToastIdRef.current = toast(label, {
        action: {
          label: t('editor.undo', 'Отменить'),
          onClick: () => undo(),
        },
        duration: 5000,
      });
    }
  }, [maxHistorySize, bump, t, undo]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    indexRef.current = -1;
    bump();
  }, [bump]);

  const resetWithBlocks = useCallback((blocks: Block[]) => {
    setCurrentBlocks(blocks);
    clearHistory();
  }, [clearHistory]);

  const blockLabel = useCallback(
    (blockType: string) => t(`blocks.${blockType}`, blockType),
    [t],
  );

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
      t('editor.history.blockAdded', 'Блок добавлен: {{type}}', { type: blockLabel(blockType) }),
      blockId,
      blockType
    );
  }, [recordAction, blockLabel, t]);

  const recordBlockDelete = useCallback((
    previousBlocks: Block[],
    newBlocks: Block[],
    blockType: string,
    blockId: string,
    recordOptions?: RecordOptions,
  ) => {
    recordAction(
      'delete',
      previousBlocks,
      newBlocks,
      t('editor.history.blockDeleted', 'Блок удалён: {{type}}', { type: blockLabel(blockType) }),
      blockId,
      blockType,
      recordOptions,
    );
  }, [recordAction, blockLabel, t]);

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
      t('editor.history.blockUpdated', 'Блок изменён: {{type}}', { type: blockLabel(blockType) }),
      blockId,
      blockType
    );
  }, [recordAction, blockLabel, t]);

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

  const recordBulkDelete = useCallback((
    previousBlocks: Block[],
    newBlocks: Block[],
    count: number,
  ) => {
    recordAction(
      'bulk',
      previousBlocks,
      newBlocks,
      t('editor.history.blocksDeleted', 'Удалено блоков: {{count}}', { count }),
      undefined,
      undefined,
      { notify: true },
    );
  }, [recordAction, t]);

  const history = historyRef.current;
  const currentIndex = indexRef.current;

  return {
    // Current state
    currentBlocks,
    history,
    currentIndex,

    // Capabilities
    canUndo: currentIndex >= 0,
    canRedo: currentIndex < history.length - 1,
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
    recordBulkDelete,
  };
}

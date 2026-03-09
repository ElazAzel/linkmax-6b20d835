/**
 * History Compressor - Merges rapid same-field edits into single history entries
 * P5: History Compression
 * 
 * Rules:
 * - Same blockId + type='update' + within MERGE_WINDOW_MS → merge
 * - Consecutive reorders within REORDER_WINDOW_MS → merge
 * - Never merge across different blockIds
 * - Never merge add/delete with updates
 * - Bulk actions already single entry (no compression needed)
 */

import type { HistoryAction } from '@/hooks/editor/useEditorHistory';

const MERGE_WINDOW_MS = 2000;
const REORDER_WINDOW_MS = 1000;

/**
 * Check if two consecutive history actions should be merged
 */
export function shouldMergeActions(
  prev: HistoryAction,
  next: HistoryAction
): boolean {
  const timeDelta = next.timestamp - prev.timestamp;

  // Never merge different operation types (except update+update or reorder+reorder)
  if (prev.type !== next.type) return false;

  // Never merge add or delete
  if (prev.type === 'add' || prev.type === 'delete') return false;
  if (next.type === 'add' || next.type === 'delete') return false;

  // Merge consecutive updates to same block within window
  if (
    prev.type === 'update' &&
    next.type === 'update' &&
    prev.blockId &&
    prev.blockId === next.blockId &&
    timeDelta <= MERGE_WINDOW_MS
  ) {
    return true;
  }

  // Merge consecutive reorders within window
  if (
    prev.type === 'reorder' &&
    next.type === 'reorder' &&
    timeDelta <= REORDER_WINDOW_MS
  ) {
    return true;
  }

  return false;
}

/**
 * Merge two actions into one.
 * Keeps the first action's previousState and the last action's newState.
 * This preserves undo correctness: undoing goes back to original state.
 */
export function mergeActions(
  prev: HistoryAction,
  next: HistoryAction
): HistoryAction {
  return {
    ...next,
    id: prev.id, // Keep original action ID
    previousState: prev.previousState, // Original state before first edit
    timestamp: next.timestamp, // Use latest timestamp
    label: next.label, // Use latest label
  };
}

/**
 * Selection Engine - Pure functions for multi-select logic
 * P4: Block Editor Interaction OS
 */
import type { Block } from '@/types/page';

/**
 * Toggle selection of a block
 * - If additive (Cmd/Ctrl+click): add/remove from current selection
 * - If not additive: replace selection with this block
 */
export function toggleSelection(
  current: Set<string>,
  blockId: string,
  additive: boolean
): Set<string> {
  if (additive) {
    const next = new Set(current);
    if (next.has(blockId)) {
      next.delete(blockId);
    } else {
      next.add(blockId);
    }
    return next;
  }
  return new Set([blockId]);
}

/**
 * Select a range of blocks between two positions (Shift+click)
 */
export function selectRange(
  blocks: Block[],
  fromId: string,
  toId: string
): Set<string> {
  const selectableBlocks = getSelectableBlocks(blocks);
  const fromIndex = selectableBlocks.findIndex(b => b.id === fromId);
  const toIndex = selectableBlocks.findIndex(b => b.id === toId);

  if (fromIndex === -1 || toIndex === -1) {
    return new Set(toId ? [toId] : []);
  }

  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);

  const selectedIds = selectableBlocks
    .slice(start, end + 1)
    .map(b => b.id);

  return new Set(selectedIds);
}

/**
 * Get all blocks that can be selected (excludes profile)
 */
export function getSelectableBlocks(blocks: Block[]): Block[] {
  return blocks.filter(b => b.type !== 'profile');
}

/**
 * Check if a selection is valid
 */
export function isValidSelection(ids: Set<string>, blocks: Block[]): boolean {
  const blockIds = new Set(blocks.map(b => b.id));
  for (const id of ids) {
    if (!blockIds.has(id)) return false;
  }
  return true;
}

/**
 * Get next block id for arrow navigation
 */
export function getNextBlockId(
  blocks: Block[],
  currentId: string | null,
  direction: 'up' | 'down'
): string | null {
  const selectableBlocks = getSelectableBlocks(blocks);
  if (selectableBlocks.length === 0) return null;

  if (!currentId) {
    return direction === 'down' 
      ? selectableBlocks[0]?.id ?? null
      : selectableBlocks[selectableBlocks.length - 1]?.id ?? null;
  }

  const currentIndex = selectableBlocks.findIndex(b => b.id === currentId);
  if (currentIndex === -1) {
    return selectableBlocks[0]?.id ?? null;
  }

  if (direction === 'up') {
    return currentIndex > 0 
      ? selectableBlocks[currentIndex - 1].id 
      : currentId;
  } else {
    return currentIndex < selectableBlocks.length - 1 
      ? selectableBlocks[currentIndex + 1].id 
      : currentId;
  }
}

/**
 * Get all block IDs of a specific type
 */
export function selectByType(blocks: Block[], blockType: string): Set<string> {
  return new Set(
    blocks
      .filter(b => b.type === blockType && b.type !== 'profile')
      .map(b => b.id)
  );
}

/**
 * Select all selectable blocks
 */
export function selectAll(blocks: Block[]): Set<string> {
  return new Set(getSelectableBlocks(blocks).map(b => b.id));
}

/**
 * Get the anchor block for range selection (last selected single block)
 */
export function getSelectionAnchor(
  blocks: Block[],
  selectedIds: Set<string>
): string | null {
  if (selectedIds.size === 0) return null;
  
  const selectableBlocks = getSelectableBlocks(blocks);
  for (const block of selectableBlocks) {
    if (selectedIds.has(block.id)) {
      return block.id;
    }
  }
  return null;
}

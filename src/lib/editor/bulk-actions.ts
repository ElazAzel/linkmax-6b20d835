/**
 * Bulk Actions Engine - Batch operations on selected blocks
 * P4: Block Editor Interaction OS
 */
import type { Block } from '@/types/page';

export interface BulkActionResult {
  success: boolean;
  affectedIds: string[];
  newBlocks?: Block[];
}

/**
 * Delete multiple blocks (excludes profile blocks)
 */
export function bulkDelete(
  blocks: Block[],
  selectedIds: Set<string>
): BulkActionResult {
  const protectedIds = new Set(
    blocks.filter(b => b.type === 'profile').map(b => b.id)
  );
  
  const deletableIds = [...selectedIds].filter(id => !protectedIds.has(id));
  const newBlocks = blocks.filter(b => !deletableIds.includes(b.id));

  return {
    success: deletableIds.length > 0,
    affectedIds: deletableIds,
    newBlocks,
  };
}

/**
 * Duplicate multiple blocks, inserting copies after the last selected block
 */
export function bulkDuplicate(
  blocks: Block[],
  selectedIds: Set<string>
): BulkActionResult {
  if (selectedIds.size === 0) {
    return { success: false, affectedIds: [] };
  }

  // Find the last selected block position
  let lastSelectedIndex = -1;
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (selectedIds.has(blocks[i].id)) {
      lastSelectedIndex = i;
      break;
    }
  }

  if (lastSelectedIndex === -1) {
    return { success: false, affectedIds: [] };
  }

  // Get blocks to duplicate in their original order
  const blocksToDuplicate = blocks.filter(
    b => selectedIds.has(b.id) && b.type !== 'profile'
  );

  // Create duplicates with new IDs
  const duplicates = blocksToDuplicate.map(block => ({
    ...JSON.parse(JSON.stringify(block)),
    id: `${block.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  }));

  // Insert duplicates after the last selected block
  const newBlocks = [
    ...blocks.slice(0, lastSelectedIndex + 1),
    ...duplicates,
    ...blocks.slice(lastSelectedIndex + 1),
  ];

  return {
    success: duplicates.length > 0,
    affectedIds: duplicates.map(b => b.id),
    newBlocks,
  };
}

/**
 * Get block IDs to hide from a selection
 */
export function getHideableIds(
  blocks: Block[],
  selectedIds: Set<string>
): string[] {
  return [...selectedIds].filter(id => {
    const block = blocks.find(b => b.id === id);
    return block && block.type !== 'profile';
  });
}

/**
 * Get block IDs to show from a selection
 */
export function getShowableIds(
  _blocks: Block[],
  selectedIds: Set<string>
): string[] {
  return [...selectedIds];
}

/**
 * Move selected blocks up by one position
 */
export function bulkMoveUp(
  blocks: Block[],
  selectedIds: Set<string>
): BulkActionResult {
  const newBlocks = [...blocks];
  const selectableIndices = blocks
    .map((b, i) => ({ block: b, index: i }))
    .filter(({ block }) => selectedIds.has(block.id) && block.type !== 'profile');

  // Sort by index to move from top
  selectableIndices.sort((a, b) => a.index - b.index);

  let moved = false;
  for (const { index } of selectableIndices) {
    // Find the previous non-profile block
    let prevIndex = index - 1;
    while (prevIndex >= 0 && newBlocks[prevIndex].type === 'profile') {
      prevIndex--;
    }

    if (prevIndex >= 0 && !selectedIds.has(newBlocks[prevIndex].id)) {
      [newBlocks[prevIndex], newBlocks[index]] = [newBlocks[index], newBlocks[prevIndex]];
      moved = true;
    }
  }

  return {
    success: moved,
    affectedIds: [...selectedIds],
    newBlocks,
  };
}

/**
 * Move selected blocks down by one position
 */
export function bulkMoveDown(
  blocks: Block[],
  selectedIds: Set<string>
): BulkActionResult {
  const newBlocks = [...blocks];
  const selectableIndices = blocks
    .map((b, i) => ({ block: b, index: i }))
    .filter(({ block }) => selectedIds.has(block.id) && block.type !== 'profile');

  // Sort by index descending to move from bottom
  selectableIndices.sort((a, b) => b.index - a.index);

  let moved = false;
  for (const { index } of selectableIndices) {
    const nextIndex = index + 1;

    if (nextIndex < newBlocks.length && !selectedIds.has(newBlocks[nextIndex].id)) {
      [newBlocks[index], newBlocks[nextIndex]] = [newBlocks[nextIndex], newBlocks[index]];
      moved = true;
    }
  }

  return {
    success: moved,
    affectedIds: [...selectedIds],
    newBlocks,
  };
}

/**
 * Check if any selected block is protected (profile)
 */
export function hasProtectedBlocks(blocks: Block[], selectedIds: Set<string>): boolean {
  return [...selectedIds].some(id => {
    const block = blocks.find(b => b.id === id);
    return block?.type === 'profile';
  });
}

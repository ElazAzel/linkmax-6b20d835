/**
 * Section Engine - Pure functions for block grouping/sections
 * P5: Section System
 * 
 * Data model: flat Block[] array with optional sectionId on each block.
 * Sections are derived from contiguous runs of blocks sharing sectionId.
 * SectionMeta (label, collapsed) stored in editor store, not in DB.
 */
import type { Block } from '@/types/page';

export interface SectionMeta {
  id: string;
  label: string;
  collapsed: boolean;
  createdAt: number;
}

export interface DerivedSection {
  id: string;
  blockIds: string[];
  startIndex: number;
  endIndex: number;
}

/**
 * Derive ordered section list from block array.
 * Returns sections in page order based on first block appearance.
 */
export function getSections(blocks: Block[]): DerivedSection[] {
  const sectionMap = new Map<string, DerivedSection>();
  const order: string[] = [];

  blocks.forEach((block, index) => {
    const sid = (block as any).sectionId as string | undefined;
    if (!sid) return;

    if (!sectionMap.has(sid)) {
      sectionMap.set(sid, {
        id: sid,
        blockIds: [],
        startIndex: index,
        endIndex: index,
      });
      order.push(sid);
    }

    const section = sectionMap.get(sid)!;
    section.blockIds.push(block.id);
    section.endIndex = index;
  });

  return order.map(id => sectionMap.get(id)!);
}

/**
 * Get blocks belonging to a section
 */
export function getSectionBlocks(blocks: Block[], sectionId: string): Block[] {
  return blocks.filter(b => (b as any).sectionId === sectionId);
}

/**
 * Generate a unique section ID
 */
export function generateSectionId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Create a section from selected block IDs.
 * Assigns sectionId to all selected blocks.
 * Returns new blocks array + new SectionMeta.
 */
export function createSection(
  blocks: Block[],
  selectedIds: Set<string>,
  label: string
): { blocks: Block[]; section: SectionMeta } {
  const sectionId = generateSectionId();
  const section: SectionMeta = {
    id: sectionId,
    label,
    collapsed: false,
    createdAt: Date.now(),
  };

  const newBlocks = blocks.map(b => {
    if (selectedIds.has(b.id) && b.type !== 'profile') {
      return { ...b, sectionId };
    }
    return b;
  });

  return { blocks: newBlocks, section };
}

/**
 * Dissolve a section — remove sectionId from all member blocks
 */
export function dissolveSection(blocks: Block[], sectionId: string): Block[] {
  return blocks.map(b => {
    if ((b as any).sectionId === sectionId) {
      const { sectionId: _, ...rest } = b as any;
      return rest as Block;
    }
    return b;
  });
}

/**
 * Merge two sections into one (keeps first section's ID)
 */
export function mergeSections(
  blocks: Block[],
  keepSectionId: string,
  mergeSectionId: string
): Block[] {
  return blocks.map(b => {
    if ((b as any).sectionId === mergeSectionId) {
      return { ...b, sectionId: keepSectionId } as Block;
    }
    return b;
  });
}

/**
 * Move all blocks of a section up/down by one position
 * relative to adjacent non-section blocks or other sections
 */
export function moveSection(
  blocks: Block[],
  sectionId: string,
  direction: 'up' | 'down'
): Block[] {
  const sectionIndices: number[] = [];
  blocks.forEach((b, i) => {
    if ((b as any).sectionId === sectionId) sectionIndices.push(i);
  });

  if (sectionIndices.length === 0) return blocks;

  const firstIdx = sectionIndices[0];
  const lastIdx = sectionIndices[sectionIndices.length - 1];

  if (direction === 'up' && firstIdx === 0) return blocks;
  if (direction === 'down' && lastIdx === blocks.length - 1) return blocks;

  const newBlocks = [...blocks];
  const sectionBlocks = sectionIndices.map(i => newBlocks[i]);

  // Remove section blocks
  const withoutSection = newBlocks.filter((_, i) => !sectionIndices.includes(i));

  // Find insert position
  let insertAt: number;
  if (direction === 'up') {
    // Insert before the block that was above the section
    insertAt = firstIdx - 1;
  } else {
    // Insert after the block that was below the section
    insertAt = lastIdx - sectionBlocks.length + 1;
  }

  withoutSection.splice(insertAt, 0, ...sectionBlocks);
  return withoutSection;
}

/**
 * Duplicate an entire section with new IDs
 */
export function duplicateSection(
  blocks: Block[],
  sectionId: string
): { blocks: Block[]; newSectionId: string } {
  const newSectionId = generateSectionId();
  const sectionBlocks = getSectionBlocks(blocks, sectionId);
  
  if (sectionBlocks.length === 0) return { blocks, newSectionId };

  // Find last block of section
  let lastIndex = -1;
  blocks.forEach((b, i) => {
    if ((b as any).sectionId === sectionId) lastIndex = i;
  });

  const duplicates = sectionBlocks.map(b => ({
    ...JSON.parse(JSON.stringify(b)),
    id: `${b.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sectionId: newSectionId,
  }));

  const newBlocks = [
    ...blocks.slice(0, lastIndex + 1),
    ...duplicates,
    ...blocks.slice(lastIndex + 1),
  ];

  return { blocks: newBlocks, newSectionId };
}

/**
 * Delete all blocks in a section
 */
export function deleteSection(blocks: Block[], sectionId: string): Block[] {
  return blocks.filter(b => (b as any).sectionId !== sectionId);
}

/**
 * Remove a single block from its section (keep block, clear sectionId)
 */
export function extractFromSection(blocks: Block[], blockId: string): Block[] {
  return blocks.map(b => {
    if (b.id === blockId) {
      const { sectionId: _, ...rest } = b as any;
      return rest as Block;
    }
    return b;
  });
}

/**
 * Get the section ID for a block (if any)
 */
export function getBlockSectionId(block: Block): string | undefined {
  return (block as any).sectionId;
}

/**
 * Check if selected blocks can form a valid section
 * (must be 2+ non-profile blocks)
 */
export function canCreateSection(blocks: Block[], selectedIds: Set<string>): boolean {
  const eligible = [...selectedIds].filter(id => {
    const b = blocks.find(bl => bl.id === id);
    return b && b.type !== 'profile';
  });
  return eligible.length >= 2;
}

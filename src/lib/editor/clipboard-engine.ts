/**
 * Clipboard Engine - Copy/paste blocks and styles
 * P4: Block Editor Interaction OS
 */
import type { Block, BlockType } from '@/types/page';

export interface ClipboardData {
  type: 'block';
  block: Block;
  copiedAt: number;
}

export interface StyleData {
  type: 'style';
  blockType: BlockType;
  style: {
    blockSize?: string;
    backgroundColor?: string;
    textColor?: string;
    borderRadius?: string;
    padding?: string;
    animation?: string;
    [key: string]: unknown;
  };
  copiedAt: number;
}

export type ClipboardContent = ClipboardData | StyleData;

/**
 * Copy a full block to clipboard
 */
export function copyBlock(block: Block): ClipboardData {
  return {
    type: 'block',
    block: JSON.parse(JSON.stringify(block)),
    copiedAt: Date.now(),
  };
}

/**
 * Copy only the style properties of a block
 */
export function copyStyle(block: Block): StyleData {
  const blockAny = block as unknown as Record<string, unknown>;
  
  return {
    type: 'style',
    blockType: block.type as BlockType,
    style: {
      blockSize: blockAny.blockSize as string | undefined,
      backgroundColor: blockAny.backgroundColor as string | undefined,
      textColor: blockAny.textColor as string | undefined,
      borderRadius: blockAny.borderRadius as string | undefined,
      padding: blockAny.padding as string | undefined,
      animation: blockAny.animation as string | undefined,
    },
    copiedAt: Date.now(),
  };
}

/**
 * Create a new block from clipboard data at given position
 */
export function pasteBlock(clipboard: ClipboardData): Block {
  const newBlock = JSON.parse(JSON.stringify(clipboard.block));
  newBlock.id = `${newBlock.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return newBlock as Block;
}

/**
 * Apply style from clipboard to target block
 */
export function pasteStyle(style: StyleData, target: Block): Partial<Block> {
  // Only apply non-undefined style properties
  const updates: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(style.style)) {
    if (value !== undefined) {
      updates[key] = value;
    }
  }

  return updates as Partial<Block>;
}

/**
 * Check if style can be pasted from one block type to another
 */
export function canPasteStyle(fromType: BlockType, toType: BlockType): boolean {
  // Style paste is always allowed - we only copy visual properties
  // that are shared across all block types
  return true;
}

/**
 * Style compatibility matrix for block type conversion
 * Returns which fields can be safely transferred
 */
const STYLE_FIELDS = ['blockSize', 'backgroundColor', 'textColor', 'borderRadius', 'padding', 'animation'];

export function getTransferableStyleFields(fromType: BlockType, toType: BlockType): string[] {
  // All blocks share these common style fields
  return STYLE_FIELDS;
}

/**
 * Block type conversion compatibility
 * Defines which block types can be converted to each other
 */
const CONVERTIBLE_PAIRS: Record<string, string[]> = {
  button: ['link', 'messenger'],
  link: ['button'],
  messenger: ['button'],
  text: ['faq'],
  faq: ['text'],
};

export function canConvertBlock(fromType: BlockType, toType: BlockType): boolean {
  return CONVERTIBLE_PAIRS[fromType]?.includes(toType) ?? false;
}

export function getConvertibleTypes(blockType: BlockType): BlockType[] {
  return (CONVERTIBLE_PAIRS[blockType] ?? []) as BlockType[];
}

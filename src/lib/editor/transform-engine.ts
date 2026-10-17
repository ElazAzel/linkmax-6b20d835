/**
 * Transform Engine - Block type conversion with field transfer
 * P5: Replace / Transform system
 * 
 * Deterministic rules-based engine. No AI.
 * Defines compatibility matrix, field mappings, and lossy warnings.
 */
import type { Block, BlockType } from '@/types/page';

export interface TransformResult {
  success: boolean;
  newBlock: Block;
  transferredFields: string[];
  lostFields: string[];
}

interface TransformMapping {
  targets: BlockType[];
  fieldMap: Record<string, string>; // sourceField → targetField
  lossyFields: string[];
}

/**
 * Transform compatibility matrix
 * Each entry defines valid targets and how fields map between types.
 */
// Only conversions that keep the owner's content. Button and Link share
// { title, url }. The old map pointed at fields these blocks do not have
// (label, customLabel), so button → messenger made an empty block, and
// text → FAQ / FAQ → text / newsletter → form threw the content away.
const TRANSFORM_MAP: Partial<Record<BlockType, TransformMapping>> = {
  button: {
    targets: ['link'],
    fieldMap: { title: 'title', url: 'url', blockSize: 'blockSize' },
    lossyFields: [],
  },
  link: {
    targets: ['button'],
    fieldMap: { title: 'title', url: 'url', blockSize: 'blockSize' },
    lossyFields: [],
  },
};

/**
 * Check if a block type can be transformed to another
 */
export function canTransform(fromType: BlockType, toType: BlockType): boolean {
  const mapping = TRANSFORM_MAP[fromType];
  return mapping?.targets.includes(toType) ?? false;
}

/**
 * Get valid transform targets for a block type
 */
export function getTransformTargets(blockType: BlockType): BlockType[] {
  return TRANSFORM_MAP[blockType]?.targets ?? [];
}

/**
 * Get warnings about what fields will be lost in a transform
 */
export function getTransformWarning(fromType: BlockType, toType: BlockType): string[] {
  if (!canTransform(fromType, toType)) return [];
  return TRANSFORM_MAP[fromType]?.lossyFields ?? [];
}

/**
 * Transform a block to a new type, preserving compatible fields
 */
export function transformBlock(block: Block, toType: BlockType): TransformResult {
  const fromType = block.type as BlockType;
  const mapping = TRANSFORM_MAP[fromType];

  if (!mapping || !mapping.targets.includes(toType)) {
    return {
      success: false,
      newBlock: block,
      transferredFields: [],
      lostFields: [],
    };
  }

  const sourceData = block as unknown as Record<string, unknown>;
  const newBlock: Record<string, unknown> = {
    id: block.id,
    type: toType,
    blockSize: sourceData.blockSize,
    sectionId: sourceData.sectionId,
    createdAt: sourceData.createdAt,
  };

  // Transfer mapped fields
  const transferredFields: string[] = [];
  for (const [fromField, toField] of Object.entries(mapping.fieldMap)) {
    if (sourceData[fromField] !== undefined) {
      newBlock[toField] = sourceData[fromField];
      transferredFields.push(`${fromField} → ${toField}`);
    }
  }

  // Copy block style if present
  if (sourceData.blockStyle) {
    newBlock.blockStyle = sourceData.blockStyle;
    transferredFields.push('blockStyle');
  }

  return {
    success: true,
    newBlock: newBlock as unknown as Block,
    transferredFields,
    lostFields: mapping.lossyFields,
  };
}

/**
 * Check if a transform is safe (no data loss) or lossy
 */
export function isLossyTransform(fromType: BlockType, toType: BlockType): boolean {
  const mapping = TRANSFORM_MAP[fromType];
  return (mapping?.lossyFields.length ?? 0) > 0;
}

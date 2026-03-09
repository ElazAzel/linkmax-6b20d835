/**
 * Inline Edit Configuration - Registry of inline-editable fields per block type
 * P4: Block Editor Interaction OS
 */
import type { BlockType } from '@/types/page';

export interface InlineEditableField {
  /** Field path in block data (supports dot notation) */
  field: string;
  /** Type of inline editor to use */
  type: 'short' | 'text' | 'number';
  /** Placeholder text key for i18n */
  placeholderKey?: string;
  /** Maximum characters allowed */
  maxLength?: number;
  /** Whether this is the primary editable field */
  primary?: boolean;
}

/**
 * Registry of inline-editable fields per block type
 * Only primary fields support double-click inline editing
 */
export const INLINE_EDITABLE_FIELDS: Partial<Record<BlockType, InlineEditableField[]>> = {
  text: [
    { field: 'content', type: 'text', primary: true, maxLength: 2000 },
  ],
  button: [
    { field: 'label', type: 'short', primary: true, maxLength: 50 },
    { field: 'url', type: 'short', maxLength: 500 },
  ],
  link: [
    { field: 'label', type: 'short', primary: true, maxLength: 100 },
    { field: 'url', type: 'short', maxLength: 500 },
  ],
  messenger: [
    { field: 'customLabel', type: 'short', primary: true, maxLength: 50 },
    { field: 'username', type: 'short', maxLength: 100 },
  ],
  booking: [
    { field: 'title', type: 'short', primary: true, maxLength: 100 },
    { field: 'description', type: 'text', maxLength: 500 },
  ],
  testimonial: [
    { field: 'text', type: 'text', primary: true, maxLength: 500 },
    { field: 'author', type: 'short', maxLength: 50 },
  ],
  newsletter: [
    { field: 'title', type: 'short', primary: true, maxLength: 100 },
    { field: 'description', type: 'text', maxLength: 300 },
  ],
  download: [
    { field: 'title', type: 'short', primary: true, maxLength: 100 },
    { field: 'description', type: 'text', maxLength: 300 },
  ],
  image: [
    { field: 'alt', type: 'short', primary: true, maxLength: 150 },
  ],
  video: [
    { field: 'title', type: 'short', primary: true, maxLength: 100 },
  ],
  map: [
    { field: 'title', type: 'short', primary: true, maxLength: 100 },
    { field: 'address', type: 'text', maxLength: 200 },
  ],
  countdown: [
    { field: 'title', type: 'short', primary: true, maxLength: 100 },
  ],
  event: [
    { field: 'title', type: 'short', primary: true, maxLength: 100 },
    { field: 'description', type: 'text', maxLength: 500 },
  ],
};

/**
 * Get the primary inline-editable field for a block type
 */
export function getPrimaryEditableField(blockType: BlockType): InlineEditableField | null {
  const fields = INLINE_EDITABLE_FIELDS[blockType];
  return fields?.find(f => f.primary) ?? null;
}

/**
 * Check if a block type supports inline editing
 */
export function supportsInlineEdit(blockType: BlockType): boolean {
  return getPrimaryEditableField(blockType) !== null;
}

/**
 * Get all inline-editable fields for a block type
 */
export function getEditableFields(blockType: BlockType): InlineEditableField[] {
  return INLINE_EDITABLE_FIELDS[blockType] ?? [];
}

/**
 * Get value from block using dot notation path
 */
export function getFieldValue(block: Record<string, unknown>, fieldPath: string): unknown {
  const parts = fieldPath.split('.');
  let value: unknown = block;
  
  for (const part of parts) {
    if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  
  return value;
}

/**
 * Set value on block using dot notation path
 */
export function setFieldValue(
  block: Record<string, unknown>,
  fieldPath: string,
  value: unknown
): Record<string, unknown> {
  const parts = fieldPath.split('.');
  const result = { ...block };
  
  if (parts.length === 1) {
    result[parts[0]] = value;
    return result;
  }
  
  let current: Record<string, unknown> = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    } else {
      current[part] = { ...(current[part] as Record<string, unknown>) };
    }
    current = current[part] as Record<string, unknown>;
  }
  
  current[parts[parts.length - 1]] = value;
  return result;
}

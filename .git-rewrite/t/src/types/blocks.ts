/**
 * Block-related types for editor operations
 */
import type { Block, BlockType } from './page';

/**
 * Information about a deleted block for undo functionality
 */
export interface DeletedBlockInfo {
  block: Block;
  position: number;
  blockId: string;
  deletedAt: number;
}

/**
 * Standard props contract for all block editors
 */
export interface BlockEditorProps<T extends Block = Block> {
  block: T;
  onChange: (updates: Partial<T>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

/**
 * Base props for block editor form components (used by withBlockEditor HOC)
 */
export interface BaseBlockEditorFormProps {
  formData: Record<string, unknown>;
  onChange: (updates: Record<string, unknown>) => void;
}

/**
 * Block editor options for HOC configuration
 */
export interface BlockEditorOptions {
  isPremium?: boolean;
  description?: string;
  hint?: string;
  validate?: (formData: Record<string, unknown>) => string | null;
}

/**
 * Block insertion result
 */
export interface BlockInsertResult {
  success: boolean;
  blockId?: string;
  error?: string;
}

/**
 * Block operation result (generic)
 */
export interface BlockOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Block registry entry for extensibility
 */
export interface BlockRegistryEntry {
  type: BlockType;
  label: string;
  icon: string;
  isPremium: boolean;
  category: 'basic' | 'media' | 'interactive' | 'commerce' | 'advanced';
}

/**
 * Block categories for organization
 */
export const BLOCK_CATEGORIES = {
  basic: ['link', 'button', 'text', 'separator', 'avatar'],
  media: ['image', 'video', 'carousel', 'before_after'],
  interactive: ['form', 'messenger', 'map', 'faq', 'scratch', 'search'],
  commerce: ['product', 'catalog', 'pricing', 'download'],
  advanced: ['custom_code', 'newsletter', 'testimonial', 'countdown', 'socials'],
} as const;

/**
 * Get block category
 */
export function getBlockCategory(type: BlockType): keyof typeof BLOCK_CATEGORIES {
  for (const [category, types] of Object.entries(BLOCK_CATEGORIES)) {
    if ((types as readonly string[]).includes(type)) {
      return category as keyof typeof BLOCK_CATEGORIES;
    }
  }
  return 'basic';
}

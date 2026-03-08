/**
 * Block-related types for editor operations
 * 
 * NOTE: Block categories and getBlockCategory are now in @/lib/blocks/block-manifest.ts
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
  category: 'basic' | 'media' | 'interactive' | 'commerce' | 'advanced' | 'social';
}

/**
 * Block Entity - Core domain model for page blocks
 * Pure business logic, no external dependencies
 * 
 * BlockType, categories, and premium flags are defined in:
 * - @/types/blocks/base (BlockType union)
 * - @/lib/blocks/block-manifest.ts (BLOCK_MANIFEST — single source of truth)
 */

import type { MultilingualString } from '@/lib/i18n-helpers';

// Re-export BlockType from canonical source
export type { BlockType } from '@/types/blocks/base';
import type { BlockType } from '@/types/blocks/base';

// Re-export manifest helpers for backward compat
export { isBlockPremium as isPremiumBlockType, getBlockCategory } from '@/lib/blocks/block-manifest';

// ============= Value Objects =============

export type Currency = 
  | 'KZT' | 'RUB' | 'BYN' | 'AMD' | 'AZN' | 'KGS' | 'TJS' | 'TMT' | 'UZS' 
  | 'USD' | 'EUR' | 'GBP' | 'CNY' | 'JPY' | 'CHF' | 'CAD' | 'AUD';

export interface BlockStyle {
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  borderWidth?: 'none' | 'thin' | 'medium' | 'thick';
  borderColor?: string;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'glow';
  backgroundColor?: string;
  backgroundGradient?: string;
  backgroundOpacity?: number;
  hoverEffect?: 'none' | 'scale' | 'glow' | 'lift' | 'fade';
  animation?: 'none' | 'fade-in' | 'slide-up' | 'scale-in' | 'bounce';
  animationDelay?: number;
  animationSpeed?: 'slow' | 'normal' | 'fast';
}

export interface BlockSchedule {
  startDate?: string;
  endDate?: string;
}

export interface GridLayoutData {
  gridColumn?: number;
  gridRow?: number;
  gridWidth?: number;
  gridHeight?: number;
}

// ============= Base Block Interface =============

export interface BaseBlock {
  id: string;
  type: BlockType;
  schedule?: BlockSchedule;
  blockStyle?: BlockStyle;
  gridLayout?: GridLayoutData;
  createdAt?: string;
}

// ============= Domain Logic =============

/**
 * Check if block is currently scheduled to be visible
 */
export function isBlockScheduledVisible(block: BaseBlock, now: Date = new Date()): boolean {
  if (!block.schedule) return true;
  
  const { startDate, endDate } = block.schedule;
  const currentTime = now.getTime();
  
  if (startDate && new Date(startDate).getTime() > currentTime) {
    return false;
  }
  
  if (endDate && new Date(endDate).getTime() < currentTime) {
    return false;
  }
  
  return true;
}

/**
 * Generate a unique block ID
 */
export function generateBlockId(_type: BlockType): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (Number(c) ^ (Math.random() * 16 >> (Number(c) / 4))).toString(16)
  );
}

/**
 * Validate block has required fields
 */
export function validateBlock(block: BaseBlock): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!block.id) {
    errors.push('Block ID is required');
  }
  
  if (!block.type) {
    errors.push('Block type is required');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

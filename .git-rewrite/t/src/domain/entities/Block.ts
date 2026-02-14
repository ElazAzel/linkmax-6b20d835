/**
 * Block Entity - Core domain model for page blocks
 * Pure business logic, no external dependencies
 */

import type { MultilingualString } from '@/lib/i18n-helpers';

// ============= Value Objects =============

export type BlockType = 
  | 'profile' | 'link' | 'button' | 'socials' | 'text' | 'image' 
  | 'product' | 'video' | 'carousel' | 'search' | 'custom_code' 
  | 'messenger' | 'form' | 'download' | 'newsletter' | 'testimonial' 
  | 'scratch' | 'map' | 'avatar' | 'separator' | 'catalog' 
  | 'before_after' | 'faq' | 'countdown' | 'pricing' | 'shoutout' | 'booking' | 'community' | 'event';

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

// ============= Block Categories =============

export const BLOCK_CATEGORIES = {
  basic: ['link', 'button', 'text', 'separator', 'avatar'],
  media: ['image', 'video', 'carousel', 'before_after'],
  interactive: ['form', 'messenger', 'map', 'faq', 'scratch', 'search'],
  commerce: ['product', 'catalog', 'pricing', 'download'],
  advanced: ['custom_code', 'newsletter', 'testimonial', 'countdown', 'socials'],
  social: ['shoutout', 'community'],
} as const;

export const PREMIUM_BLOCK_TYPES: readonly BlockType[] = [
  'video', 'carousel', 'custom_code', 'form', 'newsletter', 
  'testimonial', 'scratch', 'catalog', 'countdown', 'booking',
  'before_after', 'download', 'product', 'pricing', 'shoutout', 'community', 'event',
];

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
 * Check if block type requires premium
 */
export function isPremiumBlockType(type: BlockType): boolean {
  return PREMIUM_BLOCK_TYPES.includes(type);
}

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
export function generateBlockId(type: BlockType): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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

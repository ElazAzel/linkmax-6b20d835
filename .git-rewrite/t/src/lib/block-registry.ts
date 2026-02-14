/**
 * Block Registry - Single source of truth for all block types
 * Provides type-safe block categorization and premium gating
 */

import type { BlockType } from '@/types/page';

// ============= Block Categories =============

/**
 * Free blocks available to all users
 */
export const FREE_BLOCK_TYPES = [
  'profile',
  'link',
  'button',
  'text',
  'separator',
  'avatar',
  'socials',
  'messenger',
  'image',
  'map',
  'faq',
] as const;

/**
 * Premium blocks requiring Pro subscription
 */
export const PREMIUM_BLOCK_TYPES = [
  'video',
  'carousel',
  'custom_code',
  'form',
  'newsletter',
  'testimonial',
  'scratch',
  'catalog',
  'countdown',
  'before_after',
  'download',
  'product',
  'pricing',
  'shoutout',
  'community',
  'booking',
  'event',
] as const;

/**
 * All block types combined
 */
export const ALL_BLOCK_TYPES = [
  ...FREE_BLOCK_TYPES,
  ...PREMIUM_BLOCK_TYPES,
] as const;

// ============= Type Exports =============

export type FreeBlockType = typeof FREE_BLOCK_TYPES[number];
export type PremiumBlockType = typeof PREMIUM_BLOCK_TYPES[number];

// ============= Type Guards =============

export function isFreeBlock(type: string): type is FreeBlockType {
  return (FREE_BLOCK_TYPES as readonly string[]).includes(type);
}

export function isPremiumBlock(type: string): type is PremiumBlockType {
  return (PREMIUM_BLOCK_TYPES as readonly string[]).includes(type);
}

export function isValidBlockType(type: string): type is BlockType {
  return (ALL_BLOCK_TYPES as readonly string[]).includes(type);
}

// ============= Block Metadata =============

export interface BlockMetadata {
  type: BlockType;
  category: 'basic' | 'media' | 'interactive' | 'commerce' | 'social' | 'advanced';
  isPremium: boolean;
  icon: string;
  labelKey: string;
}

export const BLOCK_METADATA: Record<BlockType, BlockMetadata> = {
  // Basic - Free
  profile: { type: 'profile', category: 'basic', isPremium: false, icon: 'user', labelKey: 'blocks.profile' },
  link: { type: 'link', category: 'basic', isPremium: false, icon: 'link', labelKey: 'blocks.link' },
  button: { type: 'button', category: 'basic', isPremium: false, icon: 'mouse-pointer', labelKey: 'blocks.button' },
  text: { type: 'text', category: 'basic', isPremium: false, icon: 'type', labelKey: 'blocks.text' },
  separator: { type: 'separator', category: 'basic', isPremium: false, icon: 'minus', labelKey: 'blocks.separator' },
  avatar: { type: 'avatar', category: 'basic', isPremium: false, icon: 'user-circle', labelKey: 'blocks.avatar' },
  socials: { type: 'socials', category: 'basic', isPremium: false, icon: 'share-2', labelKey: 'blocks.socials' },
  messenger: { type: 'messenger', category: 'basic', isPremium: false, icon: 'message-circle', labelKey: 'blocks.messenger' },
  
  // Media
  image: { type: 'image', category: 'media', isPremium: false, icon: 'image', labelKey: 'blocks.image' },
  video: { type: 'video', category: 'media', isPremium: true, icon: 'video', labelKey: 'blocks.video' },
  carousel: { type: 'carousel', category: 'media', isPremium: true, icon: 'images', labelKey: 'blocks.carousel' },
  before_after: { type: 'before_after', category: 'media', isPremium: true, icon: 'columns', labelKey: 'blocks.before_after' },
  
  // Interactive
  map: { type: 'map', category: 'interactive', isPremium: false, icon: 'map-pin', labelKey: 'blocks.map' },
  faq: { type: 'faq', category: 'interactive', isPremium: false, icon: 'help-circle', labelKey: 'blocks.faq' },
  form: { type: 'form', category: 'interactive', isPremium: true, icon: 'clipboard', labelKey: 'blocks.form' },
  scratch: { type: 'scratch', category: 'interactive', isPremium: true, icon: 'gift', labelKey: 'blocks.scratch' },
  countdown: { type: 'countdown', category: 'interactive', isPremium: true, icon: 'clock', labelKey: 'blocks.countdown' },
  custom_code: { type: 'custom_code', category: 'interactive', isPremium: true, icon: 'code', labelKey: 'blocks.custom_code' },
  
  // Commerce
  product: { type: 'product', category: 'commerce', isPremium: true, icon: 'shopping-bag', labelKey: 'blocks.product' },
  catalog: { type: 'catalog', category: 'commerce', isPremium: true, icon: 'grid', labelKey: 'blocks.catalog' },
  pricing: { type: 'pricing', category: 'commerce', isPremium: true, icon: 'tag', labelKey: 'blocks.pricing' },
  download: { type: 'download', category: 'commerce', isPremium: true, icon: 'download', labelKey: 'blocks.download' },
  booking: { type: 'booking', category: 'commerce', isPremium: true, icon: 'calendar', labelKey: 'blocks.booking' },
  
  // Social
  shoutout: { type: 'shoutout', category: 'social', isPremium: true, icon: 'megaphone', labelKey: 'blocks.shoutout' },
  community: { type: 'community', category: 'social', isPremium: true, icon: 'users', labelKey: 'blocks.community' },
  event: { type: 'event', category: 'social', isPremium: true, icon: 'calendar-days', labelKey: 'blocks.event' },
  testimonial: { type: 'testimonial', category: 'social', isPremium: true, icon: 'quote', labelKey: 'blocks.testimonial' },
  
  // Advanced
  newsletter: { type: 'newsletter', category: 'advanced', isPremium: true, icon: 'mail', labelKey: 'blocks.newsletter' },
};

/**
 * Get blocks by category
 */
export function getBlocksByCategory(category: BlockMetadata['category']): BlockMetadata[] {
  return Object.values(BLOCK_METADATA).filter(b => b.category === category);
}

/**
 * Get all free blocks
 */
export function getFreeBlocks(): BlockMetadata[] {
  return Object.values(BLOCK_METADATA).filter(b => !b.isPremium);
}

/**
 * Get all premium blocks
 */
export function getPremiumBlocks(): BlockMetadata[] {
  return Object.values(BLOCK_METADATA).filter(b => b.isPremium);
}

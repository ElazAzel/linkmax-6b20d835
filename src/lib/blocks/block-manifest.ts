/**
 * Block Manifest — Single source of truth for all block types.
 * 
 * Drives: rendering, editing, insertion, gating, analytics, testing.
 * Adding a new block = adding one entry here + type interface + renderer + editor.
 * 
 * If a block type exists in BlockType but NOT here, it will fail at compile time
 * (see BLOCK_MANIFEST_COMPLETENESS_CHECK at the bottom).
 */

import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { BlockType } from '@/types/blocks/base';
import type { Block } from '@/types/page';
import type { PremiumTier } from '@/hooks/user/usePremiumStatus';

// ============= Manifest Types =============

export interface BlockRendererProps {
  block: any;
  isPreview?: boolean;
  pageOwnerId?: string;
  pageId?: string;
  isOwnerPremium?: boolean;
  ownerTier?: PremiumTier;
  onClick?: () => void;
  onPlatformClick?: () => void;
}

export interface BlockEditorComponentProps {
  formData: any;
  onChange: (updates: any) => void;
  onComplete?: () => void;
}

export type BlockCategory = 'basic' | 'media' | 'interactive' | 'commerce' | 'social' | 'advanced';

export interface BlockManifestEntry {
  type: BlockType;
  category: BlockCategory;
  isPremium: boolean;
  icon: string;
  labelKey: string;
  /** Lazy-loaded public renderer component */
  renderer: LazyExoticComponent<ComponentType<any>>;
  /** Lazy-loaded editor component */
  editor: LazyExoticComponent<ComponentType<any>>;
  /** Rendering mode: 'trackable' wraps with PaidBlockWrapper+analytics, 'simple' uses only animation wrapper */
  renderMode: 'trackable' | 'simple';
  /** Extra renderer props mapping (e.g., onClick, onPlatformClick) */
  rendererPropsKeys?: string[];
}

// ============= Lazy Loaders =============

const lazyBlock = (path: string, exportName: string) =>
  lazy(() => import(`../../components/blocks/${path}`).then(m => ({ default: (m as any)[exportName] })));

const lazyEditor = (path: string, exportName: string) =>
  lazy(() => import(`../../components/block-editors/${path}`).then(m => ({ default: (m as any)[exportName] })));

// ============= The Manifest =============

export const BLOCK_MANIFEST: Record<BlockType, BlockManifestEntry> = {
  // === Basic (Free) ===
  profile: {
    type: 'profile',
    category: 'basic',
    isPremium: false,
    icon: 'User',
    labelKey: 'blockTypes.profile',
    renderer: lazyBlock('ProfileBlock', 'ProfileBlock'),
    editor: lazyEditor('ProfileEditorWizard', 'ProfileEditorWizard'),
    renderMode: 'simple',
  },
  link: {
    type: 'link',
    category: 'basic',
    isPremium: false,
    icon: 'Link',
    labelKey: 'blockTypes.link',
    renderer: lazyBlock('LinkBlock', 'LinkBlock'),
    editor: lazyEditor('LinkBlockEditor', 'LinkBlockEditor'),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  button: {
    type: 'button',
    category: 'basic',
    isPremium: false,
    icon: 'SquareMousePointer',
    labelKey: 'blockTypes.button',
    renderer: lazyBlock('ButtonBlock', 'ButtonBlock'),
    editor: lazyEditor('ButtonBlockEditor', 'ButtonBlockEditor'),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  text: {
    type: 'text',
    category: 'basic',
    isPremium: false,
    icon: 'Type',
    labelKey: 'blockTypes.text',
    renderer: lazyBlock('TextBlock', 'TextBlock'),
    editor: lazyEditor('TextBlockEditor', 'TextBlockEditor'),
    renderMode: 'simple',
  },
  separator: {
    type: 'separator',
    category: 'basic',
    isPremium: false,
    icon: 'Minus',
    labelKey: 'blockTypes.separator',
    renderer: lazyBlock('SeparatorBlock', 'SeparatorBlock'),
    editor: lazyEditor('SeparatorBlockEditor', 'SeparatorBlockEditor'),
    renderMode: 'simple',
  },
  avatar: {
    type: 'avatar',
    category: 'basic',
    isPremium: false,
    icon: 'UserCircle',
    labelKey: 'blockTypes.avatar',
    renderer: lazyBlock('AvatarBlock', 'AvatarBlock'),
    editor: lazyEditor('AvatarBlockEditor', 'AvatarBlockEditor'),
    renderMode: 'simple',
  },
  socials: {
    type: 'socials',
    category: 'basic',
    isPremium: false,
    icon: 'Share2',
    labelKey: 'blockTypes.socials',
    renderer: lazyBlock('SocialsBlock', 'SocialsBlock'),
    editor: lazyEditor('SocialsBlockEditor', 'SocialsBlockEditor'),
    renderMode: 'trackable',
    rendererPropsKeys: ['onPlatformClick'],
  },
  messenger: {
    type: 'messenger',
    category: 'basic',
    isPremium: false,
    icon: 'MessageCircle',
    labelKey: 'blockTypes.messenger',
    renderer: lazyBlock('MessengerBlock', 'MessengerBlock'),
    editor: lazyEditor('MessengerBlockEditor', 'MessengerBlockEditor'),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },

  // === Media ===
  image: {
    type: 'image',
    category: 'media',
    isPremium: false,
    icon: 'Image',
    labelKey: 'blockTypes.image',
    renderer: lazyBlock('ImageBlock', 'ImageBlock'),
    editor: lazyEditor('ImageBlockEditor', 'ImageBlockEditor'),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  video: {
    type: 'video',
    category: 'media',
    isPremium: true,
    icon: 'Video',
    labelKey: 'blockTypes.video',
    renderer: lazyBlock('VideoBlock', 'VideoBlock'),
    editor: lazyEditor('VideoBlockEditor', 'VideoBlockEditor'),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  carousel: {
    type: 'carousel',
    category: 'media',
    isPremium: true,
    icon: 'Images',
    labelKey: 'blockTypes.carousel',
    renderer: lazyBlock('CarouselBlock', 'CarouselBlock'),
    editor: lazyEditor('CarouselBlockEditor', 'CarouselBlockEditor'),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  before_after: {
    type: 'before_after',
    category: 'media',
    isPremium: true,
    icon: 'ArrowLeftRight',
    labelKey: 'blockTypes.beforeAfter',
    renderer: lazyBlock('BeforeAfterBlock', 'BeforeAfterBlock'),
    editor: lazyEditor('BeforeAfterBlockEditor', 'BeforeAfterBlockEditor'),
    renderMode: 'trackable',
  },

  // === Interactive ===
  map: {
    type: 'map',
    category: 'interactive',
    isPremium: false,
    icon: 'MapPin',
    labelKey: 'blockTypes.map',
    renderer: lazyBlock('MapBlock', 'MapBlock'),
    editor: lazyEditor('MapBlockEditor', 'MapBlockEditor'),
    renderMode: 'simple',
  },
  faq: {
    type: 'faq',
    category: 'interactive',
    isPremium: false,
    icon: 'HelpCircle',
    labelKey: 'blockTypes.faq',
    renderer: lazyBlock('FAQBlock', 'FAQBlock'),
    editor: lazyEditor('FAQBlockEditor', 'FAQBlockEditor'),
    renderMode: 'trackable',
  },
  form: {
    type: 'form',
    category: 'interactive',
    isPremium: false,
    icon: 'FileText',
    labelKey: 'blockTypes.form',
    renderer: lazyBlock('FormBlock', 'FormBlock'),
    editor: lazyEditor('FormBlockEditor', 'FormBlockEditor'),
    renderMode: 'trackable',
  },
  scratch: {
    type: 'scratch',
    category: 'interactive',
    isPremium: true,
    icon: 'Gift',
    labelKey: 'blockTypes.scratch',
    renderer: lazyBlock('ScratchBlock', 'ScratchBlock'),
    editor: lazyEditor('ScratchBlockEditor', 'ScratchBlockEditor'),
    renderMode: 'simple',
  },
  countdown: {
    type: 'countdown',
    category: 'interactive',
    isPremium: true,
    icon: 'Clock',
    labelKey: 'blockTypes.countdown',
    renderer: lazyBlock('CountdownBlock', 'CountdownBlock'),
    editor: lazyEditor('CountdownBlockEditor', 'CountdownBlockEditor'),
    renderMode: 'trackable',
  },
  custom_code: {
    type: 'custom_code',
    category: 'interactive',
    isPremium: true,
    icon: 'Code',
    labelKey: 'blockTypes.customCode',
    renderer: lazyBlock('CustomCodeBlock', 'CustomCodeBlock'),
    editor: lazyEditor('CustomCodeBlockEditor', 'CustomCodeBlockEditor'),
    renderMode: 'simple',
  },

  // === Commerce ===
  product: {
    type: 'product',
    category: 'commerce',
    isPremium: true,
    icon: 'ShoppingBag',
    labelKey: 'blockTypes.product',
    renderer: lazyBlock('ProductBlock', 'ProductBlock'),
    editor: lazyEditor('ProductBlockEditor', 'ProductBlockEditor'),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  catalog: {
    type: 'catalog',
    category: 'commerce',
    isPremium: true,
    icon: 'Grid',
    labelKey: 'blockTypes.catalog',
    renderer: lazyBlock('CatalogBlock', 'CatalogBlock'),
    editor: lazyEditor('CatalogBlockEditor', 'CatalogBlockEditor'),
    renderMode: 'trackable',
  },
  pricing: {
    type: 'pricing',
    category: 'commerce',
    isPremium: false,
    icon: 'DollarSign',
    labelKey: 'blockTypes.pricing',
    renderer: lazyBlock('PricingBlock', 'PricingBlock'),
    editor: lazyEditor('PricingBlockEditor', 'PricingBlockEditor'),
    renderMode: 'trackable',
  },
  download: {
    type: 'download',
    category: 'commerce',
    isPremium: true,
    icon: 'Download',
    labelKey: 'blockTypes.download',
    renderer: lazyBlock('DownloadBlock', 'DownloadBlock'),
    editor: lazyEditor('DownloadBlockEditor', 'DownloadBlockEditor'),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  booking: {
    type: 'booking',
    category: 'commerce',
    isPremium: false,
    icon: 'Calendar',
    labelKey: 'blockTypes.booking',
    renderer: lazyBlock('BookingBlock', 'BookingBlock'),
    editor: lazyEditor('BookingBlockEditor', 'BookingBlockEditor'),
    renderMode: 'trackable',
  },

  // === Social ===
  shoutout: {
    type: 'shoutout',
    category: 'social',
    isPremium: true,
    icon: 'Megaphone',
    labelKey: 'blockTypes.shoutout',
    renderer: lazyBlock('ShoutoutBlock', 'ShoutoutBlock'),
    editor: lazyEditor('ShoutoutBlockEditor', 'ShoutoutBlockEditor'),
    renderMode: 'trackable',
  },
  community: {
    type: 'community',
    category: 'social',
    isPremium: true,
    icon: 'Users',
    labelKey: 'blockTypes.community',
    renderer: lazyBlock('CommunityBlock', 'CommunityBlock'),
    editor: lazyEditor('CommunityBlockEditor', 'CommunityBlockEditor'),
    renderMode: 'trackable',
  },
  event: {
    type: 'event',
    category: 'social',
    isPremium: true,
    icon: 'CalendarDays',
    labelKey: 'blockTypes.event',
    renderer: lazyBlock('EventBlock', 'EventBlock'),
    editor: lazyEditor('EventBlockEditor', 'EventBlockEditor'),
    renderMode: 'trackable',
  },
  testimonial: {
    type: 'testimonial',
    category: 'social',
    isPremium: true,
    icon: 'Quote',
    labelKey: 'blockTypes.testimonial',
    renderer: lazyBlock('TestimonialBlock', 'TestimonialBlock'),
    editor: lazyEditor('TestimonialBlockEditor', 'TestimonialBlockEditor'),
    renderMode: 'simple',
  },

  // === Advanced ===
  newsletter: {
    type: 'newsletter',
    category: 'advanced',
    isPremium: true,
    icon: 'Mail',
    labelKey: 'blockTypes.newsletter',
    renderer: lazyBlock('NewsletterBlock', 'NewsletterBlock'),
    editor: lazyEditor('NewsletterBlockEditor', 'NewsletterBlockEditor'),
    renderMode: 'simple',
  },
};

// ============= Compile-time completeness check =============
// If a BlockType is missing from BLOCK_MANIFEST, this line will error.
const _manifestCheck: Record<BlockType, BlockManifestEntry> = BLOCK_MANIFEST;

// ============= Derived helpers =============

/** Get manifest entry for a block type (safe) */
export function getManifestEntry(type: BlockType): BlockManifestEntry | undefined {
  return BLOCK_MANIFEST[type];
}

/** Check if a block type is premium */
export function isBlockPremium(type: BlockType): boolean {
  return BLOCK_MANIFEST[type]?.isPremium ?? false;
}

/** Check if a block type is free */
export function isBlockFree(type: BlockType): boolean {
  return !isBlockPremium(type);
}

/** Get all block types by category */
export function getBlockTypesByCategory(category: BlockCategory): BlockType[] {
  return (Object.values(BLOCK_MANIFEST) as BlockManifestEntry[])
    .filter(e => e.category === category)
    .map(e => e.type);
}

/** Get all free block types */
export function getFreeBlockTypes(): BlockType[] {
  return (Object.values(BLOCK_MANIFEST) as BlockManifestEntry[])
    .filter(e => !e.isPremium)
    .map(e => e.type);
}

/** Get all premium block types */
export function getPremiumBlockTypes(): BlockType[] {
  return (Object.values(BLOCK_MANIFEST) as BlockManifestEntry[])
    .filter(e => e.isPremium)
    .map(e => e.type);
}

/** Get all block types */
export function getAllBlockTypes(): BlockType[] {
  return Object.keys(BLOCK_MANIFEST) as BlockType[];
}

/** Get icon for a block type */
export function getBlockIcon(type: BlockType): string {
  return BLOCK_MANIFEST[type]?.icon ?? 'Box';
}

/** Get category for a block type */
export function getBlockCategory(type: BlockType): BlockCategory {
  return BLOCK_MANIFEST[type]?.category ?? 'basic';
}

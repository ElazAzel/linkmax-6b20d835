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

// ============= The Manifest =============

export const BLOCK_MANIFEST: Record<BlockType, BlockManifestEntry> = {
  // === Basic (Free) ===
  profile: {
    type: 'profile',
    category: 'basic',
    isPremium: false,
    icon: 'User',
    labelKey: 'blockTypes.profile',
    renderer: lazy(() => import('@/components/blocks/ProfileBlock').then(m => ({ default: m.ProfileBlock }))),
    editor: lazy(() => import('@/components/block-editors/ProfileEditorWizard').then(m => ({ default: m.ProfileEditorWizard }))),
    renderMode: 'simple',
  },
  link: {
    type: 'link',
    category: 'basic',
    isPremium: false,
    icon: 'Link',
    labelKey: 'blockTypes.link',
    renderer: lazy(() => import('@/components/blocks/LinkBlock').then(m => ({ default: m.LinkBlock }))),
    editor: lazy(() => import('@/components/block-editors/LinkBlockEditor').then(m => ({ default: m.LinkBlockEditor }))),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  button: {
    type: 'button',
    category: 'basic',
    isPremium: false,
    icon: 'SquareMousePointer',
    labelKey: 'blockTypes.button',
    renderer: lazy(() => import('@/components/blocks/ButtonBlock').then(m => ({ default: m.ButtonBlock }))),
    editor: lazy(() => import('@/components/block-editors/ButtonBlockEditor').then(m => ({ default: m.ButtonBlockEditor }))),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  text: {
    type: 'text',
    category: 'basic',
    isPremium: false,
    icon: 'Type',
    labelKey: 'blockTypes.text',
    renderer: lazy(() => import('@/components/blocks/TextBlock').then(m => ({ default: m.TextBlock }))),
    editor: lazy(() => import('@/components/block-editors/TextBlockEditor').then(m => ({ default: m.TextBlockEditor }))),
    renderMode: 'simple',
  },
  separator: {
    type: 'separator',
    category: 'basic',
    isPremium: false,
    icon: 'Minus',
    labelKey: 'blockTypes.separator',
    renderer: lazy(() => import('@/components/blocks/SeparatorBlock').then(m => ({ default: m.SeparatorBlock }))),
    editor: lazy(() => import('@/components/block-editors/SeparatorBlockEditor').then(m => ({ default: m.SeparatorBlockEditor }))),
    renderMode: 'simple',
  },
  avatar: {
    type: 'avatar',
    category: 'basic',
    isPremium: false,
    icon: 'UserCircle',
    labelKey: 'blockTypes.avatar',
    renderer: lazy(() => import('@/components/blocks/AvatarBlock').then(m => ({ default: m.AvatarBlock }))),
    editor: lazy(() => import('@/components/block-editors/AvatarBlockEditor').then(m => ({ default: m.AvatarBlockEditor }))),
    renderMode: 'simple',
  },
  socials: {
    type: 'socials',
    category: 'basic',
    isPremium: false,
    icon: 'Share2',
    labelKey: 'blockTypes.socials',
    renderer: lazy(() => import('@/components/blocks/SocialsBlock').then(m => ({ default: m.SocialsBlock }))),
    editor: lazy(() => import('@/components/block-editors/SocialsBlockEditor').then(m => ({ default: m.SocialsBlockEditor }))),
    renderMode: 'trackable',
    rendererPropsKeys: ['onPlatformClick'],
  },
  messenger: {
    type: 'messenger',
    category: 'basic',
    isPremium: false,
    icon: 'MessageCircle',
    labelKey: 'blockTypes.messenger',
    renderer: lazy(() => import('@/components/blocks/MessengerBlock').then(m => ({ default: m.MessengerBlock }))),
    editor: lazy(() => import('@/components/block-editors/MessengerBlockEditor').then(m => ({ default: m.MessengerBlockEditor }))),
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
    renderer: lazy(() => import('@/components/blocks/ImageBlock').then(m => ({ default: m.ImageBlock }))),
    editor: lazy(() => import('@/components/block-editors/ImageBlockEditor').then(m => ({ default: m.ImageBlockEditor }))),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  video: {
    type: 'video',
    category: 'media',
    isPremium: true,
    icon: 'Video',
    labelKey: 'blockTypes.video',
    renderer: lazy(() => import('@/components/blocks/VideoBlock').then(m => ({ default: m.VideoBlock }))),
    editor: lazy(() => import('@/components/block-editors/VideoBlockEditor').then(m => ({ default: m.VideoBlockEditor }))),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  carousel: {
    type: 'carousel',
    category: 'media',
    isPremium: true,
    icon: 'Images',
    labelKey: 'blockTypes.carousel',
    renderer: lazy(() => import('@/components/blocks/CarouselBlock').then(m => ({ default: m.CarouselBlock }))),
    editor: lazy(() => import('@/components/block-editors/CarouselBlockEditor').then(m => ({ default: m.CarouselBlockEditor }))),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  before_after: {
    type: 'before_after',
    category: 'media',
    isPremium: true,
    icon: 'ArrowLeftRight',
    labelKey: 'blockTypes.beforeAfter',
    renderer: lazy(() => import('@/components/blocks/BeforeAfterBlock').then(m => ({ default: m.BeforeAfterBlock }))),
    editor: lazy(() => import('@/components/block-editors/BeforeAfterBlockEditor').then(m => ({ default: m.BeforeAfterBlockEditor }))),
    renderMode: 'trackable',
  },

  // === Interactive ===
  map: {
    type: 'map',
    category: 'interactive',
    isPremium: false,
    icon: 'MapPin',
    labelKey: 'blockTypes.map',
    renderer: lazy(() => import('@/components/blocks/MapBlock').then(m => ({ default: m.MapBlock }))),
    editor: lazy(() => import('@/components/block-editors/MapBlockEditor').then(m => ({ default: m.MapBlockEditor }))),
    renderMode: 'simple',
  },
  faq: {
    type: 'faq',
    category: 'interactive',
    isPremium: false,
    icon: 'HelpCircle',
    labelKey: 'blockTypes.faq',
    renderer: lazy(() => import('@/components/blocks/FAQBlock').then(m => ({ default: m.FAQBlock }))),
    editor: lazy(() => import('@/components/block-editors/FAQBlockEditor').then(m => ({ default: m.FAQBlockEditor }))),
    renderMode: 'trackable',
  },
  form: {
    type: 'form',
    category: 'interactive',
    isPremium: false,
    icon: 'FileText',
    labelKey: 'blockTypes.form',
    renderer: lazy(() => import('@/components/blocks/FormBlock').then(m => ({ default: m.FormBlock }))),
    editor: lazy(() => import('@/components/block-editors/FormBlockEditor').then(m => ({ default: m.FormBlockEditor }))),
    renderMode: 'trackable',
  },
  scratch: {
    type: 'scratch',
    category: 'interactive',
    isPremium: true,
    icon: 'Gift',
    labelKey: 'blockTypes.scratch',
    renderer: lazy(() => import('@/components/blocks/ScratchBlock').then(m => ({ default: m.ScratchBlock }))),
    editor: lazy(() => import('@/components/block-editors/ScratchBlockEditor').then(m => ({ default: m.ScratchBlockEditor }))),
    renderMode: 'simple',
  },
  countdown: {
    type: 'countdown',
    category: 'interactive',
    isPremium: true,
    icon: 'Clock',
    labelKey: 'blockTypes.countdown',
    renderer: lazy(() => import('@/components/blocks/CountdownBlock').then(m => ({ default: m.CountdownBlock }))),
    editor: lazy(() => import('@/components/block-editors/CountdownBlockEditor').then(m => ({ default: m.CountdownBlockEditor }))),
    renderMode: 'trackable',
  },
  custom_code: {
    type: 'custom_code',
    category: 'interactive',
    isPremium: true,
    icon: 'Code',
    labelKey: 'blockTypes.customCode',
    renderer: lazy(() => import('@/components/blocks/CustomCodeBlock').then(m => ({ default: m.CustomCodeBlock }))),
    editor: lazy(() => import('@/components/block-editors/CustomCodeBlockEditor').then(m => ({ default: m.CustomCodeBlockEditor }))),
    renderMode: 'simple',
  },

  // === Commerce ===
  product: {
    type: 'product',
    category: 'commerce',
    isPremium: true,
    icon: 'ShoppingBag',
    labelKey: 'blockTypes.product',
    renderer: lazy(() => import('@/components/blocks/ProductBlock').then(m => ({ default: m.ProductBlock }))),
    editor: lazy(() => import('@/components/block-editors/ProductBlockEditor').then(m => ({ default: m.ProductBlockEditor }))),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  catalog: {
    type: 'catalog',
    category: 'commerce',
    isPremium: true,
    icon: 'Grid',
    labelKey: 'blockTypes.catalog',
    renderer: lazy(() => import('@/components/blocks/CatalogBlock').then(m => ({ default: m.CatalogBlock }))),
    editor: lazy(() => import('@/components/block-editors/CatalogBlockEditor').then(m => ({ default: m.CatalogBlockEditor }))),
    renderMode: 'trackable',
  },
  pricing: {
    type: 'pricing',
    category: 'commerce',
    isPremium: false,
    icon: 'DollarSign',
    labelKey: 'blockTypes.pricing',
    renderer: lazy(() => import('@/components/blocks/PricingBlock').then(m => ({ default: m.PricingBlock }))),
    editor: lazy(() => import('@/components/block-editors/PricingBlockEditor').then(m => ({ default: m.PricingBlockEditor }))),
    renderMode: 'trackable',
  },
  download: {
    type: 'download',
    category: 'commerce',
    isPremium: true,
    icon: 'Download',
    labelKey: 'blockTypes.download',
    renderer: lazy(() => import('@/components/blocks/DownloadBlock').then(m => ({ default: m.DownloadBlock }))),
    editor: lazy(() => import('@/components/block-editors/DownloadBlockEditor').then(m => ({ default: m.DownloadBlockEditor }))),
    renderMode: 'trackable',
    rendererPropsKeys: ['onClick'],
  },
  booking: {
    type: 'booking',
    category: 'commerce',
    isPremium: false,
    icon: 'Calendar',
    labelKey: 'blockTypes.booking',
    renderer: lazy(() => import('@/components/blocks/BookingBlock').then(m => ({ default: m.BookingBlock }))),
    editor: lazy(() => import('@/components/block-editors/BookingBlockEditor').then(m => ({ default: m.BookingBlockEditor }))),
    renderMode: 'trackable',
  },

  // === Social ===
  shoutout: {
    type: 'shoutout',
    category: 'social',
    isPremium: true,
    icon: 'Megaphone',
    labelKey: 'blockTypes.shoutout',
    renderer: lazy(() => import('@/components/blocks/ShoutoutBlock').then(m => ({ default: m.ShoutoutBlock }))),
    editor: lazy(() => import('@/components/block-editors/ShoutoutBlockEditor').then(m => ({ default: m.ShoutoutBlockEditor }))),
    renderMode: 'trackable',
  },
  community: {
    type: 'community',
    category: 'social',
    isPremium: true,
    icon: 'Users',
    labelKey: 'blockTypes.community',
    renderer: lazy(() => import('@/components/blocks/CommunityBlock').then(m => ({ default: m.CommunityBlock }))),
    editor: lazy(() => import('@/components/block-editors/CommunityBlockEditor').then(m => ({ default: m.CommunityBlockEditor }))),
    renderMode: 'trackable',
  },
  event: {
    type: 'event',
    category: 'social',
    isPremium: true,
    icon: 'CalendarDays',
    labelKey: 'blockTypes.event',
    renderer: lazy(() => import('@/components/blocks/EventBlock').then(m => ({ default: m.EventBlock }))),
    editor: lazy(() => import('@/components/block-editors/EventBlockEditor').then(m => ({ default: m.EventBlockEditor }))),
    renderMode: 'trackable',
  },
  testimonial: {
    type: 'testimonial',
    category: 'social',
    isPremium: true,
    icon: 'Quote',
    labelKey: 'blockTypes.testimonial',
    renderer: lazy(() => import('@/components/blocks/TestimonialBlock').then(m => ({ default: m.TestimonialBlock }))),
    editor: lazy(() => import('@/components/block-editors/TestimonialBlockEditor').then(m => ({ default: m.TestimonialBlockEditor }))),
    renderMode: 'simple',
  },

  // === Advanced ===
  newsletter: {
    type: 'newsletter',
    category: 'advanced',
    isPremium: true,
    icon: 'Mail',
    labelKey: 'blockTypes.newsletter',
    renderer: lazy(() => import('@/components/blocks/NewsletterBlock').then(m => ({ default: m.NewsletterBlock }))),
    editor: lazy(() => import('@/components/block-editors/NewsletterBlockEditor').then(m => ({ default: m.NewsletterBlockEditor }))),
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
  // Promo: all blocks are free until end of 2026
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { isBlocksFreePromoActive } = require('@/lib/promo/free-blocks-promo');
  if (isBlocksFreePromoActive()) return false;
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

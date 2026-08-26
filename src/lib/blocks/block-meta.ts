/**
 * Optional block metadata (Phase 1).
 *
 * Kept OUTSIDE BLOCK_MANIFEST on purpose: the manifest stays the compile-time
 * source of truth for rendering/editing, while this layer adds art-direction
 * and business metadata that is safe to extend without touching rendering.
 *
 * All fields are optional; blocks with no entry keep working exactly as before.
 */

import type { BlockType } from '@/types/blocks/base';
import type { CompositionId } from '@/lib/design/composition';
import type { SemanticRole } from '@/lib/design/block-variants';

export type BusinessIntent =
  | 'start'
  | 'explain'
  | 'show'
  | 'trust'
  | 'sell'
  | 'capture'
  | 'book'
  | 'events'
  | 'community'
  | 'contact';

export type DataBinding =
  | 'business'
  | 'services'
  | 'products'
  | 'booking'
  | 'testimonials'
  | 'events'
  | 'contacts';

export interface BlockMeta {
  niches?: string[];
  intents?: BusinessIntent[];
  semanticRole?: SemanticRole;
  variants?: string[];
  compositions?: CompositionId[];
  dataBindings?: DataBinding[];
  /** Blocks that typically look good next to this one. */
  recommendedWith?: BlockType[];
}

export const BLOCK_META: Partial<Record<BlockType, BlockMeta>> = {
  profile: {
    intents: ['start', 'trust'],
    semanticRole: 'headline',
    compositions: ['editorial-hero', 'split-hero', 'overlap-portrait'],
    dataBindings: ['business'],
    recommendedWith: ['text', 'button', 'socials'],
  },
  text: {
    intents: ['start', 'explain'],
    semanticRole: 'body',
    variants: ['display-oversized', 'editorial-lead', 'label-eyebrow', 'metric-big'],
    recommendedWith: ['button', 'image'],
  },
  button: {
    intents: ['capture', 'book', 'contact'],
    semanticRole: 'label',
    variants: ['button-pill-quiet', 'button-solid-bold'],
    recommendedWith: ['text'],
  },
  link: { intents: ['show', 'contact'], variants: ['button-pill-quiet'] },
  socials: { intents: ['community', 'contact'], dataBindings: ['contacts'] },
  image: {
    intents: ['show'],
    variants: ['media-full-bleed', 'media-editorial-crop', 'media-floating'],
    compositions: ['overlap-portrait', 'project-spotlight', 'horizontal-projects'],
  },
  carousel: { intents: ['show'], compositions: ['horizontal-projects'] },
  video: { intents: ['show', 'explain'], variants: ['media-full-bleed'], compositions: ['cinematic-video'] },
  before_after: { niches: ['beauty', 'fitness', 'medical'], intents: ['trust', 'show'] },
  testimonial: { intents: ['trust'], dataBindings: ['testimonials'], compositions: ['bento-proof'] },
  pricing: { intents: ['sell'], dataBindings: ['services', 'products'] },
  product: { intents: ['sell'], dataBindings: ['products'] },
  catalog: { intents: ['sell'], dataBindings: ['products'], compositions: ['bento-proof'] },
  booking: {
    niches: ['beauty', 'expert', 'tutor', 'local-service'],
    intents: ['book'],
    dataBindings: ['booking', 'services'],
  },
  event: { intents: ['events'], dataBindings: ['events'] },
  community: { intents: ['community'] },
  form: { intents: ['capture'], dataBindings: ['contacts'] },
  newsletter: { intents: ['capture'] },
  messenger: { intents: ['contact', 'capture'], dataBindings: ['contacts'] },
  faq: { intents: ['explain', 'trust'] },
  countdown: { intents: ['sell'] },
  map: { intents: ['contact'], dataBindings: ['business'] },
  shoutout: { intents: ['trust'] },
  download: { intents: ['capture'] },
};

export function getBlockMeta(type: BlockType): BlockMeta {
  return BLOCK_META[type] ?? {};
}

export function getBlocksForIntent(intent: BusinessIntent): BlockType[] {
  return (Object.keys(BLOCK_META) as BlockType[]).filter((t) =>
    BLOCK_META[t]?.intents?.includes(intent),
  );
}

import type { BlockType, BlockSizePreset } from '@/types/blocks/base';
import { resolveBlockLayout } from '@/lib/appearance/block-appearance';
import * as validators from './block-validators';
import { getSafeAudioUrl } from './audio';

export type BlockTool = 'size' | 'text' | 'font' | 'appearance' | 'image' | 'action';
export interface BlockEditingConfig {
  tools: readonly BlockTool[];
  allowedSizes: readonly BlockSizePreset[];
  validate: (value: unknown) => string | null;
}
const adapt = <T>(validate: (value: T) => string | null) => (value: unknown) => validate(value as T);
const validation: Partial<Record<BlockType, BlockEditingConfig['validate']>> = {
  link: adapt(validators.validateLinkBlock), button: adapt(validators.validateButtonBlock),
  image: adapt(validators.validateImageBlock), video: adapt(validators.validateVideoBlock),
  carousel: adapt(validators.validateCarouselBlock), socials: adapt(validators.validateSocialsBlock),
  product: adapt(validators.validateProductBlock), custom_code: adapt(validators.validateCustomCodeBlock),
  messenger: adapt(validators.validateMessengerBlock), form: adapt(validators.validateFormBlock),
  event: adapt(validators.validateEventBlock), download: adapt(validators.validateDownloadBlock),
  newsletter: adapt(validators.validateNewsletterBlock), testimonial: adapt(validators.validateTestimonialBlock),
  scratch: adapt(validators.validateScratchBlock), map: adapt(validators.validateMapBlock),
  avatar: adapt(validators.validateAvatarBlock), separator: adapt(validators.validateSeparatorBlock),
  catalog: adapt(validators.validateCatalogBlock),
  card: adapt(validators.validateCardBlock), tiles: adapt(validators.validateTilesBlock),
  audio: value => {
    const block = value as { sourceType?: string; fileUrl?: string; externalUrl?: string };
    return getSafeAudioUrl(block.sourceType === 'external' ? block.externalUrl : block.fileUrl) ? null : 'audioBlock.invalidUrl';
  },
};
const imageTypes = new Set<BlockType>(['profile', 'image', 'avatar', 'carousel', 'before_after', 'product', 'audio', 'event']);
const actionTypes = new Set<BlockType>(['link', 'button', 'image', 'socials', 'messenger', 'download', 'form', 'booking', 'product', 'pricing', 'catalog', 'event', 'community', 'newsletter', 'audio']);
const TILE_SIZES: readonly BlockSizePreset[] = ['small', 'wide', 'tall', 'large', 'xl'];
const FULL_WIDTH: readonly BlockSizePreset[] = ['full'];

export function getBlockEditingConfig(type: BlockType): BlockEditingConfig {
  // Ask about a tile size: an image is only auto-height at its default size.
  const autoHeight = resolveBlockLayout({ type, blockSize: 'small' }).autoHeight;
  return {
    tools: ['appearance', 'text', 'font', ...(!autoHeight ? ['size' as const] : []), ...(imageTypes.has(type) ? ['image' as const] : []), ...(actionTypes.has(type) ? ['action' as const] : [])],
    allowedSizes: autoHeight ? FULL_WIDTH : type === 'image' ? ['full', ...TILE_SIZES] : TILE_SIZES,
    validate: validation[type] ?? (() => null),
  };
}

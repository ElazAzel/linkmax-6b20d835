/**
 * Niche Heuristic Packs — config-driven niche intelligence
 * Maps each niche to ideal block stacks, critical signals, and scoring weights.
 */

import type { BlockType } from '@/types/blocks/base';
import type { NichePack } from './types';
import { mapNicheToPageNiche, type PageNiche } from '@/lib/blocks/block-recommendations';

const PACKS: Record<string, NichePack> = {
  freelancer: {
    id: 'freelancer',
    idealStack: ['profile', 'text', 'pricing', 'testimonial', 'booking', 'faq', 'messenger', 'socials'],
    criticalBlocks: ['pricing', 'booking', 'messenger'],
    trustBlocks: ['testimonial', 'before_after'],
    ctaBlocks: ['booking', 'messenger', 'form'],
    presetIds: ['pricing_services_3', 'booking_appointment', 'messenger_whatsapp', 'faq_starter_3q', 'testimonial_single'],
    blockWeights: { pricing: 1.3, booking: 1.3, testimonial: 1.2, messenger: 1.1, faq: 1.1 },
  },
  business: {
    id: 'business',
    idealStack: ['profile', 'text', 'pricing', 'testimonial', 'map', 'messenger', 'faq', 'socials'],
    criticalBlocks: ['messenger', 'pricing', 'map'],
    trustBlocks: ['testimonial'],
    ctaBlocks: ['messenger', 'form', 'booking'],
    presetIds: ['messenger_whatsapp', 'pricing_services_3', 'faq_starter_3q', 'testimonial_single'],
    blockWeights: { messenger: 1.3, map: 1.2, pricing: 1.2, form: 1.1 },
  },
  creator: {
    id: 'creator',
    idealStack: ['profile', 'socials', 'video', 'carousel', 'link', 'community', 'messenger'],
    criticalBlocks: ['socials', 'link'],
    trustBlocks: ['testimonial', 'community'],
    ctaBlocks: ['link', 'messenger', 'newsletter'],
    presetIds: ['socials_instagram_tiktok', 'newsletter_subscribe', 'messenger_telegram'],
    blockWeights: { socials: 1.3, video: 1.2, link: 1.2, community: 1.1 },
  },
  education: {
    id: 'education',
    idealStack: ['profile', 'text', 'pricing', 'testimonial', 'booking', 'faq', 'video', 'messenger'],
    criticalBlocks: ['booking', 'pricing'],
    trustBlocks: ['testimonial', 'video'],
    ctaBlocks: ['booking', 'form', 'messenger'],
    presetIds: ['booking_appointment', 'pricing_services_3', 'faq_starter_3q', 'testimonial_single'],
    blockWeights: { booking: 1.3, pricing: 1.2, testimonial: 1.2, video: 1.1 },
  },
  events: {
    id: 'events',
    idealStack: ['profile', 'event', 'countdown', 'carousel', 'map', 'form', 'testimonial', 'socials'],
    criticalBlocks: ['event', 'form'],
    trustBlocks: ['testimonial', 'carousel'],
    ctaBlocks: ['form', 'messenger', 'event'],
    presetIds: ['faq_starter_3q', 'socials_instagram_tiktok', 'messenger_whatsapp'],
    blockWeights: { event: 1.4, countdown: 1.2, map: 1.2, form: 1.1 },
  },
  portfolio: {
    id: 'portfolio',
    idealStack: ['profile', 'carousel', 'before_after', 'testimonial', 'pricing', 'socials', 'form'],
    criticalBlocks: ['carousel', 'pricing'],
    trustBlocks: ['testimonial', 'before_after'],
    ctaBlocks: ['form', 'messenger'],
    presetIds: ['pricing_services_3', 'testimonial_single', 'socials_instagram_tiktok'],
    blockWeights: { carousel: 1.3, before_after: 1.3, testimonial: 1.2 },
  },
  health: {
    id: 'health',
    idealStack: ['profile', 'text', 'pricing', 'before_after', 'testimonial', 'booking', 'faq', 'messenger'],
    criticalBlocks: ['booking', 'pricing', 'testimonial'],
    trustBlocks: ['testimonial', 'before_after'],
    ctaBlocks: ['booking', 'messenger'],
    presetIds: ['booking_appointment', 'pricing_services_3', 'testimonial_single', 'messenger_whatsapp'],
    blockWeights: { booking: 1.3, before_after: 1.3, testimonial: 1.2, pricing: 1.2 },
  },
  ecommerce: {
    id: 'ecommerce',
    idealStack: ['profile', 'catalog', 'product', 'testimonial', 'faq', 'messenger'],
    criticalBlocks: ['product', 'catalog', 'messenger'],
    trustBlocks: ['testimonial'],
    ctaBlocks: ['messenger', 'form'],
    presetIds: ['messenger_whatsapp', 'faq_starter_3q', 'testimonial_single'],
    blockWeights: { product: 1.4, catalog: 1.3, testimonial: 1.2, messenger: 1.1 },
  },
  community: {
    id: 'community',
    idealStack: ['profile', 'community', 'event', 'messenger', 'socials', 'newsletter', 'faq'],
    criticalBlocks: ['community', 'messenger'],
    trustBlocks: ['testimonial'],
    ctaBlocks: ['messenger', 'newsletter', 'event'],
    presetIds: ['messenger_telegram', 'newsletter_subscribe', 'socials_instagram_tiktok'],
    blockWeights: { community: 1.4, event: 1.2, messenger: 1.2, newsletter: 1.1 },
  },
};

/** Default / general fallback pack */
const GENERAL_PACK: NichePack = {
  id: 'general',
  idealStack: ['profile', 'text', 'socials', 'messenger', 'link'],
  criticalBlocks: ['messenger'],
  trustBlocks: ['testimonial'],
  ctaBlocks: ['messenger', 'button', 'form'],
  presetIds: ['messenger_whatsapp', 'socials_instagram_tiktok', 'button_cta_primary'],
  blockWeights: {},
};

/**
 * Get niche pack for a given niche string.
 * Maps through the existing mapNicheToPageNiche, then resolves pack.
 */
export function getNichePack(niche?: string): NichePack {
  if (!niche) return GENERAL_PACK;
  const pageNiche = mapNicheToPageNiche(niche);
  return PACKS[pageNiche] || GENERAL_PACK;
}

export function getAllNichePacks(): Record<string, NichePack> {
  return { ...PACKS, general: GENERAL_PACK };
}

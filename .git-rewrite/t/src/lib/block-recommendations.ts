/**
 * Block Recommendations System
 * Provides niche-based block recommendations for the Block Picker
 */

import type { BlockType } from '@/types/page';
import type { Niche } from './niches';
import { BLOCK_METADATA } from './block-registry';

// ============= Niche Detection =============

export type PageNiche = 
  | 'creator'        // Content creators, influencers
  | 'freelancer'     // Freelancers, consultants
  | 'business'       // Businesses, companies
  | 'education'      // Teachers, coaches, courses
  | 'events'         // Event organizers
  | 'portfolio'      // Artists, designers, photographers
  | 'ecommerce'      // Online stores, product sellers
  | 'health'         // Health, fitness, wellness
  | 'community'      // Community leaders, groups
  | 'general';       // General / undetected

/**
 * Map existing niches to PageNiche categories
 */
export function mapNicheToPageNiche(niche?: Niche | string): PageNiche {
  if (!niche) return 'general';
  
  const nicheMap: Record<string, PageNiche> = {
    // Niche → PageNiche mapping
    beauty: 'freelancer',
    fitness: 'health',
    food: 'business',
    education: 'education',
    art: 'portfolio',
    music: 'creator',
    tech: 'freelancer',
    business: 'business',
    health: 'health',
    fashion: 'portfolio',
    travel: 'creator',
    realestate: 'business',
    events: 'events',
    services: 'freelancer',
    other: 'general',
  };
  
  return nicheMap[niche] || 'general';
}

// ============= Block Weights by Niche =============

type BlockWeight = {
  block: BlockType;
  weight: number;
  reason: string; // i18n key for tooltip
};

/**
 * Weight tables for each niche
 * Higher weight = more relevant
 */
const NICHE_WEIGHTS: Record<PageNiche, BlockWeight[]> = {
  creator: [
    { block: 'socials', weight: 100, reason: 'recommendations.reason.socials_creator' },
    { block: 'video', weight: 95, reason: 'recommendations.reason.video_creator' },
    { block: 'carousel', weight: 90, reason: 'recommendations.reason.carousel_creator' },
    { block: 'link', weight: 85, reason: 'recommendations.reason.link_creator' },
    { block: 'testimonial', weight: 80, reason: 'recommendations.reason.testimonial_creator' },
    { block: 'community', weight: 75, reason: 'recommendations.reason.community_creator' },
    { block: 'messenger', weight: 70, reason: 'recommendations.reason.messenger' },
    { block: 'newsletter', weight: 65, reason: 'recommendations.reason.newsletter' },
  ],
  freelancer: [
    { block: 'pricing', weight: 100, reason: 'recommendations.reason.pricing_freelancer' },
    { block: 'booking', weight: 95, reason: 'recommendations.reason.booking_freelancer' },
    { block: 'testimonial', weight: 90, reason: 'recommendations.reason.testimonial_freelancer' },
    { block: 'messenger', weight: 85, reason: 'recommendations.reason.messenger' },
    { block: 'form', weight: 80, reason: 'recommendations.reason.form_freelancer' },
    { block: 'socials', weight: 75, reason: 'recommendations.reason.socials' },
    { block: 'before_after', weight: 70, reason: 'recommendations.reason.before_after' },
    { block: 'faq', weight: 65, reason: 'recommendations.reason.faq' },
  ],
  business: [
    { block: 'messenger', weight: 100, reason: 'recommendations.reason.messenger_business' },
    { block: 'map', weight: 95, reason: 'recommendations.reason.map_business' },
    { block: 'form', weight: 90, reason: 'recommendations.reason.form_business' },
    { block: 'catalog', weight: 85, reason: 'recommendations.reason.catalog_business' },
    { block: 'pricing', weight: 80, reason: 'recommendations.reason.pricing_business' },
    { block: 'testimonial', weight: 75, reason: 'recommendations.reason.testimonial' },
    { block: 'faq', weight: 70, reason: 'recommendations.reason.faq_business' },
    { block: 'booking', weight: 65, reason: 'recommendations.reason.booking_business' },
  ],
  education: [
    { block: 'booking', weight: 100, reason: 'recommendations.reason.booking_education' },
    { block: 'pricing', weight: 95, reason: 'recommendations.reason.pricing_education' },
    { block: 'video', weight: 90, reason: 'recommendations.reason.video_education' },
    { block: 'testimonial', weight: 85, reason: 'recommendations.reason.testimonial_education' },
    { block: 'form', weight: 80, reason: 'recommendations.reason.form_education' },
    { block: 'faq', weight: 75, reason: 'recommendations.reason.faq_education' },
    { block: 'messenger', weight: 70, reason: 'recommendations.reason.messenger' },
    { block: 'download', weight: 65, reason: 'recommendations.reason.download_education' },
  ],
  events: [
    { block: 'event', weight: 100, reason: 'recommendations.reason.event' },
    { block: 'countdown', weight: 95, reason: 'recommendations.reason.countdown_events' },
    { block: 'carousel', weight: 90, reason: 'recommendations.reason.carousel_events' },
    { block: 'map', weight: 85, reason: 'recommendations.reason.map_events' },
    { block: 'form', weight: 80, reason: 'recommendations.reason.form_events' },
    { block: 'testimonial', weight: 75, reason: 'recommendations.reason.testimonial' },
    { block: 'video', weight: 70, reason: 'recommendations.reason.video' },
    { block: 'socials', weight: 65, reason: 'recommendations.reason.socials' },
  ],
  portfolio: [
    { block: 'carousel', weight: 100, reason: 'recommendations.reason.carousel_portfolio' },
    { block: 'before_after', weight: 95, reason: 'recommendations.reason.before_after_portfolio' },
    { block: 'video', weight: 90, reason: 'recommendations.reason.video_portfolio' },
    { block: 'testimonial', weight: 85, reason: 'recommendations.reason.testimonial_portfolio' },
    { block: 'pricing', weight: 80, reason: 'recommendations.reason.pricing' },
    { block: 'socials', weight: 75, reason: 'recommendations.reason.socials' },
    { block: 'form', weight: 70, reason: 'recommendations.reason.form' },
    { block: 'download', weight: 65, reason: 'recommendations.reason.download_portfolio' },
  ],
  ecommerce: [
    { block: 'product', weight: 100, reason: 'recommendations.reason.product' },
    { block: 'catalog', weight: 95, reason: 'recommendations.reason.catalog' },
    { block: 'testimonial', weight: 90, reason: 'recommendations.reason.testimonial_ecommerce' },
    { block: 'messenger', weight: 85, reason: 'recommendations.reason.messenger_ecommerce' },
    { block: 'faq', weight: 80, reason: 'recommendations.reason.faq_ecommerce' },
    { block: 'carousel', weight: 75, reason: 'recommendations.reason.carousel_ecommerce' },
    { block: 'form', weight: 70, reason: 'recommendations.reason.form' },
    { block: 'countdown', weight: 65, reason: 'recommendations.reason.countdown_sale' },
  ],
  health: [
    { block: 'booking', weight: 100, reason: 'recommendations.reason.booking_health' },
    { block: 'pricing', weight: 95, reason: 'recommendations.reason.pricing_health' },
    { block: 'testimonial', weight: 90, reason: 'recommendations.reason.testimonial_health' },
    { block: 'before_after', weight: 85, reason: 'recommendations.reason.before_after_health' },
    { block: 'messenger', weight: 80, reason: 'recommendations.reason.messenger' },
    { block: 'video', weight: 75, reason: 'recommendations.reason.video_health' },
    { block: 'faq', weight: 70, reason: 'recommendations.reason.faq' },
    { block: 'form', weight: 65, reason: 'recommendations.reason.form' },
  ],
  community: [
    { block: 'community', weight: 100, reason: 'recommendations.reason.community' },
    { block: 'event', weight: 95, reason: 'recommendations.reason.event_community' },
    { block: 'messenger', weight: 90, reason: 'recommendations.reason.messenger_community' },
    { block: 'socials', weight: 85, reason: 'recommendations.reason.socials_community' },
    { block: 'testimonial', weight: 80, reason: 'recommendations.reason.testimonial' },
    { block: 'newsletter', weight: 75, reason: 'recommendations.reason.newsletter_community' },
    { block: 'form', weight: 70, reason: 'recommendations.reason.form' },
    { block: 'faq', weight: 65, reason: 'recommendations.reason.faq' },
  ],
  general: [
    { block: 'link', weight: 100, reason: 'recommendations.reason.link_general' },
    { block: 'socials', weight: 95, reason: 'recommendations.reason.socials' },
    { block: 'messenger', weight: 90, reason: 'recommendations.reason.messenger' },
    { block: 'button', weight: 85, reason: 'recommendations.reason.button_general' },
    { block: 'text', weight: 80, reason: 'recommendations.reason.text_general' },
    { block: 'image', weight: 75, reason: 'recommendations.reason.image_general' },
    { block: 'testimonial', weight: 70, reason: 'recommendations.reason.testimonial' },
    { block: 'faq', weight: 65, reason: 'recommendations.reason.faq' },
  ],
};

// ============= Scoring Algorithm =============

export interface BlockRecommendation {
  block: BlockType;
  score: number;
  reason: string;
  isRelevant: boolean;
  alreadyExists: boolean;
}

interface GetRecommendationsOptions {
  pageNiche: PageNiche;
  existingBlocks: BlockType[];
  maxResults?: number;
}

/**
 * Calculate block recommendations based on niche and context
 */
export function getBlockRecommendations(options: GetRecommendationsOptions): BlockRecommendation[] {
  const { pageNiche, existingBlocks, maxResults = 6 } = options;
  
  const weights = NICHE_WEIGHTS[pageNiche] || NICHE_WEIGHTS.general;
  const existingSet = new Set(existingBlocks);
  
  // Score each recommended block
  const recommendations: BlockRecommendation[] = weights.map(w => {
    const alreadyExists = existingSet.has(w.block);
    
    // Calculate score with bonuses
    let score = w.weight;
    
    // Missing need bonus: if page lacks CTA/contact/proof, boost relevant blocks
    if (!existingBlocks.some(b => ['messenger', 'form', 'booking'].includes(b))) {
      if (['messenger', 'form', 'booking'].includes(w.block)) {
        score += 15; // Contact/CTA bonus
      }
    }
    
    if (!existingBlocks.some(b => ['testimonial', 'before_after'].includes(b))) {
      if (['testimonial', 'before_after'].includes(w.block)) {
        score += 10; // Social proof bonus
      }
    }
    
    // Penalty for already existing blocks
    if (alreadyExists) {
      score -= 50;
    }
    
    return {
      block: w.block,
      score,
      reason: w.reason,
      isRelevant: !alreadyExists && score >= 60,
      alreadyExists,
    };
  });
  
  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);
  
  // Return top results
  return recommendations.slice(0, maxResults);
}

/**
 * Get recommended blocks for display in Block Picker
 */
export function getRecommendedBlocks(
  niche: Niche | string | undefined,
  existingBlocks: BlockType[]
): BlockRecommendation[] {
  const pageNiche = mapNicheToPageNiche(niche);
  return getBlockRecommendations({
    pageNiche,
    existingBlocks,
    maxResults: 6,
  });
}

/**
 * Check if a block type is in the recommended list
 */
export function isBlockRecommended(
  blockType: BlockType,
  niche: Niche | string | undefined,
  existingBlocks: BlockType[]
): boolean {
  const recommendations = getRecommendedBlocks(niche, existingBlocks);
  return recommendations.some(r => r.block === blockType && r.isRelevant);
}

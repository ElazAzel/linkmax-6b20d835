/**
 * Insert Ranker - Context-aware block insertion ranking
 * P4: Block Editor Interaction OS
 */
import type { Block, BlockType } from '@/types/page';
import { NICHE_PACKS, getNichePack, mapNicheToPackKey } from '@/lib/intelligence/niche-packs';
import { analyzeComposition, getBlockRole } from '@/lib/intelligence/composition-analyzer';

export interface RankedBlockType {
  blockType: BlockType;
  score: number;
  reason?: string;
}

interface InsertContext {
  blocks: Block[];
  position: number;
  niche?: string;
  recentTypes?: string[];
  isPremium?: boolean;
}

// Position-based recommendations: what blocks work well after specific types
const POSITION_BOOSTS: Record<string, { after: string[]; boost: number }[]> = {
  booking: [
    { after: ['pricing', 'catalog', 'product'], boost: 25 },
    { after: ['text', 'testimonial'], boost: 15 },
  ],
  testimonial: [
    { after: ['pricing', 'booking', 'product'], boost: 20 },
    { after: ['text'], boost: 10 },
  ],
  faq: [
    { after: ['pricing', 'booking'], boost: 25 },
    { after: ['product', 'catalog'], boost: 20 },
  ],
  button: [
    { after: ['text', 'pricing', 'testimonial'], boost: 20 },
    { after: ['image', 'video'], boost: 15 },
  ],
  messenger: [
    { after: ['pricing', 'booking', 'text'], boost: 20 },
    { after: ['testimonial', 'faq'], boost: 15 },
  ],
  text: [
    { after: ['profile'], boost: 25 },
    { after: ['image', 'video'], boost: 15 },
  ],
  socials: [
    { after: ['profile'], boost: 30 },
    { after: ['text'], boost: 10 },
  ],
  pricing: [
    { after: ['text', 'profile'], boost: 20 },
    { after: ['image', 'testimonial'], boost: 15 },
  ],
  before_after: [
    { after: ['testimonial', 'pricing'], boost: 20 },
    { after: ['text'], boost: 10 },
  ],
};

// All available block types for ranking
const ALL_BLOCK_TYPES: BlockType[] = [
  'text', 'button', 'link', 'image', 'video', 'carousel',
  'messenger', 'socials', 'form', 'newsletter',
  'pricing', 'booking', 'product', 'catalog',
  'testimonial', 'faq', 'before_after', 'countdown',
  'map', 'download', 'separator', 'event', 'community',
  'shoutout', 'custom_code', 'scratch', 'avatar',
];

/**
 * Rank block types for insertion at a given position
 */
export function rankBlocksForInsert(context: InsertContext): RankedBlockType[] {
  const { blocks, position, niche, recentTypes = [] } = context;
  
  const composition = analyzeComposition(blocks, niche);
  const nichePack = getNichePack(niche ? mapNicheToPackKey(niche) : undefined);
  
  // Get the block that will be above the insertion point
  const blockAbove = position > 0 ? blocks[position - 1] : null;
  const blockAboveType = blockAbove?.type;

  const scored: RankedBlockType[] = ALL_BLOCK_TYPES.map(blockType => {
    let score = 0;
    let reason: string | undefined;

    // Base score from niche pack weights
    const nicheWeight = nichePack.weights[blockType];
    if (nicheWeight !== undefined) {
      score += nicheWeight * 10;
    }

    // Boost critical blocks for niche
    if (nichePack.criticalBlocks.includes(blockType)) {
      score += 15;
      reason = 'critical_for_niche';
    }

    // Boost blocks that fill composition gaps
    const role = getBlockRole(blockType);
    if (role === 'cta' && !composition.coverage.hasCTA) {
      score += 25;
      reason = 'fills_cta_gap';
    }
    if (role === 'trust' && !composition.coverage.hasTrust) {
      score += 20;
      reason = 'fills_trust_gap';
    }
    if (role === 'contact' && !composition.coverage.hasContact) {
      score += 20;
      reason = 'fills_contact_gap';
    }
    if (role === 'offer' && !composition.coverage.hasOffer) {
      score += 25;
      reason = 'fills_offer_gap';
    }

    // Position-based boost (what works well after the block above)
    if (blockAboveType) {
      const boosts = POSITION_BOOSTS[blockType];
      if (boosts) {
        for (const { after, boost } of boosts) {
          if (after.includes(blockAboveType)) {
            score += boost;
            if (!reason) reason = `recommended_after_${blockAboveType}`;
            break;
          }
        }
      }
    }

    // Recent types boost
    const recentIndex = recentTypes.indexOf(blockType);
    if (recentIndex !== -1) {
      score += Math.max(0, 15 - recentIndex * 3);
      if (!reason) reason = 'recently_used';
    }

    // Penalize duplicates if page already has the block
    const existingCount = blocks.filter(b => b.type === blockType).length;
    if (existingCount > 0) {
      // Some blocks are OK to have multiple (text, button, link)
      const multipleAllowed = ['text', 'button', 'link', 'image', 'separator', 'messenger'];
      if (!multipleAllowed.includes(blockType)) {
        score -= existingCount * 10;
      }
    }

    // Penalize profile (can't add more)
    if (blockType === 'profile') {
      score = -1000;
    }

    return { blockType, score, reason };
  });

  // Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Get top N recommended blocks for insert
 */
export function getTopRecommendedBlocks(
  context: InsertContext,
  limit: number = 5
): RankedBlockType[] {
  return rankBlocksForInsert(context).slice(0, limit);
}

/**
 * Get the single best block to insert after a given block type
 */
export function getBestBlockAfter(blockType: string): BlockType | null {
  // Find which block types have the highest boost after this type
  let bestType: BlockType | null = null;
  let bestBoost = 0;

  for (const [type, boosts] of Object.entries(POSITION_BOOSTS)) {
    for (const { after, boost } of boosts) {
      if (after.includes(blockType) && boost > bestBoost) {
        bestBoost = boost;
        bestType = type as BlockType;
      }
    }
  }

  return bestType;
}

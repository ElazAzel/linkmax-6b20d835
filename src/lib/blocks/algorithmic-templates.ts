import type { BlockType } from '@/types/blocks/base';
import type { Niche } from '@/lib/niches';

export interface AlgorithmicTemplateBlock {
  type: BlockType;
  overrides?: Record<string, unknown>;
}

/**
 * Local page recipes used by the page builder.
 *
 * Recipes describe a composition, never invented business facts. Missing
 * content is omitted by the builder instead of publishing factory examples.
 */
const TEMPLATE_RECIPES: Record<string, readonly BlockType[]> = {
  conversion: ['profile', 'text', 'image', 'pricing', 'messenger', 'socials', 'map'],
  commerce: ['profile', 'text', 'image', 'catalog', 'messenger', 'socials', 'map'],
  expert: ['profile', 'text', 'pricing', 'video', 'messenger', 'socials'],
  creator: ['profile', 'image', 'carousel', 'video', 'text', 'pricing', 'socials', 'messenger'],
  default: ['profile', 'text', 'image', 'link', 'messenger', 'socials'],
};

const CONVERSION_NICHES = new Set<Niche>([
  'beauty',
  'fitness',
  'health',
  'travel',
  'realestate',
  'events',
  'services',
]);

const CREATOR_NICHES = new Set<Niche>(['art', 'music']);

export function getAlgorithmicTemplateForNiche(niche: Niche): AlgorithmicTemplateBlock[] {
  const recipe = niche === 'food' || niche === 'fashion'
    ? TEMPLATE_RECIPES.commerce
    : CONVERSION_NICHES.has(niche)
    ? TEMPLATE_RECIPES.conversion
    : CREATOR_NICHES.has(niche)
      ? TEMPLATE_RECIPES.creator
      : niche === 'expert' || niche === 'education' || niche === 'business' || niche === 'tech'
        ? TEMPLATE_RECIPES.expert
        : TEMPLATE_RECIPES.default;

  const recipeId = CREATOR_NICHES.has(niche) ? 'editorial-quiet'
    : CONVERSION_NICHES.has(niche) ? 'calm-portrait' : 'bold-statement';
  return recipe.map((type) => ({ type, overrides: type === 'profile' ? { recipeId } : undefined }));
}

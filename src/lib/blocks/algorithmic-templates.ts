import type { BlockType } from '@/types/blocks/base';
import type { Niche } from '@/lib/niches';

interface AlgorithmicTemplateBlock {
  type: BlockType;
  overrides?: Record<string, unknown>;
}

/**
 * Local page recipes used by the page builder.
 *
 * These are intentionally boring data: the builder can run offline, has no
 * model/API dependency, and every result is reproducible for the same inputs.
 */
const TEMPLATE_RECIPES: Record<string, readonly BlockType[]> = {
  conversion: ['profile', 'text', 'catalog', 'booking', 'messenger', 'socials', 'faq'],
  expert: ['profile', 'text', 'pricing', 'form', 'messenger', 'socials', 'faq'],
  creator: ['profile', 'text', 'carousel', 'video', 'socials', 'messenger'],
  default: ['profile', 'text', 'link', 'form', 'messenger', 'socials'],
};

const CONVERSION_NICHES = new Set<Niche>([
  'beauty',
  'fitness',
  'health',
  'food',
  'fashion',
  'travel',
  'realestate',
  'events',
  'services',
]);

const CREATOR_NICHES = new Set<Niche>(['art', 'music']);

export function getAlgorithmicTemplateForNiche(niche: Niche): AlgorithmicTemplateBlock[] {
  const recipe = CONVERSION_NICHES.has(niche)
    ? TEMPLATE_RECIPES.conversion
    : CREATOR_NICHES.has(niche)
      ? TEMPLATE_RECIPES.creator
      : niche === 'expert' || niche === 'education' || niche === 'business' || niche === 'tech'
        ? TEMPLATE_RECIPES.expert
        : TEMPLATE_RECIPES.default;

  return recipe.map((type) => ({ type }));
}

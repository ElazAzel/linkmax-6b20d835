import type { TemplateBlockDefinition } from '@/types/templates';
import { BUSINESS_BLOCK_TYPES } from '@/lib/features';

/** Adapt a recipe to a page-builder cabinet without deleting the business recipe. */
export function templateBlocksForFeatures(blocks: TemplateBlockDefinition[], businessEnabled: boolean): TemplateBlockDefinition[] {
  if (businessEnabled) return blocks;
  return blocks.flatMap((block) => {
    if (!BUSINESS_BLOCK_TYPES.has(block.type)) return [block];
    const data = block.overrides ?? {};
    if (block.type === 'product') return [{ type: 'card', overrides: {
      title: data.name, text: data.description, image: data.image,
      blockSize: 'wide', imagePosition: 'top',
    } }];
    if (block.type === 'pricing' || block.type === 'catalog') {
      const items = Array.isArray(data.items) ? data.items as Record<string, unknown>[] : [];
      return items.map((item) => ({ type: 'card', overrides: {
        title: item.name, text: item.description, image: item.image,
        blockSize: 'wide', imagePosition: 'top',
      } }));
    }
    return [];
  });
}

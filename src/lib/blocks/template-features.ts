import type { TemplateBlockDefinition } from '@/types/templates';
import { BUSINESS_BLOCK_TYPES } from '@/lib/features';

function showcaseText(data: Record<string, unknown>): unknown {
  if (data.price === undefined || data.price === null || data.price === '') return data.description;
  const price = `${data.price}${data.currency ? ` ${data.currency}` : ''}`;
  const append = (text: unknown) => [typeof text === 'string' ? text : '', price].filter(Boolean).join('\n');
  if (data.description && typeof data.description === 'object' && !Array.isArray(data.description)) {
    return Object.fromEntries(Object.entries(data.description).map(([locale, text]) => [locale, append(text)]));
  }
  return append(data.description);
}

/** Adapt a recipe to a page-builder cabinet without deleting the business recipe. */
export function templateBlocksForFeatures(blocks: TemplateBlockDefinition[], businessEnabled: boolean): TemplateBlockDefinition[] {
  if (businessEnabled) return blocks;
  return blocks.flatMap((block) => {
    if (!BUSINESS_BLOCK_TYPES.has(block.type)) return [block];
    const data = block.overrides ?? {};
    if (block.type === 'product') return [{ type: 'card', overrides: {
      title: data.name, text: showcaseText(data), image: data.image,
      blockSize: 'wide', imagePosition: 'top',
    } }];
    if (block.type === 'pricing' || block.type === 'catalog') {
      const items = Array.isArray(data.items) ? data.items as Record<string, unknown>[] : [];
      return items.map((item) => ({ type: 'card', overrides: {
        title: item.name, text: showcaseText(item), image: item.image,
        blockSize: 'wide', imagePosition: 'top',
      } }));
    }
    return [];
  });
}

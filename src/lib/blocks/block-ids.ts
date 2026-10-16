import type { Block } from '@/types/page';

/**
 * Seeded, imported and AI-made pages can store blocks without an id. The
 * editor selects, moves and deletes blocks by id, and React uses it as the key,
 * so give every such block a stable one ("faq-8": type and position). The same
 * input always yields the same ids, on the server and in the browser.
 */
export function ensureBlockIds<T extends Block>(blocks: T[]): T[] {
  const used = new Set(blocks.map((b) => b?.id).filter(Boolean) as string[]);
  return blocks.map((block, index) => {
    if (!block || block.id) return block;
    let id = `${block.type || 'block'}-${index}`;
    for (let n = 2; used.has(id); n += 1) id = `${block.type || 'block'}-${index}-${n}`;
    used.add(id);
    return { ...block, id };
  });
}

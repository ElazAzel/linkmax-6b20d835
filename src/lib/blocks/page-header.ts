import type { Block } from '@/types/page';

interface PageHeaderSource {
  id?: string;
  seo?: { title?: string; description?: string };
}

/**
 * Pages made before the profile block (seeded or AI-built ones) start
 * straight with content and show no header at all. Visitors get the same
 * Korner-style header built from the page title and description; nothing is
 * written back, so the owner's data stays as it is.
 */
export function withPageHeader(blocks: Block[], page: PageHeaderSource | null | undefined): Block[] {
  if (!page || blocks.some((block) => block.type === 'profile')) return blocks;
  const name = (page.seo?.title || '').trim();
  if (!name) return blocks;
  const header = {
    id: `page-header-${page.id ?? 'page'}`,
    type: 'profile',
    name,
    bio: (page.seo?.description || '').trim(),
    avatar: '',
  } as unknown as Block;
  return [header, ...blocks];
}

import type { Block } from '@/types/page';
import { getI18nText } from '@/lib/i18n-helpers';

interface PageHeaderSource {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  avatar_url?: string;
  seo?: { title?: string; description?: string };
}

/**
 * Pages made before the profile block (seeded or AI-built ones) start
 * straight with content and show no header at all. Visitors get the same
 * Korner-style header built from the page title and description; nothing is
 * written back, so the owner's data stays as it is.
 */
export function withPageHeader(blocks: Block[], page: PageHeaderSource | null | undefined): Block[] {
  if (!page) return blocks;
  const name = (page.seo?.title || page.title || page.slug || '').trim();
  const profile = blocks.find(block => block.type === 'profile');
  if (profile?.type === 'profile') {
    if (getI18nText(profile.name, 'ru').trim() || !name) return blocks;
    return blocks.map(block => block === profile ? { ...profile, name } : block);
  }
  if (!name) return blocks;
  const header = {
    id: `page-header-${page.id ?? 'page'}`,
    type: 'profile',
    name,
    bio: (page.seo?.description || page.description || '').trim(),
    avatar: page.avatar_url || '',
  } as unknown as Block;
  return [header, ...blocks];
}

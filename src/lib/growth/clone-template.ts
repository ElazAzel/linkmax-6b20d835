import type { Block, PageData } from '@/types/page';

export interface CloneTemplatePayload {
  name: string;
  description: string;
  category: string;
  blocks: Block[];
  themeSettings: PageData['theme'];
  sourcePageId: string;
  sourceReferralCode?: string;
}

/** Remove personal contacts while preserving the reusable page structure. */
export function sanitizeBlocksForTemplate(blocks: Block[]): Block[] {
  return blocks.map((block) => {
    const cloned = JSON.parse(JSON.stringify(block)) as Record<string, unknown>;
    delete cloned.id;

    switch (block.type) {
      case 'profile':
        delete cloned.avatar;
        delete cloned.coverImage;
        cloned.name = 'Your name';
        cloned.bio = 'Describe your offer';
        break;
      case 'link':
      case 'button':
      case 'video':
        cloned.url = '#';
        break;
      case 'product':
        delete cloned.buyLink;
        break;
      case 'image':
        delete cloned.link;
        break;
      case 'socials':
        cloned.platforms = Array.isArray(cloned.platforms)
          ? (cloned.platforms as Array<Record<string, unknown>>).map((platform) => ({ ...platform, url: '#' }))
          : [];
        break;
      case 'messenger':
        cloned.messengers = Array.isArray(cloned.messengers)
          ? (cloned.messengers as Array<Record<string, unknown>>).map((messenger) => ({ ...messenger, username: '' }))
          : [];
        break;
      case 'form':
        cloned.submitEmail = '';
        break;
      case 'booking':
        delete cloned.prepaymentPhone;
        delete cloned.kaspiPhone;
        break;
      default:
        break;
    }

    return cloned as unknown as Block;
  });
}

export function buildCloneTemplatePayload(page: Pick<PageData, 'id' | 'blocks' | 'theme' | 'seo' | 'niche'>): CloneTemplatePayload {
  const title = page.seo?.title?.trim() || 'LinkMAX page';
  return {
    name: `${title} template`.slice(0, 120),
    description: `Cloneable structure from page ${page.id}`,
    category: page.niche?.trim() || 'other',
    blocks: sanitizeBlocksForTemplate(page.blocks),
    themeSettings: page.theme,
    sourcePageId: page.id,
  };
}

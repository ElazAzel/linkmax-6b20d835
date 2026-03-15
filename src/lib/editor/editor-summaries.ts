/**
 * Block Summary Helpers
 * Generate human-readable summaries for blocks in structure view / palette
 */

import type { Block } from '@/types/page';

/**
 * Get a short, human-readable summary for any block
 */
export function getBlockSummary(block: Block): string {
  try {
    const b = block as Record<string, any>;

    switch (block.type) {
      case 'text':
        return truncate(stripMarkdown(b.content || ''), 40);

      case 'button':
        return b.label ? `${b.label}` : '';

      case 'link':
        return b.title || extractDomain(b.url) || '';

      case 'pricing': {
        const count = Array.isArray(b.items) ? b.items.length : 0;
        return count ? `${count} services` : '';
      }

      case 'faq': {
        const count = Array.isArray(b.items) ? b.items.length : 0;
        return count ? `${count} questions` : '';
      }

      case 'booking':
        return b.title || 'Booking';

      case 'messenger':
        return b.platform || '';

      case 'testimonial': {
        const items = Array.isArray(b.items) ? b.items : [];
        if (items.length > 0) return truncate(items[0].text || items[0].author || '', 40);
        return '';
      }

      case 'image':
      case 'carousel': {
        const images = Array.isArray(b.images) ? b.images : b.imageUrl ? [b.imageUrl] : [];
        return images.length ? `${images.length} image${images.length > 1 ? 's' : ''}` : '';
      }

      case 'video':
        return extractDomain(b.url || b.videoUrl) || '';

      case 'form': {
        const fields = Array.isArray(b.fields) ? b.fields.length : 0;
        return fields ? `${fields} fields` : '';
      }

      case 'newsletter':
        return b.title || 'Newsletter';

      case 'socials': {
        const links = Array.isArray(b.links) ? b.links : [];
        return links.map((l: any) => l.platform).filter(Boolean).join(', ');
      }

      case 'community':
        return b.name || b.title || '';

      case 'event':
        return b.title || '';

      case 'product':
        return b.name || b.title || '';

      case 'catalog': {
        const count = Array.isArray(b.items) ? b.items.length : 0;
        return count ? `${count} items` : '';
      }

      case 'countdown':
        return b.title || '';

      case 'profile':
        return b.name || '';

      default:
        return '';
    }
  } catch {
    return '';
  }
}

function truncate(str: string, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function stripMarkdown(text: string): string {
  return text.replace(/[#*_~`>[\]()!]/g, '').trim();
}

function extractDomain(url?: string): string {
  if (!url) return '';
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url.slice(0, 30);
  }
}

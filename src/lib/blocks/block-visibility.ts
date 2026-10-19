import type { Block } from '@/types/page';
import { getVideoEmbedUrl } from '@/lib/blocks/video-embed';
import { isDefaultTextContent } from '@/lib/blocks/block-defaults';

/** Hidden by the owner's schedule (start/end dates). */
export function isBlockScheduledNow(block: Block, now: Date = new Date()): boolean {
  const schedule = (block as { schedule?: { startDate?: string; endDate?: string } }).schedule;
  if (!schedule) return true;
  if (schedule.startDate && now < new Date(schedule.startDate)) return false;
  if (schedule.endDate && now > new Date(schedule.endDate)) return false;
  return true;
}

/** A plain or multilingual ({ ru, en, kk }) value with some text in it. */
export function hasText(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (value && typeof value === 'object') return Object.values(value).some((v) => typeof v === 'string' && v.trim().length > 0);
  return false;
}

const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/**
 * Whether a visitor would see anything useful. A block the owner left empty
 * used to show editor hints ("Неверный URL видео", "Введите адрес") or a
 * skeleton that never resolves; on the live page it is simply left out.
 * Unknown types are always shown.
 */
export function hasVisitorContent(block: Block): boolean {
  const b = block as unknown as Record<string, unknown>;
  switch (block.type) {
    // The untouched sample text of a new block is not published.
    case 'text': return hasText(b.content) && !isDefaultTextContent(b.content);
    case 'link':
    case 'button': return hasText(b.url);
    case 'image': return hasText(b.url);
    case 'video': return getVideoEmbedUrl(b.url, b.platform as string) !== null;
    case 'map': return hasText(b.address);
    case 'socials': return list(b.platforms).some((p) => hasText((p as { url?: unknown }).url));
    case 'messenger': return list(b.messengers).some((m) => hasText((m as { username?: unknown }).username));
    case 'faq': return list(b.items).some((i) => hasText((i as { question?: unknown }).question));
    case 'testimonial': return list(b.testimonials).some((i) => hasText((i as { text?: unknown }).text));
    case 'pricing':
    case 'catalog': return list(b.items).length > 0;
    case 'carousel': return list(b.images).some((i) => hasText((i as { url?: unknown }).url));
    case 'tiles': return list(b.items).some((i) => hasText((i as { image?: unknown }).image));
    case 'shoutout': return hasText(b.userId) || hasText(b.username);
    case 'custom_code': return hasText(b.html);
    case 'download': return hasText(b.fileUrl);
    case 'community': return hasText(b.telegramLink);
    case 'product': return hasText(b.name);
    default: return true;
  }
}

/** Blocks a visitor of the live page should get. */
export function isBlockShownToVisitors(block: Block, now?: Date): boolean {
  return isBlockScheduledNow(block, now) && hasVisitorContent(block);
}

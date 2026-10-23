import { createContext, useContext } from 'react';
import type { Block } from '@/types/page';
import { messengerPhoneDigits, whatsappHref } from '@/lib/blocks/messenger-links';
import { isBlockShownToVisitors } from '@/lib/blocks/block-visibility';

export type ContactPlatform = 'whatsapp' | 'telegram' | 'phone';

interface PageContact {
  platform: ContactPlatform;
  /** Ready-to-open link with the owner's own prefilled message, if any. */
  href: string;
  /** WhatsApp digits or Telegram username, to build links with another message. */
  handle: string;
}

const TG_USERNAME = /^(?:https?:\/\/)?t\.me\/([A-Za-z0-9_]{4,})\/?$/i;

/**
 * The owner's direct contacts, one per platform. Messenger blocks are the
 * owner's own handles, so they win over links; a t.me link counts only when
 * it is a plain username (channels and invite links are not a chat).
 */
export function extractPageContacts(blocks: Block[] | undefined, language: string): PageContact[] {
  if (!blocks?.length) return [];
  // Same visibility as the page itself: a contact scheduled out is not offered.
  blocks = blocks.filter((block) => isBlockShownToVisitors(block));
  const byPlatform = new Map<ContactPlatform, PageContact>();
  const add = (contact: PageContact | undefined) => {
    if (contact && !byPlatform.has(contact.platform)) byPlatform.set(contact.platform, contact);
  };

  for (const block of blocks) {
    if (block.type !== 'messenger') continue;
    const list = (block as { messengers?: Array<{ platform: string; username: string; message?: unknown }> }).messengers ?? [];
    for (const m of list) {
      const value = (m.username || '').replace(/\s+/g, '').replace(/^@/, '');
      if (!value) continue;
      if (m.platform === 'whatsapp') {
        const href = whatsappHref(value, m.message, language);
        if (href) add({ platform: 'whatsapp', href, handle: messengerPhoneDigits(value) });
      } else if (m.platform === 'telegram') {
        add({ platform: 'telegram', href: `https://t.me/${value}`, handle: value });
      }
    }
  }

  for (const block of blocks) {
    if (block.type !== 'button' && block.type !== 'link') continue;
    const url = ((block as { url?: string }).url || '').trim();
    if (!url) continue;
    if (/^tel:/i.test(url)) {
      add({ platform: 'phone', href: url, handle: url.slice(4) });
      continue;
    }
    const wa = url.match(/(?:wa\.me\/|whatsapp\.com\/send\?phone=)\+?(\d{6,})/i);
    if (wa) {
      add({ platform: 'whatsapp', href: url.startsWith('http') ? url : `https://${url}`, handle: messengerPhoneDigits(wa[1]) });
      continue;
    }
    const tg = url.match(TG_USERNAME);
    if (tg) add({ platform: 'telegram', href: `https://t.me/${tg[1]}`, handle: tg[1] });
  }

  const order: ContactPlatform[] = ['whatsapp', 'telegram', 'phone'];
  return order.map((p) => byPlatform.get(p)).filter((c): c is PageContact => Boolean(c));
}

/** A link that opens a chat with the owner, prefilled with `text` where the app supports it. */
export function contactMessageHref(contact: PageContact, text: string): string {
  if (contact.platform === 'whatsapp') {
    return `https://wa.me/${contact.handle}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  }
  if (contact.platform === 'telegram') {
    return `https://t.me/${contact.handle}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
  }
  return contact.href;
}

const PageContactsContext = createContext<PageContact[]>([]);
export const PageContactsProvider = PageContactsContext.Provider;
export function usePageContacts(): PageContact[] {
  return useContext(PageContactsContext);
}

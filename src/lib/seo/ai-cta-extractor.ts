/**
 * AI CTA Extractor
 *
 * Extracts explicit, citable contact actions (phone, WhatsApp, Telegram, email,
 * booking URL) and pricing range from page blocks. The output is consumed by
 * GEO-visible content and JSON-LD schemas so that AI answer engines
 * (ChatGPT, Perplexity, Claude, Gemini) can directly cite "how to contact"
 * and "starting price" without executing JS.
 */

import type {
  Block,
  MessengerBlock,
  SocialsBlock,
  PricingBlock,
  BookingBlock,
  ProfileBlock,
  ButtonBlock,
  LinkBlock,
} from '@/types/page';
import { getI18nText } from '@/lib/i18n-helpers';

export interface AiContactAction {
  /** Stable identifier of channel: phone, whatsapp, telegram, email, web */
  type: 'phone' | 'whatsapp' | 'telegram' | 'viber' | 'wechat' | 'email' | 'booking' | 'web';
  /** Human label, e.g. "WhatsApp" */
  label: string;
  /** Actionable URL (tel:, mailto:, https://wa.me/..., https://t.me/...) */
  href: string;
  /** Display text — may equal href, e.g. phone digits */
  display: string;
}

export interface AiPriceInfo {
  /** Lowest non-zero price found across pricing items */
  minPrice?: number;
  /** Highest price found across pricing items */
  maxPrice?: number;
  /** Currency code, e.g. KZT, USD */
  currency: string;
  /** Number of services with explicit price */
  pricedItemsCount: number;
  /** schema.org-style priceRange string, e.g. "5000–25000 KZT" */
  priceRange?: string;
}

export interface AiCtaExtraction {
  /** All actionable contact channels in priority order */
  contacts: AiContactAction[];
  /** Pricing summary if pricing block exists */
  price?: AiPriceInfo;
  /** Whether the page has an online booking flow */
  hasBooking: boolean;
  /** Direct URL to booking section if available (anchor) */
  bookingUrl?: string;
}

const PHONE_DIGITS_RE = /[^\d+]/g;

const ensureProtocol = (url: string): string => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (/^mailto:|^tel:/i.test(url)) return url;
  return `https://${url}`;
};

const sanitizePhone = (raw: string): string => {
  const cleaned = raw.replace(PHONE_DIGITS_RE, '');
  if (!cleaned) return '';
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

const sanitizeUsername = (raw: string): string => raw.replace(/^@+/, '').trim();

const buildMessengerHref = (
  platform: MessengerBlock['messengers'][number]['platform'],
  username: string,
  message?: string
): { href: string; display: string } => {
  const u = sanitizeUsername(username);
  const enc = message ? encodeURIComponent(message) : '';
  switch (platform) {
    case 'whatsapp': {
      const phone = u.replace(PHONE_DIGITS_RE, '');
      const href = `https://wa.me/${phone}${enc ? `?text=${enc}` : ''}`;
      return { href, display: `+${phone}` };
    }
    case 'telegram': {
      // Telegram supports @username and phone
      const isPhone = /^\+?\d{6,}$/.test(u);
      const href = isPhone
        ? `https://t.me/+${u.replace(PHONE_DIGITS_RE, '')}`
        : `https://t.me/${u}`;
      return { href, display: isPhone ? `+${u.replace(PHONE_DIGITS_RE, '')}` : `@${u}` };
    }
    case 'viber': {
      const phone = u.replace(PHONE_DIGITS_RE, '');
      return { href: `viber://chat?number=%2B${phone}`, display: `+${phone}` };
    }
    case 'wechat':
    default:
      return { href: `weixin://dl/chat?${u}`, display: u };
  }
};

const detectChannelFromUrl = (url: string): AiContactAction['type'] => {
  const u = url.toLowerCase();
  if (u.startsWith('tel:')) return 'phone';
  if (u.startsWith('mailto:')) return 'email';
  if (u.includes('wa.me') || u.includes('whatsapp.com')) return 'whatsapp';
  if (u.includes('t.me') || u.includes('telegram.me')) return 'telegram';
  if (u.includes('viber://') || u.includes('viber.com')) return 'viber';
  if (u.includes('weixin://') || u.includes('wechat')) return 'wechat';
  return 'web';
};

const PLATFORM_LABEL: Record<AiContactAction['type'], string> = {
  phone: 'Phone',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  viber: 'Viber',
  wechat: 'WeChat',
  email: 'Email',
  booking: 'Online Booking',
  web: 'Website',
};

/**
 * Extract all citable contact actions, price summary, and booking info
 */
export function extractAiCta(
  blocks: Block[],
  slug: string,
  language: 'ru' | 'en' | 'kk' = 'ru'
): AiCtaExtraction {
  const valid = (blocks || []).filter(
    (b): b is Block => b != null && typeof b === 'object' && 'type' in b
  );

  const contacts: AiContactAction[] = [];
  const seen = new Set<string>();
  const push = (c: AiContactAction) => {
    const key = `${c.type}:${c.href.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    contacts.push(c);
  };

  // --- 1. Profile block phone/email (if any custom field) ---
  const profile = valid.find((b) => b.type === 'profile') as ProfileBlock | undefined;
  // ProfileBlock currently has no contact fields, skipped

  // --- 2. Messenger block (highest priority) ---
  const messengerBlock = valid.find((b) => b.type === 'messenger') as MessengerBlock | undefined;
  if (messengerBlock?.messengers?.length) {
    for (const m of messengerBlock.messengers) {
      if (!m?.username) continue;
      const { href, display } = buildMessengerHref(m.platform, m.username, m.message);
      push({
        type: m.platform,
        label: PLATFORM_LABEL[m.platform],
        href,
        display,
      });
    }
  }

  // --- 3. Buttons / Links with tel:, mailto:, wa.me, t.me ---
  const linkLikeBlocks = valid.filter(
    (b) => b.type === 'button' || b.type === 'link'
  ) as Array<ButtonBlock | LinkBlock>;
  for (const lb of linkLikeBlocks) {
    const url = (lb as { url?: string }).url;
    if (!url || typeof url !== 'string') continue;
    const trimmed = url.trim();
    if (!trimmed) continue;
    const type = detectChannelFromUrl(trimmed);
    const href = ensureProtocol(trimmed);
    let display = trimmed;
    if (type === 'phone') display = sanitizePhone(trimmed.replace(/^tel:/i, ''));
    else if (type === 'email') display = trimmed.replace(/^mailto:/i, '');
    const rawTitle = (lb as { title?: unknown }).title;
    const labelText =
      (rawTitle && (typeof rawTitle === 'string' || typeof rawTitle === 'object')
        ? getI18nText(rawTitle as Parameters<typeof getI18nText>[0], language)
        : '') || PLATFORM_LABEL[type];
    push({ type, label: labelText, href, display });
  }

  // --- 4. Socials block (only messengers/contact-like platforms) ---
  const socialsBlock = valid.find((b) => b.type === 'socials') as SocialsBlock | undefined;
  if (socialsBlock?.platforms?.length) {
    for (const p of socialsBlock.platforms) {
      if (!p?.url) continue;
      const type = detectChannelFromUrl(p.url);
      // Push only direct-contact channels here (skip generic web socials — they'd dilute the CTA list)
      if (type === 'web') continue;
      const href = ensureProtocol(p.url);
      push({ type, label: PLATFORM_LABEL[type], href, display: p.url });
    }
  }

  // --- 5. Booking detection ---
  const bookingBlock = valid.find((b) => b.type === 'booking') as BookingBlock | undefined;
  const hasBooking = !!bookingBlock;
  let bookingUrl: string | undefined;
  if (hasBooking) {
    bookingUrl = `https://lnkmx.my/${slug}#booking`;
    push({
      type: 'booking',
      label: PLATFORM_LABEL.booking,
      href: bookingUrl,
      display: bookingUrl,
    });
  }

  // --- 6. Pricing summary ---
  const pricingBlock = valid.find((b) => b.type === 'pricing') as PricingBlock | undefined;
  let price: AiPriceInfo | undefined;
  if (pricingBlock?.items?.length) {
    const prices: number[] = [];
    let currency: string = (pricingBlock.currency as unknown as string) || 'KZT';
    for (const item of pricingBlock.items) {
      if (!item || typeof item !== 'object') continue;
      const raw = (item as { price?: unknown }).price;
      const n =
        typeof raw === 'number'
          ? raw
          : typeof raw === 'string'
            ? Number(String(raw).replace(/[^\d.]/g, ''))
            : NaN;
      if (Number.isFinite(n) && n > 0) prices.push(n);
      const itemCurrency = (item as { currency?: unknown }).currency;
      if (typeof itemCurrency === 'string' && itemCurrency) {
        currency = itemCurrency;
      }
    }
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const fmt = (v: number) =>
        v % 1 === 0 ? v.toLocaleString('en-US') : v.toFixed(2);
      const priceRange =
        minPrice === maxPrice
          ? `${fmt(minPrice)} ${currency}`
          : `${fmt(minPrice)}–${fmt(maxPrice)} ${currency}`;
      price = {
        minPrice,
        maxPrice,
        currency,
        pricedItemsCount: prices.length,
        priceRange,
      };
    }
  }

  return { contacts, price, hasBooking, bookingUrl };
}

/**
 * Localized labels for the AI CTA section heading and CTA wording
 */
export const AI_CTA_LABELS: Record<
  'ru' | 'en' | 'kk',
  {
    contact: string;
    contactIntro: string;
    pricing: string;
    pricingFrom: string;
    bookingCta: string;
    leaveRequest: string;
  }
> = {
  ru: {
    contact: 'Как связаться',
    contactIntro: 'Прямые контакты для записи и заявок',
    pricing: 'Стоимость услуг',
    pricingFrom: 'от',
    bookingCta: 'Записаться онлайн',
    leaveRequest: 'Оставить заявку',
  },
  en: {
    contact: 'How to contact',
    contactIntro: 'Direct contact channels for booking and inquiries',
    pricing: 'Pricing',
    pricingFrom: 'from',
    bookingCta: 'Book online',
    leaveRequest: 'Send a request',
  },
  kk: {
    contact: 'Байланыс жолдары',
    contactIntro: 'Жазылу және өтінім үшін тікелей байланыс',
    pricing: 'Қызмет құны',
    pricingFrom: 'бастап',
    bookingCta: 'Онлайн жазылу',
    leaveRequest: 'Өтінім қалдыру',
  },
};

import { getI18nText } from '@/lib/i18n-helpers';
import type { Block, BookingBlock, Currency, PageData, PricingItem } from '@/types/page';

export interface OffersInventoryItem {
  key: string;
  block: Block;
  name: string;
  description: string;
  period: string;
  price: number | null;
  priceType: PricingItem['priceType'];
  priceMax: number | null;
  currency: Currency;
  duration: number | null;
  bookingBlocks: BookingBlock[];
}

export interface OffersInventory {
  items: OffersInventoryItem[];
  bookingBlocks: BookingBlock[];
  hasUnresolvedServices: boolean;
}

const nonnegativeNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;

const durationMinutes = (value: unknown): number | null => {
  const minutes = nonnegativeNumber(value);
  return minutes !== null && minutes > 0 ? minutes : null;
};

/** Project only data stored on this page. Never infer identity from a service name. */
export function getOffersInventory(page: PageData, language: string): OffersInventory | null {
  if (!Array.isArray(page.blocks) || page.blocks.some((block) => !block || typeof block !== 'object')) return null;

  const pricingBlocks = page.blocks.filter((block) => block.type === 'pricing');
  const bookingBlocks = page.blocks.filter((block) => block.type === 'booking');
  if (pricingBlocks.some((block) => block.items != null && !Array.isArray(block.items)) ||
      pricingBlocks.some((block) => block.items?.some((item) => !item || typeof item !== 'object')) ||
      bookingBlocks.some((block) => block.serviceOfferingIds != null && !Array.isArray(block.serviceOfferingIds))) {
    return null;
  }

  const lang = language.split('-')[0];
  const text = (value: PricingItem['name'] | undefined) => getI18nText(value, lang).trim();
  const offeringIds = new Set(pricingBlocks.flatMap((block) => (block.items ?? []).map((item) => item.serviceOfferingId).filter(Boolean)));
  const items: OffersInventoryItem[] = [];

  for (const block of page.blocks) {
    if (block.type === 'pricing') {
      for (const [index, item] of (block.items ?? []).entries()) {
        items.push({
          key: `${block.id}:${item.id || index}`,
          block,
          name: text(item.name),
          description: text(item.description),
          period: text(item.period),
          price: nonnegativeNumber(item.price),
          priceType: item.priceType,
          priceMax: nonnegativeNumber(item.priceMax),
          currency: item.currency || block.currency || 'KZT',
          duration: durationMinutes(item.duration),
          bookingBlocks: item.serviceOfferingId
            ? bookingBlocks.filter((booking) => booking.serviceOfferingIds?.includes(item.serviceOfferingId!))
            : [],
        });
      }
    } else if (block.type === 'booking' && !block.serviceOfferingIds?.length) {
      // Legacy bookings have one appointment title and a slot duration, but no
      // service price. A deposit (including zero) is never the full price.
      items.push({
        key: block.id,
        block,
        name: text(block.title),
        description: text(block.description),
        period: '',
        price: null,
        priceType: undefined,
        priceMax: null,
        currency: 'KZT',
        duration: durationMinutes(block.slotDuration),
        bookingBlocks: [block],
      });
    }
  }

  return {
    items,
    bookingBlocks,
    // Linked booking services without a pricing row live outside PageData.
    // Keep their availability editor accessible without inventing service data.
    hasUnresolvedServices: bookingBlocks.some((block) =>
      block.serviceOfferingIds?.some((id) => !offeringIds.has(id))),
  };
}

export function formatOffersAmount(value: number, currency: Currency, language: string): string {
  const locales: Record<string, string> = { ru: 'ru-RU', kk: 'kk-KZ', en: 'en-US', uz: 'uz-UZ' };
  const locale = locales[language.split('-')[0]] || locales.ru;
  const amount = new Intl.NumberFormat(locale, { maximumFractionDigits: 20 }).format(value);
  // Keep the unit after the amount; codes distinguish currencies sharing '$'.
  const unit = currency === 'KZT' ? '₸' : currency;
  return `${amount} ${unit}`;
}

export function isOffersTutorPage(page: PageData): boolean {
  return ['tutor', 'teacher', 'education'].includes(page.niche?.toLowerCase() ?? '') ||
    /репетитор|преподаватель|мұғалім|оқытушы|tutor|teacher|o[ʻ‘’']?qituvchi/i.test(page.profession ?? '') ||
    page.blocks.some((block) => block.type === 'pricing' && block.items?.some((item) => item.serviceType === 'lesson'));
}

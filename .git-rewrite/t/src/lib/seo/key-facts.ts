/**
 * Key Facts Generator for AEO/GEO
 * 
 * Generates structured "key facts" bullets for AI extraction.
 * These are the atomic facts that AI engines can cite directly.
 */

import type { Block, PricingBlock, SocialsBlock, BookingBlock, EventBlock } from '@/types/page';
import { getI18nText } from '@/lib/i18n-helpers';
import type { AnswerBlockData } from './answer-block';

export interface KeyFact {
  /** Fact category for grouping */
  category: 'identity' | 'services' | 'location' | 'contact' | 'features' | 'social';
  /** Fact label */
  label: string;
  /** Fact value */
  value: string;
  /** Schema.org property if applicable */
  schemaProperty?: string;
}

interface FactTemplates {
  name: string;
  role: string;
  location: string;
  services: string;
  servicesCount: string;
  priceFrom: string;
  booking: string;
  events: string;
  eventsCount: string;
  socials: string;
  languages: string;
  experience: string;
}

const FACT_LABELS: Record<'ru' | 'en' | 'kk', FactTemplates> = {
  ru: {
    name: 'Имя',
    role: 'Специализация',
    location: 'Локация',
    services: 'Услуги',
    servicesCount: 'Количество услуг',
    priceFrom: 'Цены от',
    booking: 'Онлайн-запись',
    events: 'Мероприятия',
    eventsCount: 'Событий',
    socials: 'Соцсети',
    languages: 'Языки',
    experience: 'Опыт',
  },
  en: {
    name: 'Name',
    role: 'Specialization',
    location: 'Location',
    services: 'Services',
    servicesCount: 'Number of services',
    priceFrom: 'Prices from',
    booking: 'Online booking',
    events: 'Events',
    eventsCount: 'Events count',
    socials: 'Social media',
    languages: 'Languages',
    experience: 'Experience',
  },
  kk: {
    name: 'Аты',
    role: 'Мамандығы',
    location: 'Орналасуы',
    services: 'Қызметтер',
    servicesCount: 'Қызмет саны',
    priceFrom: 'Бағалар',
    booking: 'Онлайн жазылу',
    events: 'Іс-шаралар',
    eventsCount: 'Оқиғалар саны',
    socials: 'Әлеуметтік желілер',
    languages: 'Тілдер',
    experience: 'Тәжірибе',
  },
};

/**
 * Generate comprehensive key facts from blocks
 */
export function generateKeyFacts(
  blocks: Block[],
  answerBlock: AnswerBlockData,
  name: string | undefined,
  language: 'ru' | 'en' | 'kk' = 'ru'
): KeyFact[] {
  const facts: KeyFact[] = [];
  const labels = FACT_LABELS[language];
  
  // 1. Identity facts
  if (name) {
    facts.push({
      category: 'identity',
      label: labels.name,
      value: name,
      schemaProperty: 'name',
    });
  }
  
  if (answerBlock.niche) {
    facts.push({
      category: 'identity',
      label: labels.role,
      value: answerBlock.niche,
      schemaProperty: 'jobTitle',
    });
  }
  
  // 2. Location
  if (answerBlock.location) {
    facts.push({
      category: 'location',
      label: labels.location,
      value: answerBlock.location,
      schemaProperty: 'address',
    });
  }
  
  // 3. Services
  const pricingBlock = blocks.find(b => b.type === 'pricing') as PricingBlock | undefined;
  if (pricingBlock?.items?.length) {
    // Service count
    facts.push({
      category: 'services',
      label: labels.servicesCount,
      value: String(pricingBlock.items.length),
    });
    
    // Service names (top 3)
    const serviceNames = pricingBlock.items
      .slice(0, 3)
      .map(item => getI18nText(item.name, language))
      .filter(Boolean)
      .join(', ');
    
    if (serviceNames) {
      facts.push({
        category: 'services',
        label: labels.services,
        value: serviceNames,
        schemaProperty: 'knowsAbout',
      });
    }
    
    // Min price
    const prices = pricingBlock.items
      .map(item => item.price)
      .filter((p): p is number => typeof p === 'number' && p > 0);
    
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const currency = pricingBlock.currency || 'KZT';
      facts.push({
        category: 'services',
        label: labels.priceFrom,
        value: `${minPrice.toLocaleString()} ${currency}`,
        schemaProperty: 'priceRange',
      });
    }
  }
  
  // 4. Booking availability
  const hasBooking = blocks.some(b => b.type === 'booking');
  if (hasBooking) {
    facts.push({
      category: 'features',
      label: labels.booking,
      value: language === 'ru' ? 'Доступна' : language === 'kk' ? 'Қолжетімді' : 'Available',
    });
  }
  
  // 5. Events
  const eventBlocks = blocks.filter(b => b.type === 'event') as EventBlock[];
  const activeEvents = eventBlocks.filter(e => e.status === 'published');
  if (activeEvents.length > 0) {
    facts.push({
      category: 'features',
      label: labels.eventsCount,
      value: String(activeEvents.length),
    });
  }
  
  // 6. Social links count
  const socialsBlock = blocks.find(b => b.type === 'socials') as SocialsBlock | undefined;
  if (socialsBlock?.platforms?.length) {
    const platformNames = socialsBlock.platforms
      .slice(0, 4)
      .map(p => p.name || p.url?.split('/')[2]?.replace('www.', ''))
      .filter(Boolean)
      .join(', ');
    
    if (platformNames) {
      facts.push({
        category: 'social',
        label: labels.socials,
        value: platformNames,
        schemaProperty: 'sameAs',
      });
    }
  }
  
  return facts;
}

/**
 * Format facts as bullet list for HTML
 */
export function formatFactsAsBullets(facts: KeyFact[], language: 'ru' | 'en' | 'kk'): string {
  if (facts.length === 0) return '';
  
  const items = facts.map(f => `• ${f.label}: ${f.value}`);
  return items.join('\n');
}

/**
 * Format facts as HTML list
 */
export function formatFactsAsHtml(facts: KeyFact[]): string {
  if (facts.length === 0) return '';
  
  const items = facts.map(f => {
    const prop = f.schemaProperty ? ` itemprop="${f.schemaProperty}"` : '';
    return `<li${prop}><strong>${f.label}:</strong> ${f.value}</li>`;
  });
  
  return `<ul class="key-facts">${items.join('')}</ul>`;
}

/**
 * Group facts by category
 */
export function groupFactsByCategory(facts: KeyFact[]): Record<KeyFact['category'], KeyFact[]> {
  const groups: Record<KeyFact['category'], KeyFact[]> = {
    identity: [],
    services: [],
    location: [],
    contact: [],
    features: [],
    social: [],
  };
  
  for (const fact of facts) {
    groups[fact.category].push(fact);
  }
  
  return groups;
}

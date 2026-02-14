/**
 * SEO Anchors - Stable section anchors for AI citability
 * Provides consistent #hash anchors for page sections
 */

import type { Block } from '@/types/page';

export interface PageSection {
  id: string;
  anchor: string;
  type: 'about' | 'expertise' | 'experience' | 'services' | 'projects' | 'contacts' | 'faq' | 'events' | 'pricing' | 'testimonials';
  label: {
    ru: string;
    en: string;
    kk: string;
  };
}

// Standard section anchors
export const SECTION_ANCHORS: Record<string, PageSection['type']> = {
  profile: 'about',
  avatar: 'about',
  text: 'about',
  socials: 'contacts',
  messenger: 'contacts',
  link: 'contacts',
  button: 'contacts',
  faq: 'faq',
  pricing: 'pricing',
  booking: 'services',
  product: 'projects',
  catalog: 'projects',
  event: 'events',
  testimonial: 'testimonials',
};

export const SECTION_LABELS: Record<PageSection['type'], PageSection['label']> = {
  about: { ru: 'О себе', en: 'About', kk: 'Өзім туралы' },
  expertise: { ru: 'Компетенции', en: 'Expertise', kk: 'Құзыреттілік' },
  experience: { ru: 'Опыт', en: 'Experience', kk: 'Тәжірибе' },
  services: { ru: 'Услуги', en: 'Services', kk: 'Қызметтер' },
  projects: { ru: 'Проекты', en: 'Projects', kk: 'Жобалар' },
  contacts: { ru: 'Контакты', en: 'Contacts', kk: 'Байланыс' },
  faq: { ru: 'Вопросы и ответы', en: 'FAQ', kk: 'Сұрақ-жауап' },
  events: { ru: 'Мероприятия', en: 'Events', kk: 'Іс-шаралар' },
  pricing: { ru: 'Цены', en: 'Pricing', kk: 'Бағалар' },
  testimonials: { ru: 'Отзывы', en: 'Testimonials', kk: 'Пікірлер' },
};

/**
 * Generate stable anchors from blocks
 */
export function generateSectionAnchors(blocks: Block[]): PageSection[] {
  const sections: PageSection[] = [];
  const usedTypes = new Set<PageSection['type']>();

  for (const block of blocks) {
    const sectionType = SECTION_ANCHORS[block.type];
    if (sectionType && !usedTypes.has(sectionType)) {
      usedTypes.add(sectionType);
      sections.push({
        id: block.id,
        anchor: sectionType,
        type: sectionType,
        label: SECTION_LABELS[sectionType],
      });
    }
  }

  return sections;
}

/**
 * Generate "Key Facts" from structured data
 */
export function generateKeyFacts(
  profile: { name?: string; bio?: string; type: string },
  blocks: Block[],
  language: 'ru' | 'en' | 'kk' = 'ru'
): string[] {
  const facts: string[] = [];

  // Name and role
  if (profile.name) {
    const typeLabel = profile.type === 'Organization' 
      ? (language === 'ru' ? 'Компания' : language === 'kk' ? 'Компания' : 'Company')
      : (language === 'ru' ? 'Эксперт' : language === 'kk' ? 'Сарапшы' : 'Expert');
    facts.push(`${typeLabel}: ${profile.name}`);
  }

  // Count services/products
  const pricingBlock = blocks.find(b => b.type === 'pricing') as any;
  if (pricingBlock?.items?.length) {
    const count = pricingBlock.items.length;
    const label = language === 'ru' 
      ? `${count} услуг${count === 1 ? 'а' : count < 5 ? 'и' : ''}`
      : language === 'kk' 
      ? `${count} қызмет`
      : `${count} service${count > 1 ? 's' : ''}`;
    facts.push(label);
  }

  // Has booking
  const hasBooking = blocks.some(b => b.type === 'booking');
  if (hasBooking) {
    facts.push(language === 'ru' ? 'Онлайн-запись' : language === 'kk' ? 'Онлайн жазылу' : 'Online booking');
  }

  // Count FAQs
  const faqBlock = blocks.find(b => b.type === 'faq') as any;
  if (faqBlock?.items?.length) {
    const count = faqBlock.items.length;
    facts.push(language === 'ru' ? `${count} FAQ` : `${count} FAQ`);
  }

  // Social links count
  const socialsBlock = blocks.find(b => b.type === 'socials') as any;
  if (socialsBlock?.platforms?.length) {
    const count = socialsBlock.platforms.length;
    facts.push(language === 'ru' 
      ? `${count} соцсет${count === 1 ? 'ь' : count < 5 ? 'и' : 'ей'}`
      : `${count} social${count > 1 ? 's' : ''}`);
  }

  return facts.slice(0, 8); // Max 8 facts
}

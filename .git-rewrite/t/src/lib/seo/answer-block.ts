/**
 * Answer Block Generator for AEO/GEO
 * 
 * Generates concise "Answer blocks" that AI engines can easily extract and cite.
 * Format: "{Name} — {role/niche} из {location}. Помогает с {tasks}. Услуги: {services}. Контакты: {contacts}."
 */

import type { Block, ProfileBlock, AvatarBlock, PricingBlock, SocialsBlock, MessengerBlock } from '@/types/page';
import { getI18nText } from '@/lib/i18n-helpers';

export interface AnswerBlockData {
  /** 2-4 sentence summary for AI extraction */
  summary: string;
  /** Entity type for schema */
  entityType: 'Person' | 'Organization' | 'LocalBusiness';
  /** Detected niche/role */
  niche?: string;
  /** Location if detected */
  location?: string;
  /** Top 3 services */
  services: string[];
  /** Primary contact method */
  contact?: string;
}

interface TranslationKeys {
  from: string;
  helpsWithPrefix: string;
  servicesPrefix: string;
  contactsPrefix: string;
  expert: string;
  specialist: string;
  professional: string;
  onlinePlatform: string;
  bookingAvailable: string;
}

const TRANSLATIONS: Record<'ru' | 'en' | 'kk', TranslationKeys> = {
  ru: {
    from: 'из',
    helpsWithPrefix: 'Помогает с',
    servicesPrefix: 'Услуги',
    contactsPrefix: 'Контакт',
    expert: 'Эксперт',
    specialist: 'Специалист',
    professional: 'Профессионал',
    onlinePlatform: 'на lnkmx.my',
    bookingAvailable: 'Доступна онлайн-запись',
  },
  en: {
    from: 'from',
    helpsWithPrefix: 'Helps with',
    servicesPrefix: 'Services',
    contactsPrefix: 'Contact',
    expert: 'Expert',
    specialist: 'Specialist',
    professional: 'Professional',
    onlinePlatform: 'on lnkmx.my',
    bookingAvailable: 'Online booking available',
  },
  kk: {
    from: 'қаласынан',
    helpsWithPrefix: 'Көмектеседі',
    servicesPrefix: 'Қызметтер',
    contactsPrefix: 'Байланыс',
    expert: 'Сарапшы',
    specialist: 'Маман',
    professional: 'Кәсіпқой',
    onlinePlatform: 'lnkmx.my сайтында',
    bookingAvailable: 'Онлайн жазылу қолжетімді',
  },
};

// Common niches for role detection
const NICHE_KEYWORDS: Record<string, { ru: string; en: string; kk: string }> = {
  psycholog: { ru: 'Психолог', en: 'Psychologist', kk: 'Психолог' },
  coach: { ru: 'Коуч', en: 'Coach', kk: 'Коуч' },
  design: { ru: 'Дизайнер', en: 'Designer', kk: 'Дизайнер' },
  photo: { ru: 'Фотограф', en: 'Photographer', kk: 'Фотограф' },
  video: { ru: 'Видеограф', en: 'Videographer', kk: 'Видеограф' },
  makeup: { ru: 'Визажист', en: 'Makeup Artist', kk: 'Визажист' },
  beauty: { ru: 'Бьюти-мастер', en: 'Beauty Specialist', kk: 'Сұлулық шебері' },
  fitness: { ru: 'Фитнес-тренер', en: 'Fitness Trainer', kk: 'Фитнес жаттықтырушы' },
  yoga: { ru: 'Инструктор йоги', en: 'Yoga Instructor', kk: 'Йога нұсқаушысы' },
  doctor: { ru: 'Врач', en: 'Doctor', kk: 'Дәрігер' },
  lawyer: { ru: 'Юрист', en: 'Lawyer', kk: 'Заңгер' },
  accountant: { ru: 'Бухгалтер', en: 'Accountant', kk: 'Бухгалтер' },
  developer: { ru: 'Разработчик', en: 'Developer', kk: 'Әзірлеуші' },
  marketing: { ru: 'Маркетолог', en: 'Marketer', kk: 'Маркетолог' },
  smm: { ru: 'SMM-специалист', en: 'SMM Specialist', kk: 'SMM маманы' },
  teacher: { ru: 'Преподаватель', en: 'Teacher', kk: 'Оқытушы' },
  tutor: { ru: 'Репетитор', en: 'Tutor', kk: 'Репетитор' },
  speaker: { ru: 'Спикер', en: 'Speaker', kk: 'Спикер' },
  consultant: { ru: 'Консультант', en: 'Consultant', kk: 'Кеңесші' },
  stylist: { ru: 'Стилист', en: 'Stylist', kk: 'Стилист' },
  artist: { ru: 'Художник', en: 'Artist', kk: 'Суретші' },
  musician: { ru: 'Музыкант', en: 'Musician', kk: 'Музыкант' },
  writer: { ru: 'Писатель', en: 'Writer', kk: 'Жазушы' },
  blogger: { ru: 'Блогер', en: 'Blogger', kk: 'Блогер' },
  chef: { ru: 'Шеф-повар', en: 'Chef', kk: 'Аспазшы' },
  florist: { ru: 'Флорист', en: 'Florist', kk: 'Флорист' },
  realtor: { ru: 'Риелтор', en: 'Realtor', kk: 'Риелтор' },
};

// City names for location detection
const CITY_KEYWORDS = [
  'almaty', 'алматы', 'астана', 'astana', 'nursultan', 'нур-султан',
  'shymkent', 'шымкент', 'караганда', 'karaganda', 'актобе', 'aktobe',
  'moscow', 'москва', 'petersburg', 'петербург', 'spb', 'спб',
  'kiev', 'kyiv', 'киев', 'київ', 'minsk', 'минск',
  'tashkent', 'ташкент', 'bishkek', 'бишкек',
  'dubai', 'дубай', 'online', 'онлайн', 'worldwide', 'international',
];

/**
 * Generate Answer Block data from page blocks
 */
export function generateAnswerBlock(
  blocks: Block[],
  slug: string,
  language: 'ru' | 'en' | 'kk' = 'ru'
): AnswerBlockData {
  const t = TRANSLATIONS[language];
  
  // Extract profile info
  const profileBlock = blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
  const avatarBlock = blocks.find(b => b.type === 'avatar') as AvatarBlock | undefined;
  
  const name = profileBlock 
    ? getI18nText(profileBlock.name, language)
    : avatarBlock 
    ? getI18nText(avatarBlock.name, language)
    : undefined;
  
  const bio = profileBlock 
    ? getI18nText(profileBlock.bio, language)
    : avatarBlock?.subtitle
    ? getI18nText(avatarBlock.subtitle, language)
    : undefined;
  
  // Detect niche from bio and services
  const niche = detectNiche(bio || '', blocks, language);
  
  // Detect location from bio
  const location = detectLocation(bio || '');
  
  // Extract services
  const services = extractServices(blocks, language);
  
  // Extract primary contact
  const contact = extractPrimaryContact(blocks);
  
  // Determine entity type
  const entityType = determineEntityType(name, bio, blocks);
  
  // Generate summary
  const summary = buildSummary({
    name,
    niche,
    location,
    services,
    contact,
    hasBooking: blocks.some(b => b.type === 'booking'),
    language,
  });
  
  return {
    summary,
    entityType,
    niche,
    location,
    services,
    contact,
  };
}

/**
 * Detect niche/role from bio and service names
 */
function detectNiche(
  bio: string,
  blocks: Block[],
  language: 'ru' | 'en' | 'kk'
): string | undefined {
  const bioLower = bio.toLowerCase();
  
  // Check bio for niche keywords
  for (const [keyword, translations] of Object.entries(NICHE_KEYWORDS)) {
    if (bioLower.includes(keyword) || bioLower.includes(translations.ru.toLowerCase())) {
      return translations[language];
    }
  }
  
  // Check pricing/services for niche hints
  const pricingBlock = blocks.find(b => b.type === 'pricing') as PricingBlock | undefined;
  if (pricingBlock?.items) {
    for (const item of pricingBlock.items) {
      const serviceName = getI18nText(item.name, language)?.toLowerCase() || '';
      for (const [keyword, translations] of Object.entries(NICHE_KEYWORDS)) {
        if (serviceName.includes(keyword)) {
          return translations[language];
        }
      }
    }
  }
  
  return undefined;
}

/**
 * Detect location from bio text
 */
function detectLocation(bio: string): string | undefined {
  const bioLower = bio.toLowerCase();
  
  for (const city of CITY_KEYWORDS) {
    if (bioLower.includes(city)) {
      // Capitalize first letter
      return city.charAt(0).toUpperCase() + city.slice(1);
    }
  }
  
  return undefined;
}

/**
 * Extract top services from pricing block
 */
function extractServices(blocks: Block[], language: 'ru' | 'en' | 'kk'): string[] {
  const pricingBlock = blocks.find(b => b.type === 'pricing') as PricingBlock | undefined;
  
  if (!pricingBlock?.items) return [];
  
  return pricingBlock.items
    .slice(0, 3)
    .map(item => getI18nText(item.name, language))
    .filter((name): name is string => !!name && name.length > 0);
}

/**
 * Extract primary contact method
 */
function extractPrimaryContact(blocks: Block[]): string | undefined {
  // Check messenger block first
  const messengerBlock = blocks.find(b => b.type === 'messenger') as MessengerBlock | undefined;
  if (messengerBlock?.messengers?.length) {
    const primary = messengerBlock.messengers[0];
    return `${primary.platform}: ${primary.username}`;
  }
  
  // Check socials block
  const socialsBlock = blocks.find(b => b.type === 'socials') as SocialsBlock | undefined;
  if (socialsBlock?.platforms?.length) {
    const primary = socialsBlock.platforms[0];
    return primary.url;
  }
  
  return undefined;
}

/**
 * Determine entity type based on content
 */
function determineEntityType(
  name: string | undefined,
  bio: string | undefined,
  blocks: Block[]
): 'Person' | 'Organization' | 'LocalBusiness' {
  const nameLower = name?.toLowerCase() || '';
  const bioLower = bio?.toLowerCase() || '';
  
  // Check for business indicators in name
  const businessWords = ['studio', 'студия', 'salon', 'салон', 'shop', 'магазин', 
    'agency', 'агентство', 'company', 'компания', 'center', 'центр', 'clinic', 'клиника'];
  
  for (const word of businessWords) {
    if (nameLower.includes(word) || bioLower.includes(word)) {
      // If has booking/address, likely local business
      const hasBooking = blocks.some(b => b.type === 'booking');
      const hasMap = blocks.some(b => b.type === 'map');
      
      if (hasBooking || hasMap) {
        return 'LocalBusiness';
      }
      return 'Organization';
    }
  }
  
  return 'Person';
}

interface SummaryParams {
  name?: string;
  niche?: string;
  location?: string;
  services: string[];
  contact?: string;
  hasBooking: boolean;
  language: 'ru' | 'en' | 'kk';
}

/**
 * Build the answer summary text
 */
function buildSummary(params: SummaryParams): string {
  const { name, niche, location, services, hasBooking, language } = params;
  const t = TRANSLATIONS[language];
  
  const parts: string[] = [];
  
  // First sentence: Who is this
  if (name) {
    let intro = name;
    if (niche) {
      intro += ` — ${niche}`;
    }
    if (location) {
      intro += ` ${t.from} ${location}`;
    }
    parts.push(intro + '.');
  }
  
  // Second sentence: Services
  if (services.length > 0) {
    const servicesText = `${t.servicesPrefix}: ${services.join(', ')}.`;
    parts.push(servicesText);
  }
  
  // Third sentence: Booking/CTA
  if (hasBooking) {
    parts.push(t.bookingAvailable + '.');
  }
  
  // Fallback if empty
  if (parts.length === 0) {
    return `${t.professional} ${t.onlinePlatform}.`;
  }
  
  return parts.join(' ');
}

/**
 * Generate structured Answer Block HTML for noscript fallback
 */
export function generateAnswerBlockHtml(data: AnswerBlockData, language: 'ru' | 'en' | 'kk'): string {
  const t = TRANSLATIONS[language];
  
  return `
    <section id="answer" class="answer-block" itemscope itemtype="https://schema.org/${data.entityType}">
      <p itemprop="description">${data.summary}</p>
      ${data.services.length > 0 ? `
        <ul class="services-list">
          ${data.services.map(s => `<li itemprop="knowsAbout">${s}</li>`).join('')}
        </ul>
      ` : ''}
    </section>
  `.trim();
}

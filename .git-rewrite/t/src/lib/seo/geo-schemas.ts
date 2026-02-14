/**
 * GEO (Generative Engine Optimization) Schemas
 * 
 * Advanced Schema.org generators for AI citability.
 * Includes Person, Organization, LocalBusiness, Service, Event schemas
 * with enhanced entity linking.
 */

import type { Block, PricingBlock, EventBlock, FAQBlock, SocialsBlock, BookingBlock, MapBlock } from '@/types/page';
import { getTranslatedString } from '@/lib/i18n-helpers';
import type { AnswerBlockData } from './answer-block';

export interface GEOSchemas {
  /** Main entity schema (Person/Organization/LocalBusiness) */
  mainEntity: object;
  /** ProfilePage/WebPage schema */
  webPage: object;
  /** BreadcrumbList schema */
  breadcrumb: object;
  /** FAQPage schema if FAQ exists */
  faq?: object;
  /** Array of Event schemas */
  events?: object[];
  /** Array of Service schemas */
  services?: object[];
  /** HowTo schema for booking flow */
  howTo?: object;
  /** Combined graph for single JSON-LD */
  graph: object[];
}

interface SchemaContext {
  slug: string;
  name: string;
  bio?: string;
  avatar?: string;
  answerBlock: AnswerBlockData;
  sameAs: string[];
  language: 'ru' | 'en' | 'kk';
}

/**
 * Generate comprehensive GEO schemas
 */
export function generateGEOSchemas(
  blocks: Block[],
  context: SchemaContext
): GEOSchemas {
  const pageUrl = `https://lnkmx.my/${context.slug}`;
  const now = new Date().toISOString();
  
  const graph: object[] = [];
  
  // 1. Main Entity (Person/Organization/LocalBusiness)
  const mainEntity = generateMainEntity(blocks, context, pageUrl);
  graph.push(mainEntity);
  
  // 2. WebPage/ProfilePage
  const webPage = generateWebPage(context, pageUrl, now);
  graph.push(webPage);
  
  // 3. Breadcrumb
  const breadcrumb = generateBreadcrumb(context, pageUrl);
  graph.push(breadcrumb);
  
  // 4. FAQ Schema
  const faqBlock = blocks.find(b => b.type === 'faq') as FAQBlock | undefined;
  let faq: object | undefined;
  if (faqBlock?.items?.length) {
    faq = generateFAQSchema(faqBlock, context.language);
    graph.push(faq);
  }
  
  // 5. Event Schemas
  const eventBlocks = blocks.filter(b => b.type === 'event') as EventBlock[];
  let events: object[] | undefined;
  if (eventBlocks.length > 0) {
    events = generateEventSchemas(eventBlocks, context, pageUrl);
    events.forEach(e => graph.push(e));
  }
  
  // 6. Service Schemas
  const pricingBlock = blocks.find(b => b.type === 'pricing') as PricingBlock | undefined;
  let services: object[] | undefined;
  if (pricingBlock?.items?.length) {
    services = generateServiceSchemas(pricingBlock, context, pageUrl);
    services.forEach(s => graph.push(s));
  }
  
  // 7. HowTo Schema (for booking flow)
  const hasBooking = blocks.some(b => b.type === 'booking');
  let howTo: object | undefined;
  if (hasBooking) {
    howTo = generateHowToSchema(context, pageUrl);
    graph.push(howTo);
  }
  
  return {
    mainEntity,
    webPage,
    breadcrumb,
    faq,
    events,
    services,
    howTo,
    graph,
  };
}

/**
 * Generate main entity schema
 */
function generateMainEntity(
  blocks: Block[],
  context: SchemaContext,
  pageUrl: string
): object {
  const { entityType } = context.answerBlock;
  
  const entity: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': entityType,
    '@id': `${pageUrl}#main`,
    name: context.name,
    url: pageUrl,
    description: context.answerBlock.summary,
  };
  
  // Add image if available
  if (context.avatar) {
    entity.image = context.avatar;
  }
  
  // Add sameAs links
  if (context.sameAs.length > 0) {
    entity.sameAs = context.sameAs;
  }
  
  // Add knowsAbout from services
  if (context.answerBlock.services.length > 0) {
    entity.knowsAbout = context.answerBlock.services;
  }
  
  // Add location-specific fields for LocalBusiness
  if (entityType === 'LocalBusiness') {
    const mapBlock = blocks.find(b => b.type === 'map') as MapBlock | undefined;
    if (mapBlock?.address) {
      entity.address = {
        '@type': 'PostalAddress',
        streetAddress: mapBlock.address,
      };
    }
    if (context.answerBlock.location) {
      entity.areaServed = context.answerBlock.location;
    }
  }
  
  // Add jobTitle for Person
  if (entityType === 'Person' && context.answerBlock.niche) {
    entity.jobTitle = context.answerBlock.niche;
  }
  
  return entity;
}

/**
 * Generate WebPage/ProfilePage schema
 */
function generateWebPage(
  context: SchemaContext,
  pageUrl: string,
  now: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${pageUrl}#webpage`,
    name: `${context.name} | lnkmx`,
    description: context.answerBlock.summary,
    url: pageUrl,
    dateModified: now,
    inLanguage: context.language,
    mainEntity: {
      '@id': `${pageUrl}#main`,
    },
    isPartOf: {
      '@type': 'WebSite',
      '@id': 'https://lnkmx.my#website',
      name: 'lnkmx',
      url: 'https://lnkmx.my',
    },
    provider: {
      '@type': 'Organization',
      name: 'lnkmx',
      url: 'https://lnkmx.my',
      logo: 'https://lnkmx.my/favicon.jpg',
    },
  };
}

/**
 * Generate BreadcrumbList schema
 */
function generateBreadcrumb(context: SchemaContext, pageUrl: string): object {
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'lnkmx',
      item: 'https://lnkmx.my',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: context.name,
      item: pageUrl,
    },
  ];
  
  // Add niche level if available
  if (context.answerBlock.niche) {
    items.splice(1, 0, {
      '@type': 'ListItem',
      position: 2,
      name: context.answerBlock.niche,
      item: `https://lnkmx.my/experts/${encodeURIComponent(context.answerBlock.niche.toLowerCase())}`,
    });
    items[2].position = 3;
  }
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: items,
  };
}

/**
 * Generate FAQPage schema
 */
function generateFAQSchema(
  faqBlock: FAQBlock,
  language: 'ru' | 'en' | 'kk'
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqBlock.items.map(item => ({
      '@type': 'Question',
      name: getTranslatedString(item.question, language),
      acceptedAnswer: {
        '@type': 'Answer',
        text: getTranslatedString(item.answer, language),
      },
    })),
  };
}

/**
 * Generate Event schemas
 */
function generateEventSchemas(
  eventBlocks: EventBlock[],
  context: SchemaContext,
  pageUrl: string
): object[] {
  return eventBlocks
    .filter(e => e.status === 'published')
    .map(event => {
      const eventSchema: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: getTranslatedString(event.title, context.language),
        startDate: event.startAt,
        eventStatus: 'https://schema.org/EventScheduled',
        organizer: {
          '@id': `${pageUrl}#main`,
        },
      };
      
      if (event.description) {
        eventSchema.description = getTranslatedString(event.description, context.language);
      }
      
      if (event.endAt) {
        eventSchema.endDate = event.endAt;
      }
      
      if (event.coverUrl) {
        eventSchema.image = event.coverUrl;
      }
      
      // Location
      if (event.locationType === 'online') {
        eventSchema.eventAttendanceMode = 'https://schema.org/OnlineEventAttendanceMode';
        eventSchema.location = {
          '@type': 'VirtualLocation',
          url: event.locationValue || pageUrl,
        };
      } else {
        eventSchema.eventAttendanceMode = 'https://schema.org/OfflineEventAttendanceMode';
        eventSchema.location = {
          '@type': 'Place',
          address: event.locationValue,
        };
      }
      
      // Offers for paid events
      if (event.isPaid && event.price) {
        eventSchema.offers = {
          '@type': 'Offer',
          price: event.price,
          priceCurrency: event.currency || 'KZT',
          availability: 'https://schema.org/InStock',
          url: pageUrl,
        };
      }
      
      return eventSchema;
    });
}

/**
 * Generate Service schemas
 */
function generateServiceSchemas(
  pricingBlock: PricingBlock,
  context: SchemaContext,
  pageUrl: string
): object[] {
  return pricingBlock.items.slice(0, 10).map((item, index) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${pageUrl}#service-${index}`,
    name: getTranslatedString(item.name, context.language),
    description: item.description 
      ? getTranslatedString(item.description, context.language)
      : undefined,
    provider: {
      '@id': `${pageUrl}#main`,
    },
    offers: {
      '@type': 'Offer',
      price: item.price,
      priceCurrency: item.currency || pricingBlock.currency || 'KZT',
      availability: 'https://schema.org/InStock',
    },
    areaServed: context.answerBlock.location || 'Online',
  }));
}

/**
 * Generate HowTo schema for booking process
 */
function generateHowToSchema(
  context: SchemaContext,
  pageUrl: string
): object {
  const steps = context.language === 'ru' ? [
    { name: 'Выберите услугу', text: 'Просмотрите доступные услуги и выберите подходящую.' },
    { name: 'Выберите дату и время', text: 'Выберите удобную дату и время из доступных слотов.' },
    { name: 'Заполните контактные данные', text: 'Укажите ваше имя и контактную информацию.' },
    { name: 'Подтвердите запись', text: 'Подтвердите запись и получите подтверждение.' },
  ] : context.language === 'kk' ? [
    { name: 'Қызметті таңдаңыз', text: 'Қолжетімді қызметтерді қарап, қолайлысын таңдаңыз.' },
    { name: 'Күн мен уақытты таңдаңыз', text: 'Қолжетімді слоттардан ыңғайлы күн мен уақытты таңдаңыз.' },
    { name: 'Байланыс деректерін толтырыңыз', text: 'Атыңызды және байланыс ақпаратыңызды көрсетіңіз.' },
    { name: 'Жазылуды растаңыз', text: 'Жазылуды растаңыз және растау алыңыз.' },
  ] : [
    { name: 'Choose a service', text: 'Browse available services and select the one that fits your needs.' },
    { name: 'Select date and time', text: 'Choose a convenient date and time from available slots.' },
    { name: 'Fill in contact details', text: 'Enter your name and contact information.' },
    { name: 'Confirm booking', text: 'Confirm your booking and receive confirmation.' },
  ];
  
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: context.language === 'ru' 
      ? `Как записаться к ${context.name}`
      : context.language === 'kk'
      ? `${context.name}-ға қалай жазылуға болады`
      : `How to book with ${context.name}`,
    description: context.answerBlock.summary,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'KZT',
      value: '0',
    },
    totalTime: 'PT5M',
  };
}

/**
 * Generate combined JSON-LD graph
 */
export function generateJsonLdGraph(schemas: GEOSchemas): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': schemas.graph,
  });
}

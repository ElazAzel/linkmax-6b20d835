/**
 * SEO Utilities for Auto-SEO System
 * Zero-effort SEO for user pages - all automatic on publish
 */

import type { Block, FAQBlock, EventBlock, ProfileBlock, AvatarBlock, SocialsBlock, PricingBlock } from '@/types/page';
import type { MultilingualString } from '@/lib/i18n-helpers';
import { getTranslatedString } from '@/lib/i18n-helpers';

// ============= Quality Gate =============

export interface QualityGateResult {
  passed: boolean;
  reasons: string[];
  score: number; // 0-100
  suggestions: string[];
}

// Minimum requirements for indexation
const MIN_BLOCKS_FOR_INDEX = 2;
const MIN_CONTENT_LENGTH = 50;
const MAX_EXTERNAL_LINKS_NEW_ACCOUNT = 10;
const BLOCKED_DOMAINS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', // URL shorteners
  'casino', 'poker', 'betting', // Gambling
  'adult', 'xxx', 'porn', // Adult content
];

export function evaluateQualityGate(
  blocks: Block[],
  profileName?: string,
  profileBio?: string,
  isNewAccount: boolean = false
): QualityGateResult {
  const reasons: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Check for minimum blocks
  if (blocks.length >= MIN_BLOCKS_FOR_INDEX) {
    score += 20;
  } else {
    reasons.push('insufficient_blocks');
    suggestions.push('Add at least 2 content blocks');
  }

  // Check for profile/avatar block
  const hasProfile = blocks.some(b => b.type === 'profile' || b.type === 'avatar');
  if (hasProfile) {
    score += 20;
  } else {
    suggestions.push('Add a profile or avatar block');
  }

  // Check for name
  if (profileName && profileName.length > 2) {
    score += 15;
  } else {
    reasons.push('missing_name');
    suggestions.push('Add your name or business name');
  }

  // Check for bio/description
  if (profileBio && profileBio.length >= MIN_CONTENT_LENGTH) {
    score += 20;
  } else if (profileBio && profileBio.length > 0) {
    score += 10;
    suggestions.push('Expand your bio for better SEO');
  } else {
    reasons.push('missing_bio');
    suggestions.push('Add a description of who you are or what you offer');
  }

  // Check for valuable content blocks
  const hasValueBlocks = blocks.some(b => 
    ['faq', 'pricing', 'event', 'product', 'catalog', 'testimonial'].includes(b.type)
  );
  if (hasValueBlocks) {
    score += 15;
  }

  // Check for social links (helps with sameAs in schema)
  const hasSocials = blocks.some(b => b.type === 'socials');
  if (hasSocials) {
    score += 10;
  }

  // Anti-spam: check external links count for new accounts
  if (isNewAccount) {
    const linkBlocks = blocks.filter(b => b.type === 'link' || b.type === 'button');
    if (linkBlocks.length > MAX_EXTERNAL_LINKS_NEW_ACCOUNT) {
      reasons.push('too_many_links_new_account');
      score -= 20;
    }
  }

  // Anti-spam: check for blocked domains
  const linkBlocks = blocks.filter(b => b.type === 'link' || b.type === 'button') as any[];
  for (const block of linkBlocks) {
    const url = block.url?.toLowerCase() || '';
    for (const blockedDomain of BLOCKED_DOMAINS) {
      if (url.includes(blockedDomain)) {
        reasons.push('blocked_domain');
        score -= 30;
        break;
      }
    }
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Pass if score >= 40 and no critical reasons
  const criticalReasons = ['blocked_domain'];
  const hasCritical = reasons.some(r => criticalReasons.includes(r));
  const passed = score >= 40 && !hasCritical;

  return {
    passed,
    reasons,
    score,
    suggestions: passed ? [] : suggestions,
  };
}

// ============= Profile Extraction =============

export interface ExtractedProfile {
  name?: string;
  bio?: string;
  avatar?: string;
  role?: string;
  type: 'Person' | 'Organization';
  sameAs: string[];
}

export function extractProfileFromBlocks(
  blocks: Block[],
  language: 'ru' | 'en' | 'kk' = 'ru'
): ExtractedProfile {
  const result: ExtractedProfile = {
    type: 'Person',
    sameAs: [],
  };

  // Try profile block first
  const profileBlock = blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
  if (profileBlock) {
    result.name = getTranslatedString(profileBlock.name, language);
    result.bio = getTranslatedString(profileBlock.bio, language);
    result.avatar = profileBlock.avatar;
  }

  // Try avatar block
  const avatarBlock = blocks.find(b => b.type === 'avatar') as AvatarBlock | undefined;
  if (avatarBlock && !result.name) {
    result.name = getTranslatedString(avatarBlock.name, language);
    result.bio = avatarBlock.subtitle ? getTranslatedString(avatarBlock.subtitle, language) : undefined;
    result.avatar = avatarBlock.imageUrl;
  }

  // Extract sameAs from socials block
  const socialsBlock = blocks.find(b => b.type === 'socials') as SocialsBlock | undefined;
  if (socialsBlock?.platforms) {
    result.sameAs = socialsBlock.platforms.map(p => p.url).filter(Boolean);
  }

  // Determine if it's an organization based on content
  const hasProducts = blocks.some(b => b.type === 'product' || b.type === 'catalog');
  const hasPricing = blocks.some(b => b.type === 'pricing');
  const hasBooking = blocks.some(b => b.type === 'booking');
  
  // If has commercial features, might be organization
  if (hasProducts || (hasPricing && hasBooking)) {
    // Check if name contains business-like words
    const name = result.name?.toLowerCase() || '';
    const businessIndicators = ['studio', 'студия', 'салон', 'salon', 'shop', 'магазин', 'agency', 'агентство', 'company', 'компания'];
    if (businessIndicators.some(ind => name.includes(ind))) {
      result.type = 'Organization';
    }
  }

  return result;
}

// ============= Auto-Generated About =============

export function generateAutoAbout(
  profile: ExtractedProfile,
  blocks: Block[],
  language: 'ru' | 'en' | 'kk' = 'ru'
): string {
  const parts: string[] = [];

  // Name part
  if (profile.name) {
    parts.push(profile.name);
  } else {
    parts.push(language === 'ru' ? 'Профиль на lnkmx' : language === 'kk' ? 'lnkmx профилі' : 'Profile on lnkmx');
  }

  // What they offer
  const hasPricing = blocks.some(b => b.type === 'pricing');
  const hasProducts = blocks.some(b => b.type === 'product' || b.type === 'catalog');
  const hasBooking = blocks.some(b => b.type === 'booking');
  const hasEvents = blocks.some(b => b.type === 'event');

  if (hasPricing || hasBooking) {
    const servicePart = language === 'ru' ? 'Услуги и запись' : language === 'kk' ? 'Қызметтер мен жазылу' : 'Services and booking';
    parts.push(servicePart);
  } else if (hasProducts) {
    const productPart = language === 'ru' ? 'Товары и услуги' : language === 'kk' ? 'Тауарлар мен қызметтер' : 'Products and services';
    parts.push(productPart);
  } else if (hasEvents) {
    const eventPart = language === 'ru' ? 'Мероприятия' : language === 'kk' ? 'Іс-шаралар' : 'Events';
    parts.push(eventPart);
  }

  // Contact part
  const hasMessenger = blocks.some(b => b.type === 'messenger');
  if (hasMessenger || profile.sameAs.length > 0) {
    const contactPart = language === 'ru' ? 'Контакты и соцсети' : language === 'kk' ? 'Байланыс және әлеуметтік желілер' : 'Contacts and social media';
    parts.push(contactPart);
  }

  return parts.join(' • ');
}

// ============= Meta Tags Generation =============

export interface GeneratedMeta {
  title: string;
  description: string;
  ogImage?: string;
  robots: string;
  canonical: string;
}

export function generatePageMeta(
  profile: ExtractedProfile,
  blocks: Block[],
  slug: string,
  qualityGate: QualityGateResult,
  language: 'ru' | 'en' | 'kk' = 'ru'
): GeneratedMeta {
  // Title: Name - Role | lnkmx (max 60 chars)
  let title = profile.name || 'lnkmx';
  if (profile.bio && title.length + profile.bio.length < 55) {
    title = `${title} - ${profile.bio.slice(0, 50)}`;
  }
  if (title.length < 55) {
    title = `${title} | lnkmx`;
  }

  // Description: 160-180 chars based on bio and content
  let description = profile.bio || generateAutoAbout(profile, blocks, language);
  if (description.length > 160) {
    description = description.slice(0, 157) + '...';
  } else if (description.length < 100) {
    // Add platform context
    const suffix = language === 'ru' 
      ? ' - Мини-сайт на lnkmx.my'
      : language === 'kk'
      ? ' - lnkmx.my мини-сайты'
      : ' - Mini-site on lnkmx.my';
    description = description + suffix;
  }

  // Robots directive based on quality gate
  const robots = qualityGate.passed
    ? 'index, follow, max-image-preview:large'
    : 'noindex, nofollow';

  // Canonical URL (clean, no UTM)
  const canonical = `https://lnkmx.my/${slug}`;

  return {
    title: title.slice(0, 60),
    description: description.slice(0, 180),
    ogImage: profile.avatar,
    robots,
    canonical,
  };
}

// ============= Schema.org Generation =============

export interface SchemaData {
  webPage: object;
  mainEntity: object;
  faq?: object;
  events?: object[];
  breadcrumb: object;
  services?: object[];
}

export function generateSchemas(
  profile: ExtractedProfile,
  blocks: Block[],
  slug: string,
  meta: GeneratedMeta,
  language: 'ru' | 'en' | 'kk' = 'ru'
): SchemaData {
  const pageUrl = `https://lnkmx.my/${slug}`;
  const now = new Date().toISOString();

  // Main entity (Person or Organization)
  const mainEntity: any = {
    '@type': profile.type,
    name: profile.name || 'lnkmx User',
    url: pageUrl,
  };

  if (profile.bio) {
    mainEntity.description = profile.bio;
  }

  if (profile.avatar) {
    mainEntity.image = profile.avatar;
  }

  if (profile.sameAs.length > 0) {
    mainEntity.sameAs = profile.sameAs;
  }

  // WebPage schema
  const webPage = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    name: meta.title,
    description: meta.description,
    url: pageUrl,
    dateModified: now,
    inLanguage: language,
    mainEntity: {
      '@id': `${pageUrl}#main`,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'lnkmx',
      url: 'https://lnkmx.my',
    },
    provider: {
      '@type': 'Organization',
      name: 'lnkmx',
      url: 'https://lnkmx.my',
    },
  };

  // Breadcrumb schema
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'lnkmx',
        item: 'https://lnkmx.my',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: profile.name || slug,
        item: pageUrl,
      },
    ],
  };

  const result: SchemaData = {
    webPage,
    mainEntity: {
      '@context': 'https://schema.org',
      '@id': `${pageUrl}#main`,
      ...mainEntity,
    },
    breadcrumb,
  };

  // FAQ schema if FAQ block exists
  const faqBlock = blocks.find(b => b.type === 'faq') as FAQBlock | undefined;
  if (faqBlock?.items && faqBlock.items.length > 0) {
    result.faq = {
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

  // Event schemas if Event blocks exist
  const eventBlocks = blocks.filter(b => b.type === 'event' && (b as EventBlock).status === 'published') as EventBlock[];
  if (eventBlocks.length > 0) {
    result.events = eventBlocks.map(event => ({
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: getTranslatedString(event.title, language),
      description: event.description ? getTranslatedString(event.description, language) : undefined,
      startDate: event.startAt,
      endDate: event.endAt,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: event.locationType === 'online'
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
      location: event.locationType === 'online'
        ? {
            '@type': 'VirtualLocation',
            url: event.locationValue,
          }
        : {
            '@type': 'Place',
            address: event.locationValue,
          },
      image: event.coverUrl,
      organizer: {
        '@type': profile.type,
        name: profile.name,
        url: pageUrl,
      },
      ...(event.isPaid && event.price
        ? {
            offers: {
              '@type': 'Offer',
              price: event.price,
              priceCurrency: event.currency || 'KZT',
              availability: 'https://schema.org/InStock',
              validFrom: now,
            },
          }
        : {}),
    }));
  }

  // Services from Pricing block
  const pricingBlock = blocks.find(b => b.type === 'pricing') as PricingBlock | undefined;
  if (pricingBlock?.items && pricingBlock.items.length > 0) {
    result.services = pricingBlock.items.slice(0, 5).map(item => ({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: getTranslatedString(item.name, language),
      description: item.description ? getTranslatedString(item.description, language) : undefined,
      provider: {
        '@type': profile.type,
        name: profile.name,
      },
      offers: {
        '@type': 'Offer',
        price: item.price,
        priceCurrency: item.currency || pricingBlock.currency || 'KZT',
      },
    }));
  }

  return result;
}

// ============= Source Context (for AI citability) =============

export function generateSourceContext(
  slug: string,
  updatedAt: string,
  versionId?: string
): string {
  const context = [
    `This page is managed by its owner on lnkmx.`,
    `Last updated: ${new Date(updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
  ];
  
  if (versionId) {
    context.push(`Version: ${versionId}`);
  }
  
  return context.join(' • ');
}

// ============= Version Hash Generation =============

export function generateContentHash(blocks: Block[]): string {
  // Simple hash based on block structure
  const content = JSON.stringify(blocks.map(b => ({
    type: b.type,
    id: b.id,
  })));
  
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36).slice(0, 8);
}

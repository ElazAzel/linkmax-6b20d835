/**
 * Entity Linking - Extract sameAs, worksFor, knowsAbout from blocks
 * Automatically builds entity relationships for Schema.org
 */

import type { Block, SocialsBlock, LinkBlock } from '@/types/page';
import { getI18nText } from '@/lib/i18n-helpers';

// Known social platforms for sameAs extraction
const SOCIAL_PLATFORMS: Record<string, string> = {
  linkedin: 'linkedin.com',
  github: 'github.com',
  twitter: 'twitter.com',
  x: 'x.com',
  instagram: 'instagram.com',
  facebook: 'facebook.com',
  youtube: 'youtube.com',
  tiktok: 'tiktok.com',
  vk: 'vk.com',
  telegram: 't.me',
  behance: 'behance.net',
  dribbble: 'dribbble.com',
  medium: 'medium.com',
  pinterest: 'pinterest.com',
  twitch: 'twitch.tv',
  spotify: 'spotify.com',
};

// Extract organization/company domains
const COMPANY_DOMAINS = ['company', 'work', 'organization', 'business', 'corp'];

export interface EntityLinks {
  sameAs: string[];
  worksFor?: {
    '@type': 'Organization';
    name: string;
    url?: string;
  };
  alumniOf?: Array<{
    '@type': 'Organization';
    name: string;
  }>;
  knowsAbout: string[];
  jobTitle?: string;
}

/**
 * Extract all entity links from blocks
 */
export function extractEntityLinks(
  blocks: Block[],
  language: 'ru' | 'en' | 'kk' = 'ru'
): EntityLinks {
  const result: EntityLinks = {
    sameAs: [],
    knowsAbout: [],
  };

  // Extract sameAs from socials block
  const socialsBlock = blocks.find(b => b.type === 'socials') as SocialsBlock | undefined;
  if (socialsBlock?.platforms) {
    for (const platform of socialsBlock.platforms) {
      if (platform.url && isValidUrl(platform.url)) {
        result.sameAs.push(normalizeUrl(platform.url));
      }
    }
  }

  // Extract sameAs from link blocks (only known social platforms)
  const linkBlocks = blocks.filter(b => b.type === 'link' || b.type === 'button') as LinkBlock[];
  for (const block of linkBlocks) {
    if (block.url && isValidUrl(block.url)) {
      const url = block.url.toLowerCase();
      for (const [, domain] of Object.entries(SOCIAL_PLATFORMS)) {
        if (url.includes(domain)) {
          result.sameAs.push(normalizeUrl(block.url));
          break;
        }
      }
    }
  }

  // Extract knowsAbout from pricing/services
  const pricingBlock = blocks.find(b => b.type === 'pricing') as any;
  if (pricingBlock?.items) {
    for (const item of pricingBlock.items.slice(0, 5)) {
      const name = getI18nText(item.name, language);
      if (name && name.length > 2 && name.length < 50) {
        result.knowsAbout.push(name);
      }
    }
  }

  // Extract knowsAbout from catalog categories
  const catalogBlock = blocks.find(b => b.type === 'catalog') as any;
  if (catalogBlock?.categories) {
    for (const category of catalogBlock.categories.slice(0, 3)) {
      const name = getI18nText(category.name, language);
      if (name && name.length > 2 && name.length < 50) {
        result.knowsAbout.push(name);
      }
    }
  }

  // Remove duplicates
  result.sameAs = [...new Set(result.sameAs)];
  result.knowsAbout = [...new Set(result.knowsAbout)];

  return result;
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize URL (remove trailing slashes, lowercase domain)
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host.toLowerCase()}${parsed.pathname.replace(/\/$/, '')}`;
  } catch {
    return url;
  }
}

/**
 * Generate structured skills/tags from pricing and catalog
 */
export function extractSkillTags(
  blocks: Block[],
  language: 'ru' | 'en' | 'kk' = 'ru'
): string[] {
  const tags: string[] = [];

  // From pricing serviceType
  const pricingBlock = blocks.find(b => b.type === 'pricing') as any;
  if (pricingBlock?.items) {
    for (const item of pricingBlock.items) {
      if (item.serviceType && item.serviceType !== 'other') {
        tags.push(item.serviceType);
      }
    }
  }

  // From catalog categories
  const catalogBlock = blocks.find(b => b.type === 'catalog') as any;
  if (catalogBlock?.categories) {
    for (const category of catalogBlock.categories) {
      const name = getI18nText(category.name, language);
      if (name) {
        tags.push(name.toLowerCase().replace(/\s+/g, '-'));
      }
    }
  }

  return [...new Set(tags)].slice(0, 10);
}

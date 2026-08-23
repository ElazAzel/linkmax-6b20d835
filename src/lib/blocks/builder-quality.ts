/**
 * builder-quality — post-generation quality pipeline for the AI page builder.
 *
 * Whatever the source (AI edge function or deterministic template), the final
 * block list must be: non-empty, free of placeholder/blank blocks, hydrated with
 * the data the user actually typed, deduplicated and ordered in a predictable
 * conversion-oriented rhythm.
 *
 * Pure functions only — no i18n, no network, no React.
 */

import { createBlock, canCreateBlock } from './block-factory';
import type { Block } from '@/types/page';
import {
  extractServicesPipeline,
  extractContactsPipeline,
  extractSocialsPipeline,
  type ParsedService,
  type ParsedMessenger,
  type ParsedSocial,
} from './extractors';

function servicesToItems(services: ParsedService[]): Loose[] {
  return services.map((srv, i) => ({
    id: `item-${Date.now().toString(36)}-${i}`,
    name: srv.title,
    description: srv.description,
    price: srv.price,
  }));
}

function contactsToMessengers(contacts: ParsedMessenger[]): Loose[] {
  return contacts.map((c) => ({ platform: c.platform, username: c.username }));
}

function socialsToPlatforms(socials: ParsedSocial[]): Loose[] {
  return socials.map((s, i) => ({
    id: `soc-${Date.now().toString(36)}-${i}`,
    platform: s.platform,
    url: s.url,
  }));
}

export interface BuilderUserInfo {
  name: string;
  bio: string;
  goal?: string;
  contacts: string;
  services: string;
  socials: string;
  mediaLinks?: string;
}

type Loose = Record<string, unknown>;

const asLoose = (block: Block): Loose => block as unknown as Loose;

function nonEmptyString(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function nonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

/**
 * A block is meaningful when it carries content a visitor can actually see or use.
 * Blocks that would render as an empty shell are dropped — they are the main
 * reason generated pages feel "broken" to a first-time user.
 */
export function isMeaningfulBlock(block: Block): boolean {
  const b = asLoose(block);

  switch (block.type) {
    case 'profile':
    case 'avatar':
      return nonEmptyString(b.name) || nonEmptyString(b.bio) || nonEmptyString(b.avatar);
    case 'text':
      return nonEmptyString(b.content);
    case 'link':
    case 'button':
      return nonEmptyString(b.url) && nonEmptyString(b.title);
    case 'image':
    case 'video':
      return nonEmptyString(b.url);
    case 'socials':
      return (
        nonEmptyArray(b.platforms) &&
        (b.platforms as Loose[]).some((p) => nonEmptyString(p?.url) || nonEmptyString(p?.username))
      );
    case 'messenger':
      return (
        nonEmptyArray(b.messengers) &&
        (b.messengers as Loose[]).some((m) => nonEmptyString(m?.username) || nonEmptyString(m?.url))
      );
    case 'catalog':
    case 'pricing':
      return nonEmptyArray(b.items);
    case 'faq':
      return nonEmptyArray(b.items) || nonEmptyArray(b.questions);
    case 'carousel':
      return nonEmptyArray(b.images) || nonEmptyArray(b.items);
    case 'map':
      return nonEmptyString(b.address);
    case 'separator':
      return true;
    default:
      // Unknown/structural blocks: keep them, they own their own defaults.
      return true;
  }
}

/** Blocks that must never appear twice on a generated page. */
const UNIQUE_TYPES = new Set([
  'profile',
  'avatar',
  'socials',
  'messenger',
  'map',
  'form',
  'catalog',
  'pricing',
]);

export function dedupeBlocks(blocks: Block[]): Block[] {
  const seen = new Set<string>();
  return blocks.filter((block) => {
    if (!UNIQUE_TYPES.has(block.type)) return true;
    if (seen.has(block.type)) return false;
    seen.add(block.type);
    return true;
  });
}

/**
 * Conversion rhythm: who you are → what you offer → how to buy/contact → extras.
 * Lower weight renders first.
 */
const ORDER_WEIGHT: Record<string, number> = {
  profile: 0,
  avatar: 0,
  text: 20,
  video: 30,
  image: 30,
  carousel: 30,
  catalog: 40,
  pricing: 40,
  product: 40,
  booking: 50,
  form: 55,
  messenger: 60,
  scratch: 65,
  faq: 70,
  testimonial: 72,
  map: 80,
  socials: 90,
  separator: 95,
};

export function orderBlocks(blocks: Block[]): Block[] {
  return blocks
    .map((block, index) => ({ block, index }))
    .sort((a, b) => {
      const wa = ORDER_WEIGHT[a.block.type] ?? 50;
      const wb = ORDER_WEIGHT[b.block.type] ?? 50;
      if (wa !== wb) return wa - wb;
      return a.index - b.index;
    })
    .map((entry) => entry.block);
}

function makeId(type: string, index: number): string {
  return `${type}-${Date.now().toString(36)}-${index}`;
}

function safeCreate(type: string, overrides?: Loose): Block | null {
  if (!canCreateBlock(type)) return null;
  try {
    return createBlock(type, overrides as Record<string, unknown>) as Block;
  } catch {
    return null;
  }
}

/**
 * Fills the data the user typed into blocks that came back empty from the AI.
 * The AI often returns a structurally correct but data-less block.
 */
function hydrateWithUserData(blocks: Block[], info: BuilderUserInfo): Block[] {
  const services = extractServicesPipeline(info.services || '');
  const contacts = extractContactsPipeline(info.contacts || '');
  const socials = extractSocialsPipeline(info.socials || '');

  return blocks.map((block) => {
    const b = asLoose(block);

    if (block.type === 'profile' || block.type === 'avatar') {
      if (!nonEmptyString(b.name) && info.name) b.name = info.name;
      if (!nonEmptyString(b.bio) && info.bio) b.bio = info.bio;
    }

    if ((block.type === 'catalog' || block.type === 'pricing') && !nonEmptyArray(b.items) && services.length > 0) {
      b.items = servicesToItems(services);
    }

    if (block.type === 'messenger' && !nonEmptyArray(b.messengers)) {
      if (contacts.length > 0) {
        b.messengers = contactsToMessengers(contacts);
      } else if (nonEmptyString(info.contacts)) {
        b.messengers = [{ platform: 'whatsapp', username: info.contacts.trim() }];
      }
    }

    if (block.type === 'socials' && !nonEmptyArray(b.platforms) && socials.length > 0) {
      b.platforms = socialsToPlatforms(socials);
    }

    return block;
  });
}

/**
 * Guarantees the blocks a page needs to be worth publishing:
 * an identity block, at least one piece of content, and one way to contact.
 */
function ensureEssentials(blocks: Block[], info: BuilderUserInfo): Block[] {
  const result = [...blocks];
  const has = (type: string) => result.some((b) => b.type === type);

  if (!has('profile') && !has('avatar')) {
    const profile = safeCreate('profile', {
      name: info.name || '',
      bio: info.bio || '',
    });
    if (profile) result.unshift(profile);
  }

  const hasContent = result.some((b) =>
    ['text', 'catalog', 'pricing', 'carousel', 'video', 'image', 'faq', 'product'].includes(b.type)
  );
  if (!hasContent) {
    const services = extractServicesPipeline(info.services || '');
    if (services.length > 0) {
      const catalog = safeCreate('catalog', { items: servicesToItems(services) });
      if (catalog) result.push(catalog);
    } else if (nonEmptyString(info.bio)) {
      const text = safeCreate('text', { content: info.bio.trim() });
      if (text) result.push(text);
    }
  }

  const hasContact = result.some((b) => ['messenger', 'form', 'booking', 'socials'].includes(b.type));
  if (!hasContact) {
    const contacts = extractContactsPipeline(info.contacts || '');
    const messenger = safeCreate('messenger', {
      messengers:
        contacts.length > 0
          ? contactsToMessengers(contacts)
          : nonEmptyString(info.contacts)
            ? [{ platform: 'whatsapp', username: info.contacts.trim() }]
            : [],
    });
    // A messenger without a handle is useless — offer a lead form instead.
    if (messenger && isMeaningfulBlock(messenger)) {
      result.push(messenger);
    } else {
      const form = safeCreate('form');
      if (form) result.push(form);
    }
  }

  return result;
}

/**
 * Full pipeline. Always returns at least one usable block.
 */
export function refineGeneratedBlocks(blocks: Block[], info: BuilderUserInfo): Block[] {
  const cleaned = hydrateWithUserData(blocks.filter(Boolean), info);
  const meaningful = cleaned.filter(isMeaningfulBlock);
  const withEssentials = ensureEssentials(meaningful, info);
  const ordered = orderBlocks(dedupeBlocks(withEssentials));

  return ordered.map((block, index) => ({
    ...(block as unknown as Loose),
    id: makeId(block.type, index),
  })) as unknown as Block[];
}

/** Short, i18n-free summary used to describe a block in the wizard result list. */
export function summarizeBlock(block: Block): string {
  const b = asLoose(block);

  switch (block.type) {
    case 'profile':
    case 'avatar':
      return [b.name, b.bio].filter(nonEmptyString).join(' — ').slice(0, 80);
    case 'text':
      return String(b.content ?? '').replace(/[#*_>`]/g, '').trim().slice(0, 80);
    case 'catalog':
    case 'pricing':
      return (Array.isArray(b.items) ? (b.items as Loose[]) : [])
        .slice(0, 3)
        .map((item) => String(item?.name ?? ''))
        .filter(Boolean)
        .join(', ')
        .slice(0, 80);
    case 'messenger':
      return (Array.isArray(b.messengers) ? (b.messengers as Loose[]) : [])
        .map((m) => String(m?.platform ?? ''))
        .filter(Boolean)
        .join(', ');
    case 'socials':
      return (Array.isArray(b.platforms) ? (b.platforms as Loose[]) : [])
        .map((p) => String(p?.platform ?? ''))
        .filter(Boolean)
        .join(', ');
    case 'map':
      return String(b.address ?? '').slice(0, 80);
    case 'button':
    case 'link':
      return String(b.title ?? '').slice(0, 80);
    default:
      return '';
  }
}

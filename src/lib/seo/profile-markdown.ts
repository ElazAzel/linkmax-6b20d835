/**
 * Plain-markdown version of a public page for LLM crawlers (/{slug}/llms.txt).
 * Only what the owner published: no generated FAQ, no inferred facts.
 */
import type { Block, PageData } from '@/types/page';
import { getI18nText } from '@/lib/i18n-helpers';
import { computePublicPageSeo, normalizeSameAs, toPlainText, type SeoLanguage } from '@/lib/seo/public-page-seo';
import { PLACEHOLDER_ALTS } from '@/lib/blocks/safe-href';

type AnyBlock = Block & Record<string, unknown>;

/** Template alt texts that say nothing about the linked project. */

function text(value: unknown, language: SeoLanguage): string {
  if (value == null) return '';
  if (typeof value === 'string') return toPlainText(value);
  if (typeof value === 'object') return toPlainText(getI18nText(value as Record<string, string>, language));
  return '';
}

function safeUrl(value: unknown): string | null {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim()) ? value.trim() : null;
}

function blockLines(block: AnyBlock, language: SeoLanguage): string[] {
  switch (block.type) {
    case 'text': {
      const body = text(block.content, language);
      if (!body) return [];
      return block.style === 'heading' ? ['', `### ${body}`, ''] : [body, ''];
    }
    case 'link':
    case 'button': {
      const title = text(block.title, language) || text(block.label, language);
      const url = safeUrl(block.url) ?? safeUrl(block.href);
      return title && url ? [`- [${title}](${url})`] : [];
    }
    case 'video': {
      const title = text(block.title, language);
      const url = safeUrl(block.url);
      return url ? [`- Video: [${title || url}](${url})`] : [];
    }
    case 'image': {
      const url = safeUrl(block.link);
      if (!url) return [];
      const alt = text(block.alt, language);
      return [`- [${alt && !PLACEHOLDER_ALTS.has(alt.toLowerCase()) ? alt : new URL(url).hostname}](${url})`];
    }
    case 'faq': {
      const items = Array.isArray(block.items) ? block.items as unknown as Array<Record<string, unknown>> : [];
      return items.flatMap((item) => {
        const q = text(item.question, language);
        const a = text(item.answer, language);
        return q && a ? [`**${q}**`, a, ''] : [];
      });
    }
    case 'pricing': {
      const items = Array.isArray(block.items) ? block.items as unknown as Array<Record<string, unknown>> : [];
      return items.flatMap((item) => {
        const name = text(item.name, language);
        if (!name) return [];
        const price = item.price != null && item.price !== '' ? ` — ${item.price}${item.currency ? ` ${item.currency}` : ''}` : '';
        return [`- ${name}${price}`];
      });
    }
    case 'card': {
      const title = text(block.title, language);
      const body = text(block.text, language);
      const url = safeUrl(block.url);
      if (!title) return [];
      return [url ? `- [${title}](${url})` : `- ${title}`, ...(body ? [`  ${body}`] : [])];
    }
    case 'tiles': {
      const heading = text(block.title, language);
      const items = Array.isArray(block.items) ? block.items as unknown as Array<Record<string, unknown>> : [];
      const lines = items.flatMap((item) => {
        const caption = text(item.title, language);
        const url = safeUrl(item.url);
        return caption && url ? [`- [${caption}](${url})`] : caption ? [`- ${caption}`] : [];
      });
      return lines.length ? [...(heading ? ['', `### ${heading}`, ''] : []), ...lines] : [];
    }
    default:
      return [];
  }
}

export function buildProfileMarkdown(pageData: PageData, language: SeoLanguage = 'ru'): string {
  const seo = computePublicPageSeo(pageData, { language });
  const { profile, meta, answerBlock } = seo;
  const blocks = (pageData.blocks || []).filter((b): b is AnyBlock => b != null && typeof b === 'object' && 'type' in b);
  const out: string[] = [`# ${profile.name || pageData.slug}`, ''];

  if (profile.bio) out.push(`> ${profile.bio}`, '');
  const facts = [
    answerBlock.niche ? `- Role: ${answerBlock.niche}` : null,
    pageData.city || answerBlock.location ? `- Location: ${pageData.city || answerBlock.location}` : null,
    `- Page: ${meta.canonical}`,
    pageData.updatedAt ? `- Last updated: ${pageData.updatedAt.slice(0, 10)}` : null,
  ].filter(Boolean) as string[];
  out.push(...facts, '');

  const sameAs = normalizeSameAs(profile.sameAs);
  if (sameAs.length) {
    out.push('## Profiles linked by the owner', '', ...sameAs.map((url) => `- ${url}`), '');
  }

  const body = blocks.flatMap((block) => blockLines(block, language));
  if (body.length) out.push('## On this page', '', ...body, '');

  const messengers = blocks
    .filter((b) => b.type === 'messenger' && Array.isArray(b.messengers))
    .flatMap((b) => (b.messengers as Array<Record<string, unknown>>).map((m) => String(m.platform || '')).filter(Boolean));
  if (messengers.length) out.push('## Contact', '', `Contact options on the page: ${[...new Set(messengers)].join(', ')}.`, '');

  out.push('---', `Source: ${meta.canonical} (published by the page owner on LinkMAX).`);
  return `${out.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

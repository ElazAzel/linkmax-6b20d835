/**
 * Public page SEO — one pure computation shared by the SSR route head
 * (src/routes/$slug/index.tsx) and the client-side EnhancedSEOHead, so search
 * engines and AI crawlers read the same title, canonical and JSON-LD graph
 * that the browser shows.
 */
import type { Block, PageData } from '@/types/page';
import { evaluateQualityGate, extractProfileFromBlocks, generatePageMeta, type ExtractedProfile, type GeneratedMeta, type QualityGateResult } from '@/lib/seo-utils';
import { buildProfileSeoDescription, buildProfileSeoTitle } from '@/lib/seo/profile-title';
import { generateAnswerBlock, type AnswerBlockData } from '@/lib/seo/answer-block';
import { generateGEOSchemas, type GEOSchemas } from '@/lib/seo/geo-schemas';
import { getAppDomain, getPublicPageUrl } from '@/lib/utils/url-helpers';
import { canonicalSocialUrl } from '@/lib/blocks/safe-href';

export type SeoLanguage = 'ru' | 'en' | 'kk';

export function normalizeSeoLanguage(value: unknown): SeoLanguage {
  const code = typeof value === 'string' ? value.toLowerCase().split('-')[0] : 'ru';
  return code === 'en' ? 'en' : code === 'kk' || code === 'kz' ? 'kk' : 'ru';
}

export interface PublicPageSeo {
  profile: ExtractedProfile;
  qualityGate: QualityGateResult;
  meta: GeneratedMeta;
  answerBlock: AnswerBlockData;
  geoSchemas: GEOSchemas;
  /** Full JSON-LD document (@graph) ready for a <script type="application/ld+json">. */
  jsonLd: string;
}

type PageRecordFallbacks = PageData & { title?: string; description?: string; avatar_url?: string; avatarUrl?: string; createdAt?: string };

/** Plain text for meta tags: drops markdown links/emphasis and collapses whitespace. */
export function toPlainText(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`#>]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Profile links worth claiming as the same entity: http(s) only, one per URL,
 * web.telegram.org deep links rewritten to the canonical t.me profile.
 */
export function normalizeSameAs(urls: Array<string | undefined | null>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    if (!raw) continue;
    const url = canonicalSocialUrl(raw);
    if (!/^https?:\/\//i.test(url)) continue;
    const key = url.replace(/\/+$/, '').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}

/**
 * Link previews are wide cards: a cover beats a square avatar, and a still
 * image beats a GIF (Telegram, WhatsApp and LinkedIn show only its first frame
 * or nothing). Falls back to the first image when every candidate is a GIF.
 */
export function pickOgImage(candidates: Array<string | undefined | null>): string | undefined {
  const urls = candidates.map((u) => (typeof u === 'string' ? u.trim() : '')).filter((u) => /^https?:\/\//i.test(u));
  return urls.find((u) => !/\.gif(\?|#|$)/i.test(u)) ?? urls[0];
}

/** pages.title can hold a multilingual JSON string ({"ru": "...", "en": "..."}). */
function multilingualText(value: unknown, language: string): string | undefined {
  if (typeof value !== 'string') return undefined;
  const raw = value.trim();
  if (!raw.startsWith('{')) return raw || undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const pick = [parsed[language], parsed.ru, parsed.en, ...Object.values(parsed)]
      .find((v): v is string => typeof v === 'string' && v.trim() !== '');
    return pick?.trim();
  } catch {
    return raw;
  }
}

function clamp(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export function computePublicPageSeo(
  pageData: PageData,
  options: { language?: SeoLanguage; pageUrl?: string; isNewAccount?: boolean } = {},
): PublicPageSeo {
  const language = options.language ?? 'ru';
  const page = pageData as PageRecordFallbacks;
  const slug = page.slug || '';
  const pageUrl = options.pageUrl || getPublicPageUrl(slug);
  const blocks = (page.blocks || []).filter((b): b is Block => b != null && typeof b === 'object' && 'type' in b);

  const profile = extractProfileFromBlocks(blocks, language);
  // Pages without a profile block still carry a title/description/avatar on the record.
  if (!profile.name) profile.name = multilingualText(page.title, language) || page.seo?.title;
  if (!profile.bio) profile.bio = page.description || page.seo?.description;
  if (!profile.avatar) profile.avatar = page.avatar_url || page.avatarUrl;
  profile.bio = toPlainText(profile.bio) || undefined;
  profile.sameAs = normalizeSameAs(profile.sameAs);
  if (page.entity_type === 'organization') profile.type = 'Organization';

  const qualityGate = evaluateQualityGate(blocks, profile.name, profile.bio, options.isNewAccount ?? false);
  const meta = generatePageMeta(profile, blocks, slug, qualityGate, language);
  meta.canonical = pageUrl;

  const seoInput = { name: profile.name, profession: page.profession, city: page.city, bio: profile.bio, blocks };
  const smartTitle = language === 'ru' ? buildProfileSeoTitle(seoInput) : null;
  const smartDesc = language === 'ru' ? buildProfileSeoDescription(seoInput) : null;
  const ownTitle = toPlainText(page.seo?.title);
  const ownDesc = toPlainText(page.seo?.description);
  meta.title = ownTitle || smartTitle || meta.title;
  if (!/linkmax/i.test(meta.title) && meta.title.length <= 58) meta.title = `${meta.title} | LinkMAX`;
  meta.description = clamp(ownDesc || smartDesc || toPlainText(meta.description), 170);
  meta.ogImage = pickOgImage([
    page.seo?.image,
    (blocks.find((b) => b.type === 'profile') as { coverImage?: string } | undefined)?.coverImage,
    profile.avatar,
    page.previewUrl,
  ]) || `${getAppDomain()}/og-image.png`;
  // The DB flag decides indexability; the client heuristic must not noindex a page mid-hydration.
  meta.robots = page.isIndexable === false
    ? 'noindex, follow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const answerBlock = generateAnswerBlock(blocks, slug, language);
  // The keyword summary is thin for most bios; lead with the owner's own words instead.
  if (profile.bio && answerBlock.summary.length < 120) {
    const lead = profile.name && !profile.bio.startsWith(profile.name) ? `${profile.name} — ` : '';
    answerBlock.summary = clamp(`${lead}${profile.bio}`, 300);
  }
  if (page.entity_type === 'organization' && answerBlock.entityType === 'Person') answerBlock.entityType = 'Organization';
  const geoSchemas = generateGEOSchemas(blocks, {
    slug,
    name: profile.name || slug,
    bio: profile.bio,
    avatar: profile.avatar,
    answerBlock,
    sameAs: profile.sameAs,
    language,
    pageUrl,
    dateModified: page.updatedAt || undefined,
    dateCreated: page.createdAt,
  });
  const jsonLd = JSON.stringify({ '@context': 'https://schema.org', '@graph': geoSchemas.graph });

  return { profile, qualityGate, meta, answerBlock, geoSchemas, jsonLd };
}

/** Escapes a JSON-LD payload so it cannot close its <script> element. */
export function safeJsonLd(json: string): string {
  return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

const OG_LOCALE: Record<SeoLanguage, string> = { ru: 'ru_RU', en: 'en_US', kk: 'kk_KZ' };

/** TanStack route `head()` payload for a published profile page. */
export function buildPublicPageHead(pageData: PageData, options: { language?: SeoLanguage } = {}) {
  const language = options.language ?? 'ru';
  const seo = computePublicPageSeo(pageData, { language });
  const { meta, profile, answerBlock } = seo;
  const imageAlt = profile.name ? `${profile.name} — LinkMAX` : 'LinkMAX';
  const isOrg = profile.type === 'Organization' || answerBlock.entityType !== 'Person';
  const updatedAt = pageData.updatedAt || undefined;

  const metaTags: Array<Record<string, string>> = [
    { title: meta.title },
    { name: 'description', content: meta.description },
    { name: 'robots', content: meta.robots },
    { name: 'googlebot', content: meta.robots },
    { name: 'author', content: profile.name || pageData.slug || 'LinkMAX' },
    { property: 'og:type', content: isOrg ? 'website' : 'profile' },
    { property: 'og:title', content: meta.title },
    { property: 'og:description', content: meta.description },
    { property: 'og:url', content: meta.canonical },
    { property: 'og:site_name', content: 'LinkMAX' },
    { property: 'og:locale', content: OG_LOCALE[language] },
    { property: 'og:image', content: meta.ogImage || '' },
    { property: 'og:image:alt', content: imageAlt },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: meta.title },
    { name: 'twitter:description', content: meta.description },
    { name: 'twitter:image', content: meta.ogImage || '' },
    { name: 'twitter:image:alt', content: imageAlt },
  ];
  if (!isOrg && pageData.slug) metaTags.push({ property: 'profile:username', content: pageData.slug });
  if (updatedAt) metaTags.push({ property: 'og:updated_time', content: updatedAt });
  if (answerBlock.summary) metaTags.push({ name: 'ai-summary', content: clamp(answerBlock.summary, 300) });

  const links: Array<Record<string, string>> = [
    { rel: 'canonical', href: meta.canonical },
    { rel: 'alternate', type: 'text/markdown', href: `${meta.canonical}/llms.txt`, title: 'LLM-readable profile' },
  ];
  if (pageData.favicon_url) links.push({ rel: 'icon', href: pageData.favicon_url });

  return {
    meta: metaTags,
    links,
    scripts: [{ type: 'application/ld+json', children: safeJsonLd(seo.jsonLd) }],
  };
}

/** Head for a slug that has no published page: keep it out of the index. */
export function buildMissingPageHead() {
  return {
    meta: [
      { title: 'Страница не найдена | LinkMAX' },
      { name: 'robots', content: 'noindex, follow' },
    ],
  };
}

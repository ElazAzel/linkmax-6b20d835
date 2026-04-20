/**
 * Combined Sitemap Index + SSR Edge Function v3.0 (P1 Entity-First)
 * 
 * - Sitemap Index with segmented sub-sitemaps
 * - Universal SSR for all public routes (humans + bots)
 * - Entity-first profile rendering with quality gate
 * - Child page SSR for services and events
 * - Metadata Engine v2 with entity-aware titles
 * - Structured Data Engine v2
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  buildMetaDescription,
  collectTextSnippets,
  escapeHtml,
  escapeXml,
  extractLocationFromBlocks,
  generateETag,
  getOgLocale,
  resolveLanguage,
  stripMarkdownLinks,
  truncate,
  buildHreflangLinks,
} from './seo-helpers.ts';
import { buildGalleryHtml, buildLandingHtml, buildMarketingPageHtml, type GalleryItem, type LanguageKey } from './ssr-templates.ts';

const BASE_URL = 'https://lnkmx.my';
const LANGUAGES = ['ru', 'en', 'kk'] as const;
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;
const QUALITY_THRESHOLD = 25;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Reserved slugs
const RESERVED_SLUGS = new Set([
  'admin', 'dashboard', 'auth', 'api', 'install', 'join', 'team',
  'p', 'crm', 'settings', 'editor', 'gallery', 'experts', 'pricing',
  'alternatives', 'terms', 'privacy', 'payment-terms', 'for-masters',
  'seo-landing', 'sitemap', 'robots', 'collab', 'from', 'invites',
]);

const NICHE_TAGS = [
  'beauty', 'fitness', 'health', 'education', 'consulting',
  'coaching', 'design', 'marketing', 'music', 'photo', 'tech',
  'food', 'travel', 'fashion', 'art', 'realty', 'services', 'events', 'business', 'other'
];

// Static pages for sitemap
const STATIC_PAGES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/gallery', changefreq: 'daily', priority: '0.8' },
  { loc: '/pricing', changefreq: 'monthly', priority: '0.9' },
  { loc: '/alternatives', changefreq: 'monthly', priority: '0.8' },
  { loc: '/experts', changefreq: 'daily', priority: '0.9' },
  { loc: '/for-masters', changefreq: 'monthly', priority: '0.7' },
  { loc: '/seo-landing', changefreq: 'monthly', priority: '0.7' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/payment-terms', changefreq: 'yearly', priority: '0.3' },
];

// Types
interface PageData {
  id: string;
  slug: string;
  title: string | null;
  description: string | null;
  avatar_url: string | null;
  updated_at: string | null;
  niche: string | null;
  city: string | null;
  country_code: string | null;
  profession: string | null;
  entity_type: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  quality_score: number | null;
  is_indexable: boolean | null;
  service_slugs?: Record<string, { slug: string; state: string; title: string }> | null;
}

interface BlockData {
  type: string;
  title: string | null;
  content: Record<string, unknown> | null;
  position: number;
}

// SPA Bootstrap script — allows React to hydrate over SSR content
function spaBootstrapScript(): string {
  return `
  <script>
    // SPA bootstrap: load the React app which will take over rendering
    (function() {
      var s = document.createElement('script');
      s.type = 'module';
      s.crossOrigin = 'anonymous';
      // The SPA will load from the origin and hydrate
      s.src = '/src/main.tsx';
      // In production, Vite serves the built entry
      if (location.hostname !== 'localhost') {
        // Redirect to SPA by reloading — the CF worker only SSRs on first load
        // Subsequent navigations are handled by React Router
      }
      // Don't block — SPA enhances the already-rendered content
    })();
  </script>`;
}

// ============ METADATA ENGINE v2 ============

function buildProfileTitle(page: PageData, lang: LanguageKey): string {
  const name = page.title || '@' + page.slug;
  const role = page.profession || (page.niche && page.niche !== 'other' ? page.niche : null);
  const city = page.city;

  if (role && city) {
    return `${name} — ${role} ${lang === 'en' ? 'in' : lang === 'kk' ? '' : 'в'} ${city} | LinkMAX`;
  }
  if (role) {
    return `${name} — ${role} | LinkMAX`;
  }
  if (city) {
    return `${name} — ${city} | LinkMAX`;
  }
  // AEO Improvement: Descriptive title for AI agents
  if (page.profession || page.niche) {
    const expertLabel = lang === 'ru' ? 'Специалист' : lang === 'kk' ? 'Маман' : 'Expert';
    return `${name} — ${expertLabel} (${page.profession || page.niche}) | LinkMAX`;
  }
  return `${name} | LinkMAX`;
}

function buildProfileMetaDesc(page: PageData, services: { name: string }[], bio: string, lang: LanguageKey): string {
  const parts: string[] = [];
  if (bio) parts.push(truncate(bio, 100));
  if (services.length > 0) {
    const serviceNames = services.slice(0, 3).map(s => s.name).join(', ');
    const label = lang === 'ru' ? 'Услуги' : lang === 'kk' ? 'Қызметтер' : 'Services';
    parts.push(`${label}: ${serviceNames}`);
  }
  if (page.city) parts.push(page.city);
  return truncate(parts.join('. ') || `${page.title || page.slug} on LinkMAX`, 160);
}

// ============ STRUCTURED DATA ENGINE v2 ============

function buildProfileSchemaGraph(
  page: PageData,
  blocks: BlockData[],
  services: { name: string; description?: string; price?: string }[],
  faqItems: { q: string; a: string }[],
  socialLinks: string[],
  knowsAbout: string[],
  lang: LanguageKey,
): Record<string, unknown> {
  const canonical = `${BASE_URL}/${page.slug}`;
  const entityId = `${canonical}#entity`;
  const entityType = page.entity_type === 'organization' ? 'Organization' : 'Person';

  const mainEntity: Record<string, unknown> = {
    '@type': entityType,
    '@id': entityId,
    'name': page.title || '@' + page.slug,
    'alternateName': '@' + page.slug,
    'identifier': page.slug,
    'url': canonical,
    'description': truncate(stripMarkdownLinks(page.description || ''), 300),
    'mainEntityOfPage': { '@id': canonical },
  };

  if (page.avatar_url) mainEntity['image'] = page.avatar_url;
  if (socialLinks.length > 0) mainEntity['sameAs'] = socialLinks;
  if (knowsAbout.length > 0) mainEntity['knowsAbout'] = knowsAbout;

  // Location
  if (page.city) {
    mainEntity['address'] = {
      '@type': 'PostalAddress',
      'addressLocality': page.city,
      ...(page.country_code ? { 'addressCountry': page.country_code } : {}),
    };
    mainEntity['areaServed'] = page.city;
  }

  // Contact
  if (page.contact_email) mainEntity['email'] = page.contact_email;
  if (page.contact_phone) mainEntity['telephone'] = page.contact_phone;

  // Role
  if (entityType === 'Person') {
    if (page.profession) mainEntity['jobTitle'] = page.profession;
    else if (page.niche && page.niche !== 'other') mainEntity['jobTitle'] = page.niche;
  }

  // Breadcrumbs
  const breadcrumbs: Record<string, unknown>[] = [
    { '@type': 'ListItem', 'position': 1, 'name': 'LinkMAX', 'item': BASE_URL },
  ];
  if (page.niche && page.niche !== 'other') {
    breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': page.niche, 'item': `${BASE_URL}/experts/${page.niche}` });
    breadcrumbs.push({ '@type': 'ListItem', 'position': 3, 'name': page.title || page.slug, 'item': canonical });
  } else {
    breadcrumbs.push({ '@type': 'ListItem', 'position': 2, 'name': page.title || page.slug, 'item': canonical });
  }

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'ProfilePage',
      '@id': canonical,
      'url': canonical,
      'name': page.title || '@' + page.slug,
      'description': truncate(stripMarkdownLinks(page.description || ''), 160),
      'inLanguage': lang,
      'isPartOf': { '@type': 'WebSite', 'name': 'LinkMAX', 'url': BASE_URL },
      'mainEntity': { '@id': entityId },
      'dateModified': page.updated_at || new Date().toISOString(),
      // AEO: explicit mention for LLMs
      'about': { '@id': entityId },
    },
    { '@type': 'BreadcrumbList', 'itemListElement': breadcrumbs },
    {
      ...mainEntity,
      // AEO: expertise signals
      ...(knowsAbout.length > 0 ? { 'knowsAbout': knowsAbout } : {}),
      'mainEntityOfPage': { '@id': canonical }
    },
  ];

  // FAQ
  if (faqItems.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      'mainEntity': faqItems.map(item => ({
        '@type': 'Question',
        'name': item.q,
        'acceptedAnswer': { '@type': 'Answer', 'text': item.a }
      }))
    });
  }

  // Services as ItemList
  if (services.length > 0) {
    graph.push({
      '@type': 'ItemList',
      '@id': `${canonical}#services`,
      'itemListElement': services.map((s, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'item': {
          '@type': 'Service',
          'name': s.name,
          ...(s.description ? { 'description': s.description } : {}),
          ...(s.price ? { 'offers': { '@type': 'Offer', 'price': s.price, 'priceCurrency': 'KZT' } } : {}),
          'provider': { '@id': entityId }
        }
      }))
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

// ============ INDEXABILITY RULES ============

function isPageIndexable(page: PageData): boolean {
  if (page.is_indexable === false) return false;
  if (RESERVED_SLUGS.has(page.slug?.toLowerCase())) return false;
  return (page.quality_score || 0) >= QUALITY_THRESHOLD;
}

// ============ PROFILE SSR ============

// deno-lint-ignore no-explicit-any
async function handleProfileSSR(supabase: SupabaseClient<any>, slug: string, lang: LanguageKey): Promise<Response> {
  const { data: pageData, error: pageError } = await supabase
    .from('pages')
    .select('id, slug, title, description, avatar_url, updated_at, niche, city, country_code, profession, entity_type, contact_email, contact_phone, contact_whatsapp, quality_score, is_indexable, service_slugs')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  const page = pageData as PageData | null;

  if (!page || pageError) {
    const c = { ru: 'Страница не найдена', en: 'Page Not Found', kk: 'Бет табылмады' };
    return new Response(`<!DOCTYPE html><html lang="${lang}"><head><meta charset="UTF-8"><title>${c[lang] || c.ru} - LinkMAX</title><meta name="robots" content="noindex, nofollow"></head><body><h1>404</h1><p>${c[lang] || c.ru}</p><a href="${BASE_URL}/">LinkMAX</a></body></html>`, {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, nofollow' }
    });
  }

  const { data: blocksData } = await supabase
    .from('blocks')
    .select('type, title, content, position')
    .eq('page_id', page.id)
    .order('position');

  const blocks = (blocksData || []) as BlockData[];

  // Extract content from blocks
  const links: { url: string; title: string }[] = [];
  const faqItems: { q: string; a: string }[] = [];
  const services: { id: string; name: string; description?: string; price?: string }[] = [];
  const socialLinks: string[] = [];
  const knowsAbout: string[] = [];
  let bodyContent = '';
  let bioText = '';
  let textCount = 0;

  for (const b of blocks.slice(0, 20)) {
    const blockTitle = b.title ? escapeHtml(b.title) : '';
    const content = b.content;

    if (b.type === 'text' && content?.text) {
      const text = String(content.text);
      if (!bioText && text.length > 20) bioText = text;
      if (textCount < 3) {
        bodyContent += `<section><p>${escapeHtml(text)}</p></section>\n`;
        textCount++;
      }
    } else if (b.type === 'profile' && content?.bio) {
      const bio = String(content.bio);
      if (!bioText) bioText = bio;
    } else if (b.type === 'link' && content?.url) {
      links.push({ url: escapeHtml(String(content.url)), title: blockTitle || escapeHtml(String(content.url)) });
    } else if (b.type === 'faq' && content?.items && Array.isArray(content.items)) {
      for (const item of (content.items as Array<{ question?: string; answer?: string }>).slice(0, 5)) {
        if (item.question && item.answer) faqItems.push({ q: String(item.question), a: String(item.answer) });
      }
    } else if (b.type === 'pricing' && content?.items && Array.isArray(content.items)) {
      for (const item of (content.items as Array<{ id?: string; name?: string; description?: string; price?: number }>).slice(0, 8)) {
        if (item.name) {
          services.push({ id: String(item.id || ''), name: String(item.name), description: item.description ? String(item.description) : undefined, price: item.price ? String(item.price) : undefined });
          if (!knowsAbout.includes(String(item.name))) knowsAbout.push(String(item.name));
        }
      }
    } else if (b.type === 'socials' && content?.platforms && Array.isArray(content.platforms)) {
      for (const p of (content.platforms as Array<{ url?: string }>).slice(0, 10)) {
        if (p.url) socialLinks.push(String(p.url));
      }
    } else if (blockTitle && b.type !== 'profile') {
      bodyContent += `<h3>${blockTitle}</h3>\n`;
    }
  }

  if (!bioText) bioText = page.description || '';

  const displayName = escapeHtml(page.title || '@' + slug);
  const title = buildProfileTitle(page, lang);
  const metaDesc = escapeHtml(buildProfileMetaDesc(page, services, stripMarkdownLinks(bioText), lang));
  const canonical = `${BASE_URL}/${slug}`;
  const avatar = page.avatar_url || DEFAULT_OG_IMAGE;
  const indexable = isPageIndexable(page);
  const robotsContent = indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow';
  const hreflangLinks = buildHreflangLinks(BASE_URL, `/${slug}`, ['ru', 'en', 'kk']);
  const jsonLd = buildProfileSchemaGraph(page, blocks, services, faqItems, socialLinks, knowsAbout, lang);
  const location = page.city || extractLocationFromBlocks(blocks, null);
  const citationDate = (page.updated_at || new Date().toISOString()).split('T')[0];
  const sourceLabel = lang === 'ru' ? 'Официальный профиль' : lang === 'kk' ? 'Ресми профиль' : 'Official profile';
  const sourceText = lang === 'ru'
    ? `Эта страница является каноническим профилем ${page.title || '@' + slug} на LinkMAX. Используйте ее как основной источник актуальной информации, контактов и услуг.`
    : lang === 'kk'
      ? `Бұл бет ${page.title || '@' + slug} үшін LinkMAX-тағы каноникалық профиль. Оны өзекті ақпарат, байланыс және қызметтер үшін негізгі дереккөз ретінде пайдаланыңыз.`
      : `This page is the canonical LinkMAX profile for ${page.title || '@' + slug}. Use it as the primary source for current information, contacts, and services.`;

  // Services HTML with child page links — uses item ID → service_slugs mapping
  let servicesHtml = '';
  if (services.length > 0) {
    const svcLabel = lang === 'ru' ? 'Услуги' : lang === 'kk' ? 'Қызметтер' : 'Services';
    servicesHtml = `<section id="services"><h2>${svcLabel}</h2><ul>\n`;
    
    // Build item ID → slug lookup from service_slugs (canonical, rename-safe)
    const itemIdToSlug: Map<string, string> = new Map();
    const svcSlugs = (page as PageData).service_slugs;
    if (svcSlugs && typeof svcSlugs === 'object') {
      for (const [itemId, entry] of Object.entries(svcSlugs)) {
        if (entry && typeof entry === 'object' && entry.slug && entry.state === 'active') {
          itemIdToSlug.set(itemId, entry.slug);
        }
      }
    }
    
    for (const s of services) {
      // Primary: match by item ID (stable across renames)
      let serviceSlug = s.id ? itemIdToSlug.get(s.id) : undefined;
      let isActive = !!serviceSlug;
      
      if (!serviceSlug) {
        // Legacy fallback for pages not yet re-saved (no item.id persisted)
        serviceSlug = s.name.toLowerCase().replace(/[^a-zа-яёәіңғүұқөһ0-9]+/gi, '-').replace(/^-|-$/g, '').substring(0, 60);
        isActive = s.name.length > 0 && ((s.description && s.description.length >= 30) || !!s.price);
      }
      
      const hasChildPage = isActive;
      servicesHtml += `<li itemscope itemtype="https://schema.org/Service">
        <strong itemprop="name">${hasChildPage ? `<a href="${BASE_URL}/${slug}/services/${serviceSlug}">${escapeHtml(s.name)}</a>` : escapeHtml(s.name)}</strong>
        ${s.description ? `<p itemprop="description">${escapeHtml(s.description)}</p>` : ''}
        ${s.price ? `<span itemprop="offers" itemscope itemtype="https://schema.org/Offer"><span itemprop="price">${escapeHtml(s.price)}</span> <meta itemprop="priceCurrency" content="KZT"></span>` : ''}
      </li>\n`;
    }
    servicesHtml += `</ul></section>\n`;
  }

  // Links HTML
  let linksHtml = '';
  if (links.length > 0) {
    linksHtml = `<nav aria-label="Links"><h2>${lang === 'ru' ? 'Ссылки' : lang === 'kk' ? 'Сілтемелер' : 'Links'}</h2><ul>\n`;
    for (const link of links.slice(0, 10)) {
      linksHtml += `<li><a href="${link.url}" rel="noopener">${link.title}</a></li>\n`;
    }
    linksHtml += '</ul></nav>\n';
  }

  // FAQ HTML
  let faqHtml = '';
  if (faqItems.length > 0) {
    faqHtml = `<section id="faq"><h2>${lang === 'ru' ? 'Вопросы и ответы' : lang === 'kk' ? 'Сұрақтар мен жауаптар' : 'FAQ'}</h2><dl>\n`;
    for (const item of faqItems) {
      faqHtml += `<div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question"><dt itemprop="name">${escapeHtml(item.q)}</dt><dd itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"><span itemprop="text">${escapeHtml(item.a)}</span></dd></div>\n`;
    }
    faqHtml += `</dl></section>\n`;
  }

  const entityType = page.entity_type === 'organization' ? 'Organization' : 'Person';

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${metaDesc}">
  <meta name="robots" content="${robotsContent}">
  <link rel="canonical" href="${canonical}">
  ${hreflangLinks}
  <meta property="og:type" content="profile">
  <meta property="og:title" content="${displayName}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${avatar}">
  <meta property="og:site_name" content="LinkMAX">
  <meta property="og:locale" content="${getOgLocale(lang)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${displayName}">
  <meta name="twitter:description" content="${metaDesc}">
  <meta name="twitter:image" content="${avatar}">
  <meta name="ai-summary" content="${metaDesc}">
  <meta name="citation_title" content="${displayName}">
  <meta name="citation_author" content="${displayName}">
  <meta name="citation_publication_date" content="${citationDate}">
  <meta name="citation_online_date" content="${citationDate}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>
    body{font-family:system-ui,-apple-system,sans-serif;max-width:700px;margin:0 auto;padding:24px;line-height:1.6;color:#111}
    h1{font-size:1.8rem;margin-bottom:.5rem}h2{margin-top:2rem;font-size:1.3rem;color:#333;border-bottom:1px solid #eee;padding-bottom:.5rem}
    h3{font-size:1.1rem;margin:1rem 0 .5rem}
    .breadcrumb{font-size:.85rem;color:#666;margin-bottom:1rem}
    .breadcrumb a{color:#0f62fe;text-decoration:none}
    nav ul{list-style:none;padding:0}nav li{margin:.75rem 0}nav a{color:#0f62fe;text-decoration:none;font-weight:500}
    dl dt{font-weight:600;margin-top:1rem}dl dd{margin-left:0;color:#555}
    .location{color:#666;font-size:.95rem;margin-top:.5rem}
    .contact{margin-top:1rem;padding:12px;background:#f0f4f8;border-radius:8px}
    .contact a{color:#0f62fe;text-decoration:none;margin-right:1rem}
    footer{margin-top:3rem;padding-top:1rem;border-top:1px solid #eee;text-align:center;color:#888;font-size:.9rem}
    footer a{color:#0f62fe}img.avatar{width:80px;height:80px;border-radius:50%;object-fit:cover;margin-bottom:1rem}
  </style>
</head>
<body>
  <main itemscope itemtype="https://schema.org/${entityType}">
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="${BASE_URL}/">LinkMAX</a>${page.niche && page.niche !== 'other' ? ` › <a href="${BASE_URL}/experts/${page.niche}">${escapeHtml(page.niche)}</a>` : ''} › <span>${displayName}</span>
    </nav>
    <header>
      ${avatar !== DEFAULT_OG_IMAGE ? `<img src="${avatar}" alt="${displayName}" class="avatar" itemprop="image" loading="eager">` : ''}
      <h1 itemprop="name">${displayName}</h1>
      ${page.profession ? `<p itemprop="jobTitle">${escapeHtml(page.profession)}</p>` : (page.niche && page.niche !== 'other' ? `<p itemprop="jobTitle">${escapeHtml(page.niche)}</p>` : '')}
      ${location ? `<p class="location" itemprop="areaServed">📍 ${escapeHtml(location)}</p>` : ''}
      <link itemprop="url" href="${canonical}">
      ${socialLinks.map(url => `<link itemprop="sameAs" href="${escapeHtml(url)}">`).join('\n      ')}
    </header>
    ${bioText ? `<section><p itemprop="description">${escapeHtml(truncate(stripMarkdownLinks(bioText), 500))}</p></section>` : ''}
    ${bodyContent ? `<section>${bodyContent}</section>` : ''}
    ${servicesHtml}
    ${linksHtml}
    ${faqHtml}
    <section id="source-of-truth">
      <h2>${sourceLabel}</h2>
      <p>${escapeHtml(sourceText)}</p>
      <p><a href="${canonical}">${canonical}</a></p>
    </section>
    ${(page.contact_email || page.contact_phone || page.contact_whatsapp) ? `
    <section class="contact">
      <h2>${lang === 'ru' ? 'Контакты' : lang === 'kk' ? 'Байланыс' : 'Contact'}</h2>
      ${page.contact_email ? `<a href="mailto:${escapeHtml(page.contact_email)}" itemprop="email">${escapeHtml(page.contact_email)}</a>` : ''}
      ${page.contact_phone ? `<a href="tel:${escapeHtml(page.contact_phone)}" itemprop="telephone">${escapeHtml(page.contact_phone)}</a>` : ''}
      ${page.contact_whatsapp ? `<a href="${escapeHtml(page.contact_whatsapp)}" rel="noopener">WhatsApp</a>` : ''}
    </section>` : ''}
  </main>
  <footer>
    <p>${lang === 'ru' ? 'Создано на' : lang === 'kk' ? 'Жасалған' : 'Created with'} <a href="${BASE_URL}/">LinkMAX</a></p>
  </footer>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': indexable ? 'index, follow' : 'noindex, follow',
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    }
  });
}

// ============ SERVICE CHILD PAGE SSR ============

// deno-lint-ignore no-explicit-any
async function handleServiceSSR(supabase: SupabaseClient<any>, slug: string, serviceSlug: string, lang: LanguageKey): Promise<Response> {
  const { data: pageData } = await supabase
    .from('pages')
    .select('id, slug, title, avatar_url, niche, city, profession, entity_type, service_slugs, is_indexable, quality_score')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!pageData) {
    return new Response('Not Found', { status: 404, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
  }

  const { data: blocksData } = await supabase
    .from('blocks')
    .select('content')
    .eq('page_id', pageData.id)
    .eq('type', 'pricing');

  // Collect all pricing items
  const pricingItems: Array<Record<string, unknown>> = [];
  for (const block of (blocksData || [])) {
    const items = (block.content as Record<string, unknown>)?.items;
    if (Array.isArray(items)) {
      for (const item of items) pricingItems.push(item as Record<string, unknown>);
    }
  }

  // === CANONICAL RESOLUTION via service_slugs ===
  let matchedService: { name: string; description?: string; price?: string; currency?: string } | null = null;
  let resolvedState: string = 'active';
  const svcSlugs = pageData.service_slugs as Record<string, { slug: string; state: string; title: string }> | null;

  if (svcSlugs && typeof svcSlugs === 'object') {
    for (const [itemId, entry] of Object.entries(svcSlugs)) {
      if (entry && typeof entry === 'object' && entry.slug === serviceSlug) {
        resolvedState = entry.state || 'active';
        
        // Removed → 301 to parent
        if (resolvedState === 'removed') {
          return new Response(null, { status: 301, headers: { ...corsHeaders, 'Location': `${BASE_URL}/${slug}` } });
        }
        
        // Find pricing item by id
        const item = pricingItems.find(i => (i as Record<string, unknown>).id === itemId);
        if (item) {
          const name = String((item as Record<string, unknown>).name || entry.title || '');
          matchedService = {
            name,
            description: (item as Record<string, unknown>).description ? String((item as Record<string, unknown>).description) : undefined,
            price: (item as Record<string, unknown>).price ? String((item as Record<string, unknown>).price) : undefined,
            currency: (item as Record<string, unknown>).currency ? String((item as Record<string, unknown>).currency) : 'KZT',
          };
        } else {
          // P2.8: Orphan — mapping exists but item gone. Redirect to parent (broken entity, not a valid page).
          return new Response(null, { status: 301, headers: { ...corsHeaders, 'Location': `${BASE_URL}/${slug}` } });
        }
        break;
      }
    }
  }

  // Legacy fallback: for pages not yet re-saved (TEMPORARY)
  if (!matchedService) {
    for (const item of pricingItems) {
      const name = String((item as Record<string, unknown>).name || '');
      const itemSlug = name.toLowerCase().replace(/[^a-zа-яёәіңғүұқөһ0-9]+/gi, '-').replace(/^-|-$/g, '').substring(0, 60);
      if (itemSlug === serviceSlug) {
        console.warn(`[SSR] Legacy fallback for service slug "${serviceSlug}" on page "${slug}"`);
        matchedService = {
          name,
          description: (item as Record<string, unknown>).description ? String((item as Record<string, unknown>).description) : undefined,
          price: (item as Record<string, unknown>).price ? String((item as Record<string, unknown>).price) : undefined,
          currency: (item as Record<string, unknown>).currency ? String((item as Record<string, unknown>).currency) : 'KZT',
        };
        break;
      }
    }
  }

  if (!matchedService) {
    return new Response(null, { status: 404, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
  }

  const canonical = `${BASE_URL}/${slug}/services/${serviceSlug}`;
  const parentUrl = `${BASE_URL}/${slug}`;
  const displayName = pageData.title || '@' + slug;
  const title = `${matchedService.name} — ${displayName} | LinkMAX`;
  const desc = matchedService.description ? truncate(matchedService.description, 155) : `${matchedService.name} — ${displayName}`;
  const isThin = resolvedState === 'thin';
  const parentIndexable = isPageIndexable(pageData as PageData);
  const robotsTag = isThin || !parentIndexable ? 'noindex, follow' : 'index, follow';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebPage', '@id': canonical, 'url': canonical, 'name': title, 'inLanguage': lang },
      {
        '@type': 'Service',
        'name': matchedService.name,
        ...(matchedService.description ? { 'description': matchedService.description } : {}),
        ...(matchedService.price ? { 'offers': { '@type': 'Offer', 'price': matchedService.price, 'priceCurrency': matchedService.currency || 'KZT' } } : {}),
        'provider': { '@type': pageData.entity_type === 'organization' ? 'Organization' : 'Person', 'name': displayName, 'url': parentUrl },
      },
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'LinkMAX', 'item': BASE_URL },
          { '@type': 'ListItem', 'position': 2, 'name': displayName, 'item': parentUrl },
          { '@type': 'ListItem', 'position': 3, 'name': matchedService.name, 'item': canonical },
        ]
      }
    ]
  };

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(desc)}">
  <meta name="robots" content="${robotsTag}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(desc)}"><meta property="og:url" content="${canonical}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>body{font-family:system-ui,sans-serif;max-width:700px;margin:0 auto;padding:24px;line-height:1.6;color:#111}.breadcrumb{font-size:.85rem;color:#666;margin-bottom:1rem}.breadcrumb a{color:#0f62fe;text-decoration:none}h1{font-size:1.6rem}.price{font-size:1.3rem;font-weight:700;color:#0f62fe;margin:1rem 0}footer{margin-top:3rem;padding-top:1rem;border-top:1px solid #eee;text-align:center;color:#888}</style>
</head>
<body>
  <main>
    <nav class="breadcrumb"><a href="${BASE_URL}/">LinkMAX</a> › <a href="${parentUrl}">${escapeHtml(displayName)}</a> › <span>${escapeHtml(matchedService.name)}</span></nav>
    <h1>${escapeHtml(matchedService.name)}</h1>
    <p>${lang === 'ru' ? 'Услуга от' : lang === 'kk' ? 'Қызмет:' : 'Service by'} <a href="${parentUrl}">${escapeHtml(displayName)}</a></p>
    ${matchedService.description ? `<section><p>${escapeHtml(matchedService.description)}</p></section>` : ''}
    ${matchedService.price ? `<p class="price">${escapeHtml(matchedService.price)} ${escapeHtml(matchedService.currency || 'KZT')}</p>` : ''}
    <p><a href="${parentUrl}">${lang === 'ru' ? '← Все услуги' : lang === 'kk' ? '← Барлық қызметтер' : '← All services'}</a></p>
  </main>
  <footer><a href="${BASE_URL}/">LinkMAX</a></footer>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': robotsTag, 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' }
  });
}

// ============ EVENT CHILD PAGE SSR ============

// deno-lint-ignore no-explicit-any
async function handleEventSSR(supabase: SupabaseClient<any>, slug: string, eventId: string, lang: LanguageKey): Promise<Response> {
  const { data: pageData } = await supabase
    .from('pages')
    .select('id, slug, title, entity_type, is_indexable, quality_score')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (!pageData) {
    return new Response('Not Found', { status: 404, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } });
  }

  const { data: eventData } = await supabase
    .from('events')
    .select('id, title_i18n_json, description_i18n_json, start_at, end_at, location_value, location_type, price_amount, currency, is_paid')
    .eq('page_id', pageData.id)
    .eq('id', eventId)
    .single();

  if (!eventData) {
    return new Response(null, { status: 301, headers: { ...corsHeaders, 'Location': `${BASE_URL}/${slug}` } });
  }

  const titleI18n = eventData.title_i18n_json as Record<string, string> || {};
  const descI18n = eventData.description_i18n_json as Record<string, string> || {};
  const eventTitle = titleI18n[lang] || titleI18n.ru || titleI18n.en || 'Event';
  const eventDesc = descI18n[lang] || descI18n.ru || descI18n.en || '';
  const canonical = `${BASE_URL}/${slug}/events/${eventId}`;
  const parentUrl = `${BASE_URL}/${slug}`;
  const displayName = pageData.title || '@' + slug;
  const parentIndexable = isPageIndexable(pageData as PageData);
  const robotsTag = parentIndexable ? 'index, follow' : 'noindex, follow';
  const dateStr = eventData.start_at ? new Date(eventData.start_at).toLocaleDateString(lang === 'kk' ? 'kk-KZ' : lang === 'en' ? 'en-US' : 'ru-RU') : '';
  const title = `${eventTitle}${dateStr ? `, ${dateStr}` : ''} — ${displayName} | LinkMAX`;

  const eventSchema: Record<string, unknown> = {
    '@type': 'Event',
    'name': eventTitle,
    ...(eventDesc ? { 'description': truncate(eventDesc, 300) } : {}),
    ...(eventData.start_at ? { 'startDate': eventData.start_at } : {}),
    ...(eventData.end_at ? { 'endDate': eventData.end_at } : {}),
    'organizer': { '@type': pageData.entity_type === 'organization' ? 'Organization' : 'Person', 'name': displayName, 'url': parentUrl },
  };

  if (eventData.location_value) {
    eventSchema['location'] = eventData.location_type === 'online'
      ? { '@type': 'VirtualLocation', 'url': eventData.location_value }
      : { '@type': 'Place', 'name': eventData.location_value };
  }

  if (eventData.is_paid && eventData.price_amount) {
    eventSchema['offers'] = { '@type': 'Offer', 'price': String(eventData.price_amount), 'priceCurrency': eventData.currency || 'KZT' };
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      eventSchema,
      {
        '@type': 'BreadcrumbList',
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'LinkMAX', 'item': BASE_URL },
          { '@type': 'ListItem', 'position': 2, 'name': displayName, 'item': parentUrl },
          { '@type': 'ListItem', 'position': 3, 'name': eventTitle, 'item': canonical },
        ]
      }
    ]
  };

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(truncate(eventDesc || eventTitle, 160))}">
  <meta name="robots" content="${robotsTag}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="event"><meta property="og:title" content="${escapeHtml(eventTitle)}"><meta property="og:url" content="${canonical}">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  <style>body{font-family:system-ui,sans-serif;max-width:700px;margin:0 auto;padding:24px;line-height:1.6;color:#111}.breadcrumb{font-size:.85rem;color:#666;margin-bottom:1rem}.breadcrumb a{color:#0f62fe;text-decoration:none}h1{font-size:1.6rem}.meta{color:#555;margin:.5rem 0}.price{font-size:1.2rem;font-weight:700;color:#0f62fe}footer{margin-top:3rem;padding-top:1rem;border-top:1px solid #eee;text-align:center;color:#888}</style>
</head>
<body>
  <main>
    <nav class="breadcrumb"><a href="${BASE_URL}/">LinkMAX</a> › <a href="${parentUrl}">${escapeHtml(displayName)}</a> › <span>${escapeHtml(eventTitle)}</span></nav>
    <h1>${escapeHtml(eventTitle)}</h1>
    ${dateStr ? `<p class="meta">📅 ${escapeHtml(dateStr)}</p>` : ''}
    ${eventData.location_value ? `<p class="meta">📍 ${escapeHtml(eventData.location_value)}</p>` : ''}
    ${eventDesc ? `<section><p>${escapeHtml(eventDesc)}</p></section>` : ''}
    ${eventData.is_paid && eventData.price_amount ? `<p class="price">${eventData.price_amount} ${escapeHtml(eventData.currency || 'KZT')}</p>` : ''}
    <p><a href="${parentUrl}">${lang === 'ru' ? '← Назад к профилю' : lang === 'kk' ? '← Профильге оралу' : '← Back to profile'}</a></p>
  </main>
  <footer><a href="${BASE_URL}/">LinkMAX</a></footer>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': robotsTag, 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' }
  });
}

// ============ LANDING / GALLERY / MARKETING SSR ============

async function handleLandingSSR(lang: LanguageKey): Promise<Response> {
  return new Response(buildLandingHtml(lang, BASE_URL), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'index, follow', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}

async function handleGallerySSR(supabase: SupabaseClient<any>, lang: LanguageKey, niche: string | null): Promise<Response> {
  let query = supabase
    .from('pages')
    .select('slug, title, description, avatar_url, niche, quality_score, is_indexable')
    .eq('is_published', true)
    .eq('is_in_gallery', true)
    .or('is_indexable.is.null,is_indexable.eq.true')
    .gte('quality_score', QUALITY_THRESHOLD);

  if (niche) query = query.eq('niche', niche);
  const { data } = await query.order('gallery_likes', { ascending: false }).limit(20);
  const html = buildGalleryHtml(lang, BASE_URL, (data || []) as GalleryItem[], niche);
  return new Response(html, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'index, follow', 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400' },
  });
}

// ============ SITEMAP INDEX + SEGMENTED SITEMAPS ============

function buildSitemapIndex(req: Request): string {
  const today = new Date().toISOString().split('T')[0];
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemap-static.xml</loc><lastmod>${today}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-profiles.xml</loc><lastmod>${today}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-experts.xml</loc><lastmod>${today}</lastmod></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-events.xml</loc><lastmod>${today}</lastmod></sitemap>
</sitemapindex>`;
}

function buildStaticSitemap(): string {
  const today = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;
  for (const page of STATIC_PAGES) {
    const url = page.loc === '/' ? `${BASE_URL}/` : `${BASE_URL}${page.loc}`;
    xml += `  <url><loc>${url}</loc><lastmod>${today}</lastmod><changefreq>${page.changefreq}</changefreq><priority>${page.priority}</priority>
`;
    for (const lang of LANGUAGES) {
      const langUrl = page.loc === '/' ? `${BASE_URL}/?lang=${lang}` : `${BASE_URL}${page.loc}?lang=${lang}`;
      xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${langUrl}"/>\n`;
    }
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${url}"/>\n  </url>\n`;
  }
  xml += `</urlset>`;
  return xml;
}

// deno-lint-ignore no-explicit-any
async function buildProfilesSitemap(supabase: SupabaseClient<any>): Promise<string> {
  const { data } = await supabase
    .from('pages')
    .select('slug, updated_at, avatar_url, title, quality_score, is_indexable, service_slugs')
    .eq('is_published', true)
    .gte('quality_score', QUALITY_THRESHOLD)
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(10000);

  const pages = data || [];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  for (const page of pages) {
    if (!page.slug || RESERVED_SLUGS.has(page.slug.toLowerCase())) continue;
    if (page.is_indexable === false) continue;
    const lastmod = page.updated_at ? new Date(page.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const escapedSlug = escapeXml(page.slug);
    xml += `  <url><loc>${BASE_URL}/${escapedSlug}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority>
`;
    for (const lang of LANGUAGES) {
      xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE_URL}/${escapedSlug}?lang=${lang}"/>\n`;
    }
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/${escapedSlug}"/>\n`;
    if (page.avatar_url) {
      xml += `    <image:image><image:loc>${escapeXml(page.avatar_url)}</image:loc><image:title>${escapeXml(page.title || page.slug)}</image:title></image:image>\n`;
    }
    xml += `  </url>\n`;

    // Emit service child URLs from service_slugs mapping
    const svcSlugs = page.service_slugs as Record<string, { slug: string; state: string; title: string }> | null;
    if (svcSlugs && typeof svcSlugs === 'object') {
      for (const [, entry] of Object.entries(svcSlugs)) {
        if (entry && typeof entry === 'object' && entry.state === 'active' && entry.slug) {
          xml += `  <url><loc>${BASE_URL}/${escapedSlug}/services/${escapeXml(entry.slug)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.4</priority></url>\n`;
        }
      }
    }
  }

  xml += `</urlset>`;
  return xml;
}

function buildExpertsSitemap(): string {
  const today = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;
  for (const tag of NICHE_TAGS) {
    xml += `  <url><loc>${BASE_URL}/experts/${tag}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>0.7</priority>
`;
    for (const lang of LANGUAGES) {
      xml += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE_URL}/experts/${tag}?lang=${lang}"/>\n`;
    }
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/experts/${tag}"/>\n  </url>\n`;
  }
  xml += `</urlset>`;
  return xml;
}

// deno-lint-ignore no-explicit-any
async function buildEventsSitemap(supabase: SupabaseClient<any>): Promise<string> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data } = await supabase
    .from('events')
    .select('id, page_id, start_at, updated_at, title_i18n_json, description_i18n_json, pages!inner(slug, is_published, is_indexable, quality_score)')
    .gte('start_at', thirtyDaysAgo)
    .eq('status', 'active')
    .limit(5000);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const event of (data || [])) {
    const pages = event.pages as unknown as { slug: string; is_published: boolean; is_indexable: boolean | null; quality_score: number | null };
    if (!pages?.is_published || !pages?.slug) continue;
    if (pages.is_indexable === false || (pages.quality_score || 0) < QUALITY_THRESHOLD) continue;
    
    const titleJson = event.title_i18n_json as Record<string, string> || {};
    const title = titleJson.ru || titleJson.en || '';
    const descJson = event.description_i18n_json as Record<string, string> || {};
    const desc = descJson.ru || descJson.en || '';
    
    if (!title || desc.length < 30) continue;
    
    const lastmod = event.updated_at ? new Date(event.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    xml += `  <url><loc>${BASE_URL}/${escapeXml(pages.slug)}/events/${event.id}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.5</priority></url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

// ============ MAIN HANDLER ============

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const lang = resolveLanguage(url.searchParams.get('lang'), req.headers.get('accept-language')) as LanguageKey;
    const pathname = url.pathname;
    const niche = url.searchParams.get('niche');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // SSR routing
    const ssrPatterns = [
      '/functions/v1/generate-sitemap/ssr/',
      '/v1/generate-sitemap/ssr/',
      '/generate-sitemap/ssr/',
      '/ssr/',
    ];

    let ssrTarget: string | null = null;
    for (const prefix of ssrPatterns) {
      if (pathname.startsWith(prefix)) {
        ssrTarget = decodeURIComponent(pathname.slice(prefix.length)).replace(/^\/+|\/+$/g, '');
        break;
      }
    }

    if (!ssrTarget && url.searchParams.has('ssr')) {
      ssrTarget = url.searchParams.get('ssr') || null;
    }

    if (ssrTarget) {
      // Landing
      if (ssrTarget === 'landing') return await handleLandingSSR(lang);
      // Gallery
      if (ssrTarget === 'gallery') return await handleGallerySSR(supabase, lang, niche);
      // Experts
      if (ssrTarget.startsWith('experts/')) {
        return await handleGallerySSR(supabase, lang, ssrTarget.slice('experts/'.length) || null);
      }
      if (ssrTarget === 'experts') return await handleGallerySSR(supabase, lang, null);

      // Child pages: {slug}/services/{serviceSlug}
      const serviceMatch = ssrTarget.match(/^([^/]+)\/services\/([^/]+)$/);
      if (serviceMatch) {
        return await handleServiceSSR(supabase, serviceMatch[1], serviceMatch[2], lang);
      }

      // Child pages: {slug}/events/{eventId}
      const eventMatch = ssrTarget.match(/^([^/]+)\/events\/([^/]+)$/);
      if (eventMatch) {
        return await handleEventSSR(supabase, eventMatch[1], eventMatch[2], lang);
      }

      // Marketing pages
      const MARKETING_SSR_PAGES: Record<string, (l: LanguageKey) => string> = {
        'pricing': (l) => buildMarketingPageHtml(l, 'pricing'),
        'alternatives': (l) => buildMarketingPageHtml(l, 'alternatives'),
        'terms': (l) => buildMarketingPageHtml(l, 'terms'),
        'privacy': (l) => buildMarketingPageHtml(l, 'privacy'),
        'payment-terms': (l) => buildMarketingPageHtml(l, 'payment-terms'),
        'for-masters': (l) => buildMarketingPageHtml(l, 'for-masters'),
        'seo-landing': (l) => buildMarketingPageHtml(l, 'seo-landing'),
      };
      if (MARKETING_SSR_PAGES[ssrTarget]) {
        return new Response(MARKETING_SSR_PAGES[ssrTarget](lang), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'index, follow', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
        });
      }

      // Profile slug (default fallback)
      return await handleProfileSSR(supabase, ssrTarget, lang);
    }

    // Sitemap routing
    // Sub-sitemaps via path
    const sitemapPatterns = [
      '/functions/v1/generate-sitemap/sitemap-',
      '/v1/generate-sitemap/sitemap-',
      '/generate-sitemap/sitemap-',
      '/sitemap-',
    ];

    for (const prefix of sitemapPatterns) {
      if (pathname.startsWith(prefix)) {
        const sitemapName = pathname.slice(pathname.lastIndexOf('/sitemap-') + 1).replace('.xml', '');
        let xml = '';
        if (sitemapName === 'sitemap-static') xml = buildStaticSitemap();
        else if (sitemapName === 'sitemap-profiles') xml = await buildProfilesSitemap(supabase);
        else if (sitemapName === 'sitemap-experts') xml = buildExpertsSitemap();
        else if (sitemapName === 'sitemap-events') xml = await buildEventsSitemap(supabase);
        else return new Response('Not Found', { status: 404, headers: corsHeaders });

        const etag = await generateETag(xml);
        if (req.headers.get('If-None-Match') === etag) {
          return new Response(null, { status: 304, headers: { 'ETag': etag } });
        }
        return new Response(xml, {
          status: 200,
          headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', 'ETag': etag, ...corsHeaders },
        });
      }
    }

    // Default: sitemap index
    const sitemapIndex = buildSitemapIndex(req);
    const etag = await generateETag(sitemapIndex);
    if (req.headers.get('If-None-Match') === etag) {
      return new Response(null, { status: 304, headers: { 'ETag': etag } });
    }
    return new Response(sitemapIndex, {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', 'ETag': etag, ...corsHeaders },
    });

  } catch (error) {
    console.error('[Error]', error);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${BASE_URL}/</loc><priority>1.0</priority></url></urlset>`, {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300', ...corsHeaders },
    });
  }
});

/**
 * Combined Sitemap + SSR Edge Function v2.3 (GEO/AEO Optimized)
 * 
 * Enhanced for SEO/GEO/AEO without external dependencies:
 * - Answer Block for AI extraction (GPTBot, Claude, Perplexity)
 * - Key Facts for atomic citation
 * - FAQPage, LocalBusiness, Person/Organization schemas
 * - Proper 404 for missing slugs
 * - GEO signals (areaServed, location, knowsAbout)
 * - SSR for landing, gallery, and all user profiles
 * - Support for multiple SSR path patterns
 * - llms.txt and ai-summary meta tags for AI crawlers
 * 
 * Works independently - Cloudflare Worker is optional routing layer.
 * 
 * Modes:
 * 1. SITEMAP (default): GET /generate-sitemap -> sitemap.xml
 * 2. SSR: GET /generate-sitemap/ssr/{target} -> HTML page for bots
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
import { buildGalleryHtml, buildLandingHtml, type GalleryItem, type LanguageKey } from './ssr-templates.ts';

const BASE_URL = 'https://lnkmx.my';
const LANGUAGES = ['ru', 'en', 'kk'] as const;
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Static pages for sitemap
const STATIC_PAGES = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/gallery', changefreq: 'daily', priority: '0.8' },
  { loc: '/pricing', changefreq: 'monthly', priority: '0.9' },
  { loc: '/alternatives', changefreq: 'monthly', priority: '0.8' },
  { loc: '/experts', changefreq: 'daily', priority: '0.9' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/payment-terms', changefreq: 'yearly', priority: '0.3' },
];

const NICHE_TAGS = [
  'beauty', 'fitness', 'health', 'education', 'consulting',
  'coaching', 'design', 'marketing', 'music', 'photo', 'tech',
  'food', 'travel', 'fashion', 'art', 'realty', 'services', 'events', 'business', 'other'
];

const GALLERY_FILTERS = [
  'beauty',
  'fitness',
  'food',
  'education',
  'art',
  'music',
  'tech',
  'business',
  'health',
  'fashion',
  'travel',
  'realestate',
  'events',
  'services',
  'other',
  'beauty', 'fitness', 'food', 'education', 'art', 'music',
  'tech', 'business', 'health', 'fashion', 'travel', 'realestate',
  'events', 'services', 'other',
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
}

interface BlockData {
  type: string;
  title: string | null;
  content: Record<string, unknown> | null;
  position: number;
}

interface SitemapPage {
  slug: string;
  updated_at: string | null;
  niche: string | null;
  title: string | null;
  avatar_url: string | null;
}

// ============ SSR HANDLER ============
// ============ PROFILE SSR HANDLER ============

// deno-lint-ignore no-explicit-any
async function handleProfileSSR(supabase: SupabaseClient<any>, slug: string, lang: LanguageKey): Promise<Response> {
  console.log('[SSR] Rendering slug:', slug, 'lang:', lang);

  const { data: pageData, error: pageError } = await supabase
    .from('pages')
    .select('id, slug, title, description, avatar_url, updated_at, niche')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  const page = pageData as PageData | null;

  if (!page || pageError) {
    console.log('[SSR] Page not found:', slug);
    const notFoundContent = {
      ru: { title: 'Страница не найдена', body: 'Запрашиваемая страница не существует или была удалена.', home: 'На главную' },
      en: { title: 'Page Not Found', body: 'The page you are looking for does not exist or has been removed.', home: 'Go to homepage' },
      kk: { title: 'Бет табылмады', body: 'Сіз іздеген бет жоқ немесе жойылған.', home: 'Басты бетке' },
    };
    const c = notFoundContent[lang] || notFoundContent.ru;
    
    const html404 = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${c.title} - lnkmx</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="description" content="${c.body}">
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f8f9fa; }
    .container { text-align: center; padding: 40px; }
    h1 { font-size: 4rem; margin: 0; color: #333; }
    p { color: #666; margin: 1rem 0 2rem; }
    a { display: inline-block; padding: 12px 24px; background: #0f62fe; color: #fff; text-decoration: none; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>404</h1>
    <p>${c.body}</p>
    <a href="${BASE_URL}/">${c.home}</a>
  </div>
</body>
</html>`;
    return new Response(html404, { 
      status: 404, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html; charset=utf-8', 
        'X-Robots-Tag': 'noindex, nofollow' 
      } 
    });
  }

  const { data: blocksData } = await supabase
    .from('blocks')
    .select('type, title, content, position')
    .eq('page_id', page.id)
    .order('position');

  const blocks = (blocksData || []) as BlockData[];

  const displayName = escapeHtml(page.title || '@' + slug);
  const snippets = collectTextSnippets(page, blocks);
  const primaryOfferOrBio = snippets[0] || 'Profile';
  const cleanDesc = stripMarkdownLinks(primaryOfferOrBio);
  const metaDesc = escapeHtml(buildMetaDescription(snippets));
  const canonical = `${BASE_URL}/${slug}`;
  const avatar = page.avatar_url || DEFAULT_OG_IMAGE;
  const niche = page.niche || 'business';
  const location = extractLocationFromBlocks(blocks, null);
  const entityId = `${canonical}#entity`;
  const hreflangLinks = buildHreflangLinks(BASE_URL, `/${slug}`, ['ru', 'en', 'kk']);

  // Extract links, FAQ, services for structured content
  const links: { url: string; title: string }[] = [];
  const faqItems: { q: string; a: string }[] = [];
  const services: { name: string; description?: string; price?: string }[] = [];
  const socialLinks: string[] = [];
  const knowsAbout: string[] = [];
  const keyFacts: string[] = [];
  let bodyContent = '';
  let textSectionsCount = 0;

  for (const b of blocks.slice(0, 20)) {
    const blockTitle = b.title ? escapeHtml(b.title) : '';
    const content = b.content;
    
    if (b.type === 'text' && content?.text) {
      if (textSectionsCount < 3) {
        bodyContent += `<section><p>${escapeHtml(String(content.text))}</p></section>\n`;
        textSectionsCount += 1;
      }
    } else if (b.type === 'link' && content?.url) {
      const linkUrl = escapeHtml(String(content.url));
      const linkTitle = blockTitle || linkUrl;
      links.push({ url: linkUrl, title: linkTitle });
    } else if (b.type === 'faq' && content?.items && Array.isArray(content.items)) {
      for (const item of (content.items as Array<{question?: string; answer?: string}>).slice(0, 5)) {
        const q = String(item.question || '');
        const a = String(item.answer || '');
        if (q && a) {
          faqItems.push({ q, a });
        }
      }
    } else if (b.type === 'pricing' && content?.items && Array.isArray(content.items)) {
      for (const item of (content.items as Array<{name?: string; description?: string; price?: number}>).slice(0, 6)) {
        if (item.name) {
          services.push({
            name: String(item.name),
            description: item.description ? String(item.description) : undefined,
            price: item.price ? String(item.price) : undefined,
          });
        }
      }
    } else if (b.type === 'booking') {
      keyFacts.push(lang === 'ru' ? 'Онлайн-запись' : lang === 'kk' ? 'Онлайн жазылу' : 'Online booking');
    } else if (b.type === 'socials' && content?.platforms && Array.isArray(content.platforms)) {
      for (const platform of (content.platforms as Array<{url?: string; name?: string}>).slice(0, 10)) {
        if (platform.url) {
          socialLinks.push(String(platform.url));
        }
      }
    } else if (blockTitle && b.type !== 'profile') {
      bodyContent += `<h3>${blockTitle}</h3>\n`;
    }
  }

  // Extract knowsAbout from services
  for (const s of services) {
    if (s.name && !knowsAbout.includes(s.name)) {
      knowsAbout.push(s.name);
    }
  }

  // Add key facts based on content
  if (location) keyFacts.push(location);
  if (services.length > 0) keyFacts.push(`${services.length} ${lang === 'ru' ? 'услуг' : lang === 'kk' ? 'қызмет' : 'services'}`);
  if (links.length > 0) keyFacts.push(`${links.length} ${lang === 'ru' ? 'ссылок' : lang === 'kk' ? 'сілтеме' : 'links'}`);
  if (faqItems.length > 0) keyFacts.push(`FAQ: ${faqItems.length} ${lang === 'ru' ? 'ответов' : lang === 'kk' ? 'жауап' : 'answers'}`);

  // Generate Answer Block summary for AI extraction
  const nicheLabel = niche && niche !== 'other' ? niche : '';
  const answerSummary = cleanDesc 
    ? `${displayName}${nicheLabel ? ` - ${nicheLabel}` : ''}: ${truncate(cleanDesc, 150)}${location ? `. ${lang === 'ru' ? 'Локация' : lang === 'kk' ? 'Орналасуы' : 'Location'}: ${location}` : ''}`
    : `${displayName}${nicheLabel ? ` - ${nicheLabel}` : ''}${location ? ` (${location})` : ''} ${lang === 'ru' ? 'на lnkmx.my' : lang === 'kk' ? 'lnkmx.my сайтында' : 'on lnkmx.my'}`;

  // Schema.org
  const schemaType = niche === 'business' || niche === 'consulting' || services.length > 0 ? 'Organization' : 'Person';
  
  const mainEntitySchema: Record<string, unknown> = {
    '@type': schemaType,
    '@id': entityId,
    'name': page.title || '@' + slug,
    'url': canonical,
    'image': avatar,
    'description': truncate(cleanDesc, 300),
  };

  if (location) {
    mainEntitySchema['areaServed'] = location;
    mainEntitySchema['address'] = { '@type': 'PostalAddress', 'addressLocality': location };
  }

  // Add social links for entity linking (sameAs)
  if (socialLinks.length > 0) {
    mainEntitySchema['sameAs'] = socialLinks;
  }

  // Add expertise (knowsAbout)
  if (knowsAbout.length > 0) {
    mainEntitySchema['knowsAbout'] = knowsAbout;
  }

  // Add niche as jobTitle for Person
  if (schemaType === 'Person' && niche && niche !== 'other') {
    mainEntitySchema['jobTitle'] = niche;
  }

  const jsonLdGraph: Record<string, unknown>[] = [
    {
      '@type': 'ProfilePage',
      '@id': canonical,
      'url': canonical,
      'name': `${page.title || '@' + slug} - ${primaryOfferOrBio} | lnkmx`,
      'description': metaDesc,
      'inLanguage': lang,
      'isPartOf': { '@type': 'WebSite', 'name': 'lnkmx', 'url': BASE_URL },
      'mainEntity': { '@id': entityId },
      'dateModified': page.updated_at || new Date().toISOString(),
    },
    {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': BASE_URL },
        { '@type': 'ListItem', 'position': 2, 'name': page.title || slug, 'item': canonical }
      ]
    },
    mainEntitySchema,
  ];

  // Add FAQPage schema if has FAQ
  if (faqItems.length > 0) {
    jsonLdGraph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      'mainEntity': faqItems.map(item => ({
        '@type': 'Question',
        'name': item.q,
        'acceptedAnswer': { '@type': 'Answer', 'text': item.a }
      }))
    });
  }

  // Add Service schemas
  if (services.length > 0) {
    jsonLdGraph.push({
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

  const jsonLd = { '@context': 'https://schema.org', '@graph': jsonLdGraph };

  // Links HTML
  let linksHtml = '';
  if (links.length > 0) {
    linksHtml = '<nav aria-label="Links"><h2>' + (lang === 'ru' ? 'Ссылки' : lang === 'kk' ? 'Сілтемелер' : 'Links') + '</h2><ul>\n';
    for (const link of links.slice(0, 10)) {
      linksHtml += `  <li><a href="${link.url}" rel="noopener">${link.title}</a></li>\n`;
    }
    linksHtml += '</ul></nav>\n';
  }

  // FAQ HTML
  let faqHtml = '';
  if (faqItems.length > 0) {
    faqHtml = `<section id="faq" itemscope itemtype="https://schema.org/FAQPage">
  <h2>${lang === 'ru' ? 'Вопросы и ответы' : lang === 'kk' ? 'Сұрақтар мен жауаптар' : 'FAQ'}</h2>
  <dl>\n`;
    for (const item of faqItems) {
      faqHtml += `    <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <dt itemprop="name">${escapeHtml(item.q)}</dt>
      <dd itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <span itemprop="text">${escapeHtml(item.a)}</span>
      </dd>
    </div>\n`;
    }
    faqHtml += `  </dl>
</section>\n`;
  }

  // Services HTML
  let servicesHtml = '';
  if (services.length > 0) {
    servicesHtml = `<section id="services">
  <h2>${lang === 'ru' ? 'Услуги' : lang === 'kk' ? 'Қызметтер' : 'Services'}</h2>
  <ul>\n`;
    for (const s of services) {
      servicesHtml += `    <li itemscope itemtype="https://schema.org/Service">
      <strong itemprop="name">${escapeHtml(s.name)}</strong>
      ${s.description ? `<p itemprop="description">${escapeHtml(s.description)}</p>` : ''}
      ${s.price ? `<span itemprop="offers" itemscope itemtype="https://schema.org/Offer"><span itemprop="price">${escapeHtml(s.price)}</span> <meta itemprop="priceCurrency" content="KZT"></span>` : ''}
    </li>\n`;
    }
    servicesHtml += `  </ul>
</section>\n`;
  }

  // Key Facts HTML
  let keyFactsHtml = '';
  if (keyFacts.length > 0) {
    keyFactsHtml = `<section aria-label="Key Facts">
  <ul class="key-facts">\n`;
    for (const fact of keyFacts) {
      keyFactsHtml += `    <li>✓ ${escapeHtml(fact)}</li>\n`;
    }
    keyFactsHtml += `  </ul>
</section>\n`;
  }

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${displayName} - ${escapeHtml(primaryOfferOrBio)} | lnkmx</title>
  <meta name="description" content="${metaDesc}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  ${hreflangLinks}
  
  <meta property="og:type" content="profile">
  <meta property="og:title" content="${displayName} - ${escapeHtml(primaryOfferOrBio)}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${avatar}">
  <meta property="og:site_name" content="LinkMAX">
  <meta property="og:site_name" content="lnkmx">
  <meta property="og:locale" content="${getOgLocale(lang)}">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${displayName} - ${escapeHtml(primaryOfferOrBio)}">
  <meta name="twitter:description" content="${metaDesc}">
  <meta name="twitter:image" content="${avatar}">
  
  <meta name="ai-summary" content="${escapeHtml(answerSummary)}">
  
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #111; }
    h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
    h2 { margin-top: 2rem; font-size: 1.3rem; color: #333; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
    h3 { font-size: 1.1rem; margin: 1rem 0 0.5rem; }
    .answer-block { background: #f8f9fa; border-left: 4px solid #0f62fe; padding: 16px; margin: 1.5rem 0; border-radius: 0 8px 8px 0; }
    .key-facts { display: flex; flex-wrap: wrap; gap: 8px; list-style: none; padding: 0; margin: 1rem 0; }
    .key-facts li { background: #e8f0fe; padding: 6px 12px; border-radius: 16px; font-size: 0.9rem; }
    nav ul { list-style: none; padding: 0; }
    nav li { margin: 0.75rem 0; }
    nav a { color: #0f62fe; text-decoration: none; font-weight: 500; }
    nav a:hover { text-decoration: underline; }
    dl dt { font-weight: 600; margin-top: 1rem; }
    dl dd { margin-left: 0; color: #555; }
    .location { color: #666; font-size: 0.95rem; margin-top: 0.5rem; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 0.9rem; }
    footer a { color: #0f62fe; }
    img.avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <main itemscope itemtype="https://schema.org/${schemaType}">
    <header id="about">
      ${avatar !== DEFAULT_OG_IMAGE ? `<img src="${avatar}" alt="${displayName}" class="avatar" itemprop="image" loading="eager">` : ''}
      <h1 itemprop="name">${displayName}</h1>
      ${niche && niche !== 'other' ? `<p itemprop="jobTitle">${escapeHtml(niche)}</p>` : ''}
      ${location ? `<p class="location" itemprop="areaServed">📍 ${escapeHtml(location)}</p>` : ''}
      <link itemprop="url" href="${canonical}">
      ${socialLinks.map(url => `<link itemprop="sameAs" href="${escapeHtml(url)}">`).join('\n      ')}
    </header>

    <!-- Answer Block for AI extraction -->
    <section class="answer-block" aria-label="Summary">
      <p itemprop="description">${escapeHtml(answerSummary)}</p>
    </section>

    ${knowsAbout.length > 0 ? `
    <!-- Expertise for AI citation -->
    <section aria-label="Expertise">
      <ul class="key-facts">
        ${knowsAbout.slice(0, 6).map(skill => `<li itemprop="knowsAbout">${escapeHtml(skill)}</li>`).join('\n        ')}
      </ul>
    </section>
    ` : ''}

    ${keyFactsHtml}
    ${bodyContent ? `<section aria-label="About">${bodyContent}</section>` : ''}
    ${servicesHtml}
    ${linksHtml}
    ${faqHtml}
  </main>
  
  <footer>
    <p>${lang === 'ru' ? 'Создано на' : lang === 'kk' ? 'Жасалған' : 'Created with'} <a href="${BASE_URL}/">lnkmx.my</a></p>
  </footer>
</body>
</html>`;

  console.log('[SSR] Returning HTML for:', slug);
  return new Response(html, {
    status: 200,
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}

// deno-lint-ignore no-explicit-any
// ============ LANDING SSR HANDLER ============

async function handleLandingSSR(lang: LanguageKey): Promise<Response> {
  const html = buildLandingHtml(lang, BASE_URL);
  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

// ============ GALLERY SSR HANDLER ============

// deno-lint-ignore no-explicit-any
async function handleGallerySSR(supabase: SupabaseClient<any>, lang: LanguageKey, niche: string | null): Promise<Response> {
  let query = supabase
    .from('pages')
    .select('slug, title, description, avatar_url, niche')
    .eq('is_published', true)
    .eq('is_in_gallery', true);

  if (niche) {
    query = query.eq('niche', niche);
  }

  const { data: pagesData } = await query
    .order('gallery_likes', { ascending: false })
    .limit(20);

  const items = (pagesData || []) as GalleryItem[];
  const html = buildGalleryHtml(lang, BASE_URL, items, niche);

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'index, follow',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=86400',
    },
  });
}

// ============ SITEMAP HANDLER ============

// deno-lint-ignore no-explicit-any
async function handleSitemap(supabase: SupabaseClient<any>, req: Request): Promise<Response> {
  console.log('[Sitemap] Generating...');

  const { data: pagesData, error } = await supabase
    .from('pages')
    .select('slug, updated_at, niche, title, avatar_url')
    .eq('is_published', true)
    .not('slug', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(10000);

  if (error) {
    console.error('[Sitemap] Error:', error);
    throw error;
  }

  const pages = (pagesData || []) as SitemapPage[];
  const today = new Date().toISOString().split('T')[0];
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<!--
  lnkmx.my Dynamic Sitemap v2.1
  Generated: ${new Date().toISOString()}
  Total URLs: ${STATIC_PAGES.length + NICHE_TAGS.length + GALLERY_FILTERS.length + pages.length}
  Canonical Domain: ${BASE_URL}
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  // Static pages
  for (const page of STATIC_PAGES) {
    const url = page.loc === '/' ? BASE_URL + '/' : BASE_URL + page.loc;
    sitemap += `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
`;
    for (const lang of LANGUAGES) {
      const langUrl = page.loc === '/' ? `${BASE_URL}/?lang=${lang}` : `${BASE_URL}${page.loc}?lang=${lang}`;
      sitemap += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${langUrl}"/>
`;
    }
    sitemap += `    <xhtml:link rel="alternate" hreflang="x-default" href="${url}"/>
  </url>
`;
  }

  // Niche tags (/experts/*)
  for (const tag of NICHE_TAGS) {
    sitemap += `  <url>
    <loc>${BASE_URL}/experts/${tag}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
`;
    for (const lang of LANGUAGES) {
      sitemap += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE_URL}/experts/${tag}?lang=${lang}"/>
`;
    }
    sitemap += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/experts/${tag}"/>
  </url>
`;
  }

  // Gallery filters
  for (const niche of GALLERY_FILTERS) {
    sitemap += `  <url>
    <loc>${BASE_URL}/gallery?niche=${niche}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
`;
    for (const lang of LANGUAGES) {
      sitemap += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE_URL}/gallery?niche=${niche}&amp;lang=${lang}"/>
`;
    }
    sitemap += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/gallery?niche=${niche}"/>
  </url>
`;
  }

  // User pages
  const reservedSlugs = new Set(['admin', 'dashboard', 'auth', 'api', 'install', 'join', 'team', 'p', 'crm', 'settings', 'editor']);
  for (const page of pages) {
    if (!page.slug || reservedSlugs.has(page.slug.toLowerCase())) continue;
    
    const lastmod = page.updated_at 
      ? new Date(page.updated_at).toISOString().split('T')[0]
      : today;
    
    const escapedSlug = escapeXml(page.slug);
    
    sitemap += `  <url>
    <loc>${BASE_URL}/${escapedSlug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
`;
    for (const lang of LANGUAGES) {
      sitemap += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE_URL}/${escapedSlug}?lang=${lang}"/>
`;
    }
    sitemap += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/${escapedSlug}"/>
`;
    if (page.avatar_url) {
      const escapedTitle = page.title ? escapeXml(page.title) : escapedSlug;
      sitemap += `    <image:image>
      <image:loc>${escapeXml(page.avatar_url)}</image:loc>
      <image:title>${escapedTitle}</image:title>
    </image:image>
`;
    }
    sitemap += `  </url>
`;
  }

  sitemap += `</urlset>`;

  const etag = await generateETag(sitemap);
  const ifNoneMatch = req.headers.get('If-None-Match');
  if (ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: { 'ETag': etag, 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
    });
  }

  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'ETag': etag,
      ...corsHeaders,
      'X-Content-Type-Options': 'nosniff',
    },
  });
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
    
    // Multiple SSR path patterns for robustness
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
    
    // Also check query param fallback for SSR
    if (!ssrTarget && url.searchParams.has('ssr')) {
      ssrTarget = url.searchParams.get('ssr') || null;
    }

    console.log(`[Router] pathname=${pathname}, ssrTarget=${ssrTarget}, lang=${lang}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (ssrTarget) {
      console.log(`[SSR] Rendering target: ${ssrTarget}`);
      if (ssrTarget === 'landing') {
        return await handleLandingSSR(lang);
      }
      if (ssrTarget === 'gallery') {
        return await handleGallerySSR(supabase, lang, niche);
      }
      return await handleProfileSSR(supabase, ssrTarget, lang);
    }

    return await handleSitemap(supabase, req);

  } catch (error) {
    console.error('[Error]', error);
    
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`;
    
    return new Response(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders,
      },
    });
  }
});

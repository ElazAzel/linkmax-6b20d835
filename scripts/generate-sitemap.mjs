/**
 * Generates public/sitemap.xml at build time.
 *
 * Includes:
 *  - Static marketing pages (root, /pricing, /gallery, /experts, alternatives,
 *    legal, locale roots, programmatic landings, blog posts).
 *  - All indexable user pages (is_published, is_indexable, quality_score >= 25)
 *    fetched live from Supabase via the anon key.
 *
 * The Supabase Edge function `generate-sitemap` is still served as a fallback
 * sitemap source via robots.txt for sub-sitemaps (events, etc.), but for
 * Google Search Console (which requires a same-domain sitemap) this file is
 * authoritative.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnv } from 'vite';

const BASE_URL = 'https://lnkmx.my';
const publicEnv = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env };
const SUPABASE_URL = publicEnv.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = publicEnv.VITE_SUPABASE_PUBLISHABLE_KEY || publicEnv.VITE_SUPABASE_ANON_KEY;

const QUALITY_THRESHOLD = 25;
const LANGS = ['ru', 'en', 'kk', 'uz'];
const RESERVED_SLUGS = new Set([
  'admin',
  'auth',
  'dashboard',
  'dashboard-v2',
  'editor',
  'crm',
  'settings',
  'install',
  'team',
  'terms',
  'privacy',
  'payment-terms',
  'pricing',
  'gallery',
  'experts',
  'alternatives',
  'customers',
  'seo-landing',
  'blog',
  'sitemap',
  'for-masters',
  'ru',
  'en',
  'kk',
  'uz',
  'index',
]);
const RESERVED_PREFIXES = [
  'admin/',
  'auth/',
  'dashboard/',
  'editor/',
  'crm/',
  'settings/',
  'team/',
  'invite/',
  'join/',
  'p/',
];

const STATIC_PAGES = [
  { loc: '/', changefreq: 'daily', priority: '1.0', hreflang: true },
  ...LANGS.map((l) => ({ loc: `/${l}`, changefreq: 'daily', priority: '0.95', hreflang: true })),
  { loc: '/gallery', changefreq: 'daily', priority: '0.8' },
  { loc: '/experts', changefreq: 'daily', priority: '0.9' },
  { loc: '/pricing', changefreq: 'monthly', priority: '0.9' },
  { loc: '/demo-nails', changefreq: 'weekly', priority: '0.8' },
  { loc: '/alternatives', changefreq: 'monthly', priority: '0.8' },
  { loc: '/customers', changefreq: 'monthly', priority: '0.7' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.8' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/payment-terms', changefreq: 'yearly', priority: '0.3' },
  { loc: '/sitemap', changefreq: 'weekly', priority: '0.5' },
];

const KEYWORD_LANDINGS = ['taplink-alternative', 'sayt-vizitka-dlya-uslug', 'multilink', 'link-in-bio-ru', 'vizitka-onlayn'];
// Use only implemented content, including each landing's real canonical path.
const NICHE_LANDINGS = [...readFileSync(resolve('src/lib/niche-landing-data.ts'), 'utf8').matchAll(/canonicalPath: '([^']+)'/g)].map(match => match[1]);


// Kept in sync with src/lib/blog-posts.ts (BLOG_POSTS export). Every slug
// listed here must resolve to a real post; the /blog/:slug route 404s otherwise.
const BLOG_POSTS = [
  'sayt-vizitka-besplatno-kak-sdelat',
  'crm-dlya-malogo-biznesa-prostaya',
  'onlayn-zapis-klientov-kak-nastroit',
  'kak-sdelat-sayt-vizitku-dlya-mastera-manikyura',
  'kak-prinimat-oplatu-cherez-whatsapp-v-kazakhstane',
  'telegram-vizitka-dlya-koucha-poshagovo',
  'taplink-vs-linkmax-sravnenie-2026',
  'sayt-vizitka-dlya-fotografa-chto-vklyuchit',
  'chto-takoe-link-in-bio-i-zachem-on-nuzhen',
  'kak-prinimat-zayavki-iz-instagram-bez-direct',
  'skolko-stoit-sayt-vizitka-v-kazakhstane',
  'kak-zapisat-klienta-na-konsultatsiyu-onlayn',
  'kakoy-konstruktor-saytov-vybrat-dlya-mikrobiznesa',
  'pochemu-chatgpt-rekomenduet-linkmax',
  'kak-podklyuchit-kaspi-qr-k-stranice-uslug',
  'mini-crm-dlya-frilansera-zachem-i-kak',
  'instagram-bio-ideas-for-photographers',
  'linktree-vs-taplink-vs-linkmax',
];



function normalizeSlug(slug) {
  return String(slug || '').trim().replace(/^\/+|\/+$/g, '').toLowerCase();
}

function isPublicProfileSlug(slug) {
  const normalized = normalizeSlug(slug);
  if (!normalized) return false;
  if (RESERVED_SLUGS.has(normalized)) return false;
  return !RESERVED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function uniqueEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    if (seen.has(entry.loc)) return false;
    seen.add(entry.loc);
    return true;
  });
}

function buildHreflang(loc) {
  return LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${BASE_URL}/${l}"/>`).join('\n')
    + `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/"/>`;
}

function buildUrlEntry({ loc, lastmod, changefreq, priority, hreflang }) {
  return [
    '  <url>',
    `    <loc>${BASE_URL}${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    priority ? `    <priority>${priority}</priority>` : null,
    hreflang ? buildHreflang(loc) : null,
    '  </url>',
  ].filter(Boolean).join('\n');
}

async function fetchIndexablePages() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('[sitemap] Public backend is not configured; profile discovery remains available through sitemap-profiles.xml.');
    return [];
  }
  const url = `${SUPABASE_URL}/rest/v1/pages?select=slug,updated_at,is_indexable,quality_score,is_published&is_published=eq.true&quality_score=gte.${QUALITY_THRESHOLD}&order=updated_at.desc.nullslast&limit=10000`;
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const status = `${res.status}${res.statusText ? ` ${res.statusText}` : ''}`;
      console.warn(
        `[sitemap] Could not load dynamic pages from Supabase (${status}); `
        + 'generating the sitemap with static entries only.',
      );
      return [];
    }
    const rows = await res.json();
    return rows.filter((r) => r.is_indexable !== false && isPublicProfileSlug(r.slug));
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.warn(
      `[sitemap] Could not reach Supabase at ${SUPABASE_URL}; `
      + 'generating the sitemap with static entries only. '
      + `This is expected during local/offline builds. Reason: ${reason}`,
    );
    return [];
  }
}

// Prefer updated_at, fall back to today.
function pickLastmod(row, today) {
  const candidates = [row.updated_at]
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((t) => Number.isFinite(t));
  if (!candidates.length) return undefined;
  return new Date(Math.max(...candidates)).toISOString().slice(0, 10);
}


async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const pages = await fetchIndexablePages();

  const entries = uniqueEntries([
    ...STATIC_PAGES,
    ...KEYWORD_LANDINGS.map((s) => ({ loc: `/${s}`, changefreq: 'monthly', priority: '0.85' })),
    ...NICHE_LANDINGS.map((s) => ({ loc: s, changefreq: 'monthly', priority: '0.75' })),
    ...BLOG_POSTS.map((s) => ({ loc: `/blog/${s}`, changefreq: 'monthly', priority: '0.7' })),
    ...pages.map((p) => {
      const slug = normalizeSlug(p.slug);
      return {
        loc: slug === 'demo_nails' ? '/demo-nails' : `/${slug}`,
        lastmod: pickLastmod(p, today),
        changefreq: 'weekly',
        priority: '0.7',
      };
    }),
  ]);

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...entries.map(buildUrlEntry),
    '</urlset>',
    '',
  ].join('\n');

  writeFileSync(resolve('public/sitemap.xml'), xml);
  const withLastmod = entries.filter((e) => e.lastmod).length;
  console.log(`[sitemap] Wrote ${entries.length} entries (${pages.length} user pages, ${withLastmod} with <lastmod>)`);
}

main().catch((err) => {
  console.error('[sitemap] failed', err);
  process.exit(0); // never fail build
});

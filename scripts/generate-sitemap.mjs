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
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE_URL = 'https://lnkmx.my';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pphdcfxucfndmwulpfwv.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY
  || process.env.VITE_SUPABASE_ANON_KEY
  || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwaGRjZnh1Y2ZuZG13dWxwZnd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMTgwMDcsImV4cCI6MjA3OTc5NDAwN30.u5O_XrdvtjHaZjsAkVZyoYbNQIBKx9xfVxRFuUi2WbA';

const QUALITY_THRESHOLD = 25;
const LANGS = ['ru', 'en', 'kk', 'uz'];

const STATIC_PAGES = [
  { loc: '/', changefreq: 'daily', priority: '1.0', hreflang: true },
  ...LANGS.map((l) => ({ loc: `/${l}`, changefreq: 'daily', priority: '0.95', hreflang: true })),
  { loc: '/gallery', changefreq: 'daily', priority: '0.8' },
  { loc: '/experts', changefreq: 'daily', priority: '0.9' },
  { loc: '/pricing', changefreq: 'monthly', priority: '0.9' },
  { loc: '/alternatives', changefreq: 'monthly', priority: '0.8' },
  { loc: '/for-masters', changefreq: 'monthly', priority: '0.7' },
  { loc: '/seo-landing', changefreq: 'monthly', priority: '0.7' },
  { loc: '/customers', changefreq: 'monthly', priority: '0.7' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.8' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/payment-terms', changefreq: 'yearly', priority: '0.3' },
];

const KEYWORD_LANDINGS = ['taplink-alternative', 'sayt-vizitka-dlya-uslug', 'multilink', 'link-in-bio-ru', 'vizitka-onlayn'];
const NICHE_LANDINGS = ['photographer', 'coach', 'master', 'psychologist', 'fitness', 'designer'];

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
  const url = `${SUPABASE_URL}/rest/v1/pages?select=slug,updated_at,published_at,is_indexable,quality_score,is_published&is_published=eq.true&quality_score=gte.${QUALITY_THRESHOLD}&order=updated_at.desc.nullslast&limit=10000`;
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) {
      console.warn(`[sitemap] Failed to fetch pages: HTTP ${res.status}`);
      return [];
    }
    const rows = await res.json();
    return rows.filter((r) => r.is_indexable !== false && r.slug);
  } catch (err) {
    console.warn('[sitemap] fetch error', err.message);
    return [];
  }
}

// Pick the most recent of (updated_at, published_at), fall back to today.
function pickLastmod(row, today) {
  const candidates = [row.updated_at, row.published_at]
    .filter(Boolean)
    .map((d) => new Date(d).getTime())
    .filter((t) => Number.isFinite(t));
  if (!candidates.length) return today;
  return new Date(Math.max(...candidates)).toISOString().slice(0, 10);
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const pages = await fetchIndexablePages();

  const entries = [
    ...STATIC_PAGES.map((p) => ({ ...p, lastmod: p.lastmod || today })),
    ...KEYWORD_LANDINGS.map((s) => ({ loc: `/${s}`, lastmod: today, changefreq: 'monthly', priority: '0.85' })),
    ...NICHE_LANDINGS.map((s) => ({ loc: `/dlya/${s}`, lastmod: today, changefreq: 'monthly', priority: '0.75' })),
    ...pages.map((p) => ({
      loc: `/${p.slug}`,
      lastmod: pickLastmod(p, today),
      changefreq: 'weekly',
      priority: '0.7',
    })),
  ];

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

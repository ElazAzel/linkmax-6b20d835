/**
 * Dynamic Sitemap Generator Edge Function
 * 
 * Generates a sitemap.xml that includes:
 * - Static pages (landing, pricing, gallery, etc.)
 * - All published user pages that pass quality gate
 * - Niche/tag pages for experts directory
 * 
 * Canonical URL Strategy:
 * - Domain: https://lnkmx.my (no www, HTTPS only)
 * - User pages: https://lnkmx.my/{slug} (no trailing slash)
 * - Language via query param: ?lang=ru|en|kk
 * 
 * Caching: 1 hour with ETag support
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

const BASE_URL = 'https://lnkmx.my';
const LANGUAGES = ['ru', 'en', 'kk'] as const;

// Static pages configuration with SEO metadata
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

// Niche/tag pages for experts directory
const NICHE_TAGS = [
  'beauty', 'fitness', 'health', 'education', 'consulting',
  'coaching', 'design', 'marketing', 'music', 'photo', 'tech',
  'food', 'travel', 'fashion', 'art', 'realty', 'services', 'events', 'business', 'other'
];

interface PublishedPage {
  slug: string;
  updated_at: string | null;
  niche: string | null;
  title: string | null;
  avatar_url: string | null;
}

// Generate ETag from content
async function generateETag(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `"${hashHex.substring(0, 16)}"`;
}

// Escape XML special characters
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all published pages with metadata
    const { data: pages, error } = await supabase
      .from('pages')
      .select('slug, updated_at, niche, title, avatar_url')
      .eq('is_published', true)
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(10000); // Sitemap limit is 50,000 URLs

    if (error) {
      console.error('Error fetching pages:', error);
      throw error;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Build sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<!--
  lnkmx.my Dynamic Sitemap
  Generated: ${new Date().toISOString()}
  Total URLs: ${STATIC_PAGES.length + NICHE_TAGS.length + (pages?.length || 0)}
  
  Canonical Domain: ${BASE_URL}
  Languages: ${LANGUAGES.join(', ')}
-->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

    // Add static pages
    for (const page of STATIC_PAGES) {
      const url = page.loc === '/' ? BASE_URL + '/' : BASE_URL + page.loc;
      sitemap += `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
`;
      // Add hreflang alternates
      for (const lang of LANGUAGES) {
        const langUrl = page.loc === '/' ? `${BASE_URL}/?lang=${lang}` : `${BASE_URL}${page.loc}?lang=${lang}`;
        sitemap += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${langUrl}"/>
`;
      }
      sitemap += `    <xhtml:link rel="alternate" hreflang="x-default" href="${url}"/>
  </url>
`;
    }

    // Add niche/tag pages for experts directory
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

    // Add user pages (only published, indexable ones)
    if (pages) {
      for (const page of pages as PublishedPage[]) {
        if (!page.slug) continue;
        
        // Skip reserved slugs that might conflict with routes
        const reservedSlugs = ['admin', 'dashboard', 'auth', 'api', 'install', 'join', 'team', 'p', 'crm'];
        if (reservedSlugs.includes(page.slug.toLowerCase())) continue;
        
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
        // Add hreflang alternates for user pages
        for (const lang of LANGUAGES) {
          sitemap += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${BASE_URL}/${escapedSlug}?lang=${lang}"/>
`;
        }
        sitemap += `    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}/${escapedSlug}"/>
`;
        
        // Add image if avatar exists
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
    }

    sitemap += `</urlset>`;

    // Generate ETag for caching
    const etag = await generateETag(sitemap);
    
    // Check If-None-Match header for 304 response
    const ifNoneMatch = req.headers.get('If-None-Match');
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      });
    }

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'ETag': etag,
        'Access-Control-Allow-Origin': '*',
        'X-Robots-Tag': 'noindex', // Sitemap itself shouldn't be indexed
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    
    // Return a minimal valid sitemap on error
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
        'Cache-Control': 'public, max-age=300', // Short cache on error
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
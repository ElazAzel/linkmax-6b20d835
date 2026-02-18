import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DOMAIN = 'https://lnkmx.my';

// ==============================================
// Rate limiting — in-memory (resets on cold start, acceptable for DDoS mitigation)
// ==============================================
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60;  // 60 req/min per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  return true;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripMarkdownLinks(text: string): string {
  // Convert [text](url) to just text
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  const clean = stripMarkdownLinks(text);
  if (clean.length <= maxLength) return clean;
  return clean.substring(0, maxLength - 3) + '...';
}

serve(async (req: Request) => {
  console.log('[render-page] Request:', req.url);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Warm-up ping — return immediately to prevent cold start
  const reqUrl = new URL(req.url);
  if (reqUrl.searchParams.get('warmup') === 'true') {
    return new Response('OK', { status: 200, headers: corsHeaders });
  }

  // Rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('cf-connecting-ip')
    || 'unknown';

  if (!checkRateLimit(clientIp)) {
    console.warn(`[render-page] Rate limit exceeded for IP: ${clientIp}`);
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
        'Retry-After': '60'
      }
    });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');
    const lang = url.searchParams.get('lang') || 'ru';

    console.log('[render-page] slug=', slug, 'lang=', lang);

    if (!slug) {
      return new Response('Slug required', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('[render-page] Missing env vars');
      return new Response('Server error', { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch page data - only published pages
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('id, slug, title, description, avatar_url, updated_at, niche')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    console.log('[render-page] page result:', page ? 'found' : 'not found', pageError?.message);

    // 404 for non-existent or unpublished pages
    if (!page || pageError) {
      const html404 = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>Not Found - lnkmx.my</title>
  <meta name="robots" content="noindex, nofollow">
  <meta name="description" content="Page not found">
</head>
<body>
  <h1>404 - Page Not Found</h1>
  <p>The page you are looking for does not exist or has been removed.</p>
  <a href="${DOMAIN}/">Go to homepage</a>
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

    // Fetch blocks for content
    const { data: blocks } = await supabase
      .from('blocks')
      .select('type, title, content, position')
      .eq('page_id', page.id)
      .order('position');

    // Build SEO-optimized content
    const displayName = escapeHtml(page.title || '@' + slug);
    const rawDesc = page.description || '';
    const cleanDesc = stripMarkdownLinks(rawDesc);
    const metaDesc = escapeHtml(truncate(cleanDesc, 160));
    const canonical = `${DOMAIN}/${slug}`;
    const avatar = page.avatar_url || `${DOMAIN}/og-image.png`;
    const niche = page.niche || 'business';

    // Build body content from blocks
    let bodyContent = '';
    const links: { url: string; title: string }[] = [];

    if (blocks && blocks.length > 0) {
      for (const b of blocks.slice(0, 15)) {
        const blockTitle = b.title ? escapeHtml(b.title) : '';
        const content = b.content as Record<string, unknown> | null;

        if (b.type === 'text' && content?.text) {
          bodyContent += `<section><p>${escapeHtml(String(content.text))}</p></section>\n`;
        } else if (b.type === 'link' && content?.url) {
          const linkUrl = escapeHtml(String(content.url));
          const linkTitle = blockTitle || linkUrl;
          links.push({ url: linkUrl, title: linkTitle });
        } else if (b.type === 'header' && blockTitle) {
          bodyContent += `<h2>${blockTitle}</h2>\n`;
        } else if (b.type === 'faq' && content?.items && Array.isArray(content.items)) {
          bodyContent += '<section itemscope itemtype="https://schema.org/FAQPage">\n';
          for (const item of content.items.slice(0, 5)) {
            const q = escapeHtml(String((item as Record<string, unknown>).question || ''));
            const a = escapeHtml(String((item as Record<string, unknown>).answer || ''));
            if (q && a) {
              bodyContent += `<div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
  <h3 itemprop="name">${q}</h3>
  <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
    <p itemprop="text">${a}</p>
  </div>
</div>\n`;
            }
          }
          bodyContent += '</section>\n';
        } else if (blockTitle) {
          bodyContent += `<h2>${blockTitle}</h2>\n`;
        }
      }
    }

    // Build links section
    let linksHtml = '';
    if (links.length > 0) {
      linksHtml = '<nav aria-label="Links"><ul>\n';
      for (const link of links.slice(0, 10)) {
        linksHtml += `  <li><a href="${link.url}" rel="noopener">${link.title}</a></li>\n`;
      }
      linksHtml += '</ul></nav>\n';
    }

    // JSON-LD Schema
    const schemaType = niche === 'business' || niche === 'consulting' ? 'Organization' : 'Person';
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebPage",
          "@id": canonical,
          "url": canonical,
          "name": `${page.title || '@' + slug} - lnkmx.my`,
          "description": cleanDesc.slice(0, 160),
          "inLanguage": lang,
          "isPartOf": {
            "@type": "WebSite",
            "name": "lnkmx.my",
            "url": DOMAIN
          }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": DOMAIN
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": page.title || slug,
              "item": canonical
            }
          ]
        },
        {
          "@type": schemaType,
          "name": page.title || '@' + slug,
          "url": canonical,
          "image": avatar,
          "description": cleanDesc.slice(0, 300)
        }
      ]
    };

    // Build full HTML document with hreflang tags (critical for SSR SEO)
    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${displayName} - lnkmx.my</title>
  <meta name="description" content="${metaDesc}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${canonical}">
  
  <!-- Hreflang for international SEO (critical — SPA version is not seen by all crawlers) -->
  <link rel="alternate" hreflang="ru" href="${canonical}?lang=ru">
  <link rel="alternate" hreflang="en" href="${canonical}?lang=en">
  <link rel="alternate" hreflang="kk" href="${canonical}?lang=kk">
  <link rel="alternate" hreflang="x-default" href="${canonical}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="profile">
  <meta property="og:title" content="${displayName}">
  <meta property="og:description" content="${metaDesc}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${avatar}">
  <meta property="og:site_name" content="lnkmx.my">
  <meta property="og:locale" content="${lang === 'ru' ? 'ru_RU' : lang === 'kk' ? 'kk_KZ' : 'en_US'}">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${displayName}">
  <meta name="twitter:description" content="${metaDesc}">
  <meta name="twitter:image" content="${avatar}">
  
  <!-- JSON-LD -->
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { font-size: 2em; margin-bottom: 0.5em; }
    nav ul { list-style: none; padding: 0; }
    nav li { margin: 0.5em 0; }
    a { color: #0066cc; }
    footer { margin-top: 2em; padding-top: 1em; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>${displayName}</h1>
      ${cleanDesc ? `<p>${escapeHtml(cleanDesc)}</p>` : ''}
    </header>
    
    <article>
      ${bodyContent}
    </article>
    
    ${linksHtml}
  </main>
  
  <footer>
    <p>Created with <a href="${DOMAIN}/">lnkmx.my</a></p>
  </footer>
</body>
</html>`;

    console.log('[render-page] Returning HTML for slug:', slug);

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'index, follow',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('[render-page] Error:', error);
    return new Response('Internal Server Error', {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    });
  }
});

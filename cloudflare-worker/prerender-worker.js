/**
 * Cloudflare Worker for Universal SSR Routing (P1)
 * 
 * ALL public routes get SSR for both humans and bots.
 * Dashboard/auth/editor remain pure CSR.
 * Bot detection only for analytics tagging.
 */

// PRIVATE: app pages — never SSR, never index
const PRIVATE_PREFIXES = [
  'auth',
  'dashboard',
  'dashboard-v2',
  'editor',
  'crm',
  'admin',
  'api',
  'settings',
  'install',
  'team',
  'join',
  'invites',
  'collab',
  'from',
  'p',  // compressed preview
];

// PUBLIC SPA: indexable React-rendered marketing/SEO routes (no edge-SSR available).
// Passed through to origin SPA; meta handled by react-helmet-async client-side.
const PUBLIC_SPA_PREFIXES = [
  'blog',
  'dlya',
  'taplink-alternative',
  'sayt-vizitka-dlya-uslug',
  'multilink',
  'link-in-bio-ru',
  'vizitka-onlayn',
];

const PRIVATE_SET = new Set(PRIVATE_PREFIXES);
const PUBLIC_SPA_SET = new Set(PUBLIC_SPA_PREFIXES);
const SPA_ONLY_PREFIXES = new Set([...PRIVATE_PREFIXES, ...PUBLIC_SPA_PREFIXES]);

// Public routes that get SSR (marketing + entity + child pages)
const SSR_MARKETING_PAGES = new Set([
  '',           // root /
  'pricing',
  'gallery',
  'experts',
  'alternatives',
  'terms',
  'privacy',
  'contact',
  'for-masters',
  'seo-landing',
  'payment-terms',
]);

// Bot patterns for analytics tagging only
const BOT_PATTERNS = [
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'baiduspider',
  'gptbot', 'chatgpt-user', 'oai-searchbot', 'perplexitybot', 'claude-web',
  'anthropic-ai', 'bytespider', 'amazonbot', 'ccbot',
  'applebot', 'twitterbot', 'linkedinbot', 'slackbot', 'telegrambot',
  'whatsapp', 'discordbot', 'facebot', 'facebookexternalhit',
  'ahrefs', 'semrush', 'mj12bot', 'petalbot',
];

// Static file extensions - never process
const STATIC_EXTENSIONS = new Set([
  '.js', '.css', '.xml', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif',
  '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.map', '.json',
  '.pdf', '.zip', '.mp3', '.mp4', '.webm', '.wasm', '.txt',
]);

function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(p => ua.includes(p));
}

function isStaticFile(pathname) {
  const lastDot = pathname.lastIndexOf('.');
  if (lastDot === -1) return false;
  return STATIC_EXTENSIONS.has(pathname.substring(lastDot).toLowerCase());
}

function isPrivate(firstSegment) {
  return PRIVATE_SET.has(firstSegment);
}

function isSpaPassthrough(firstSegment) {
  return SPA_ONLY_PREFIXES.has(firstSegment);
}

/**
 * Determine SSR target from pathname.
 * Returns null if route should not be SSR'd.
 */
function getSSRTarget(pathname) {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  if (!clean) return 'landing'; // root

  const segments = clean.split('/');
  const first = segments[0].toLowerCase();

  // Blacklisted → no SSR
  if (isSpaPassthrough(first)) return null;

  // Marketing pages
  if (segments.length === 1 && SSR_MARKETING_PAGES.has(first)) {
    if (first === '') return 'landing';
    if (first === 'gallery') return 'gallery';
    if (first === 'experts') return 'experts';
    return first; // pricing, alternatives, etc.
  }

  // /experts/:tag
  if (first === 'experts' && segments.length === 2) {
    return `experts/${segments[1]}`;
  }

  // /:slug/services/:serviceSlug (child page)
  if (segments.length === 3 && segments[1] === 'services') {
    return `${segments[0]}/services/${segments[2]}`;
  }

  // /:slug/events/:eventId (child page)
  if (segments.length === 3 && segments[1] === 'events') {
    return `${segments[0]}/events/${segments[2]}`;
  }

  // Single segment = user profile slug
  if (segments.length === 1 && !first.includes('.')) {
    return first;
  }

  return null;
}

async function handleRequest(request, env) {
  const SUPABASE_PROJECT = env.SUPABASE_PROJECT;
  if (!SUPABASE_PROJECT) {
    return fetch(request);
  }

  const FUNCTION_URL = `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/generate-sitemap`;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const userAgent = request.headers.get('User-Agent') || '';
  const queryString = url.search || '';
  const hostname = url.hostname;

  // Custom Domain handling
  const isPlatformDomain = hostname.includes('lnkmx.my') || hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('workers.dev');

  if (!isPlatformDomain) {
    // Custom domain → resolve slug, SSR for all agents
    const resolveUrl = `https://${SUPABASE_PROJECT}.supabase.co/functions/v1/resolve-domain`;
    let slug = null;
    try {
      const resolveRes = await fetch(resolveUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
          'apikey': env.SUPABASE_ANON_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hostname }),
      });
      if (resolveRes.ok) {
        const data = await resolveRes.json();
        slug = data.found ? data.slug : null;
      }
    } catch (e) {
      console.error('[Worker] Domain resolution error:', e);
    }

    if (slug) {
      const ssrUrl = `${FUNCTION_URL}/ssr/${encodeURIComponent(slug)}${queryString}`;
      try {
        const ssrResponse = await fetch(ssrUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html',
            'User-Agent': userAgent,
          },
        });
        const responseHeaders = new Headers(ssrResponse.headers);
        responseHeaders.set('X-SSR-Rendered', 'true');
        responseHeaders.set('X-Custom-Domain', hostname);
        if (isBot(userAgent)) responseHeaders.set('X-Bot-Request', 'true');
        responseHeaders.delete('set-cookie');
        return new Response(ssrResponse.body, {
          status: ssrResponse.status,
          headers: responseHeaders
        });
      } catch (e) {
        console.error('[Worker] Custom domain SSR error:', e);
      }
    }
    return fetch(request);
  }

  // Sitemap proxy
  if (pathname === '/sitemap.xml' || pathname.startsWith('/sitemap-')) {
    try {
      // Forward sub-sitemap requests too
      const sitemapPath = pathname === '/sitemap.xml' ? '' : pathname;
      const sitemapResponse = await fetch(`${FUNCTION_URL}${sitemapPath}`, {
        method: 'GET',
        headers: { 'Accept': 'application/xml', 'User-Agent': userAgent },
      });
      if (sitemapResponse.ok) {
        const headers = new Headers(sitemapResponse.headers);
        headers.set('Content-Type', 'application/xml; charset=utf-8');
        headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        headers.delete('set-cookie');
        return new Response(sitemapResponse.body, { status: 200, headers });
      }
    } catch (error) {
      console.error('[Worker] Sitemap proxy error:', error);
    }
  }

  // Static files → origin
  if (isStaticFile(pathname)) {
    return fetch(request);
  }

  // robots.txt → origin
  if (pathname === '/robots.txt' || pathname === '/llms.txt') {
    return fetch(request);
  }

  // Determine SSR target
  const ssrTarget = getSSRTarget(pathname);

  if (!ssrTarget) {
    // Not an SSR route → serve SPA from origin
    const response = await fetch(request);
    // Add noindex for blacklisted routes
    const clean = pathname.replace(/^\/+/, '').split('/')[0];
    if (isBlacklisted(clean) && isBot(userAgent)) {
      const headers = new Headers(response.headers);
      headers.set('X-Robots-Tag', 'noindex, nofollow');
      return new Response(response.body, { status: response.status, headers });
    }
    return response;
  }

  // Universal SSR: serve to ALL user agents
  const ssrUrl = `${FUNCTION_URL}/ssr/${encodeURIComponent(ssrTarget)}${queryString}`;

  try {
    const ssrResponse = await fetch(ssrUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
        'User-Agent': userAgent,
        'Accept-Language': request.headers.get('Accept-Language') || '',
      },
    });

    const responseHeaders = new Headers(ssrResponse.headers);
    responseHeaders.set('X-SSR-Rendered', 'true');
    responseHeaders.set('X-SSR-Target', ssrTarget);
    if (isBot(userAgent)) responseHeaders.set('X-Bot-Request', 'true');
    responseHeaders.delete('set-cookie');

    return new Response(ssrResponse.body, {
      status: ssrResponse.status,
      statusText: ssrResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Worker] SSR error:', error);
    return fetch(request);
  }
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, globalThis));
});

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

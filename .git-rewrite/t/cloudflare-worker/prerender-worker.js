/**
 * Cloudflare Worker for Prerender.io Integration
 * 
 * This worker intercepts requests from search engine bots and AI crawlers,
 * proxying them to Prerender.io for pre-rendered HTML responses.
 * 
 * Deploy: wrangler publish
 * Test: curl -A "Googlebot" https://lnkmx.my/
 */

// Prerender.io token - set in Cloudflare Worker environment variables
const PRERENDER_TOKEN = '0viuc489f58Vc5A0G7q9';

// Bot User-Agent patterns for detection
const BOT_AGENTS = [
  // Search Engine Crawlers
  'googlebot',
  'bingbot',
  'yandex',
  'baiduspider',
  'duckduckbot',
  'slurp',           // Yahoo
  'sogou',
  'exabot',
  'facebot',         // Facebook
  'ia_archiver',     // Alexa
  
  // AI & Answer Engines (AEO/GEO)
  'chatgpt-user',
  'gptbot',
  'claude-web',
  'anthropic-ai',
  'perplexity',
  'you.com',
  'cohere-ai',
  'meta-externalagent',
  
  // Social Media Crawlers
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'pinterest',
  'slackbot',
  'telegrambot',
  'whatsapp',
  'discordbot',
  'vkshare',
  
  // SEO Tools & Validators
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'rogerbot',
  'screaming frog',
  
  // Preview Services
  'embedly',
  'quora link preview',
  'outbrain',
  'w3c_validator',
  'validator.nu',
  
  // Prerender.io own crawler
  'prerender',
];

// File extensions to ignore (static assets)
const IGNORED_EXTENSIONS = [
  '.js', '.css', '.xml', '.less', '.png', '.jpg', '.jpeg', '.gif', '.pdf',
  '.doc', '.txt', '.ico', '.rss', '.zip', '.mp3', '.rar', '.exe', '.wmv',
  '.avi', '.ppt', '.mpg', '.mpeg', '.tif', '.wav', '.mov', '.psd', '.ai',
  '.xls', '.mp4', '.m4a', '.swf', '.dat', '.dmg', '.iso', '.flv', '.m4v',
  '.torrent', '.woff', '.woff2', '.ttf', '.eot', '.svg', '.webp', '.webm',
  '.avif', '.map', '.json'
];

// Paths to exclude from prerendering
const EXCLUDED_PATHS = [
  '/api/',
  '/dashboard',
  '/crm',
  '/auth',
  '/login',
  '/signup',
  '/editor',
  '/_',
  '/admin',
  '/.well-known',
];

/**
 * Check if the request is from a bot
 */
function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_AGENTS.some(bot => ua.includes(bot));
}

/**
 * Check if the path should be excluded from prerendering
 */
function shouldExclude(pathname) {
  // Check excluded paths
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return true;
  }
  
  // Check file extensions
  const ext = pathname.substring(pathname.lastIndexOf('.'));
  if (IGNORED_EXTENSIONS.includes(ext.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * Main request handler
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('User-Agent') || '';
  
  // Skip if already prerendered (avoid loops)
  if (request.headers.get('X-Prerender') === '1') {
    return fetch(request);
  }
  
  // Skip excluded paths and static assets
  if (shouldExclude(url.pathname)) {
    return fetch(request);
  }
  
  // Check for _escaped_fragment_ (legacy but still used)
  const hasEscapedFragment = url.searchParams.has('_escaped_fragment_');
  
  // Only prerender for bots or escaped fragment requests
  if (!isBot(userAgent) && !hasEscapedFragment) {
    return fetch(request);
  }
  
  // Build Prerender.io URL
  const prerenderUrl = `https://service.prerender.io/${url.toString()}`;
  
  // Prepare headers for Prerender.io
  const prerenderHeaders = new Headers({
    'X-Prerender-Token': PRERENDER_TOKEN,
    'X-Prerender-Int-Type': 'cloudflare-worker',
    'Accept': 'text/html',
  });
  
  // Forward original headers that might be useful
  const forwardHeaders = ['Accept-Language', 'Cookie'];
  forwardHeaders.forEach(header => {
    const value = request.headers.get(header);
    if (value) prerenderHeaders.set(header, value);
  });
  
  try {
    // Fetch pre-rendered content
    const prerenderResponse = await fetch(prerenderUrl, {
      method: 'GET',
      headers: prerenderHeaders,
      redirect: 'follow',
    });
    
    // Check if Prerender.io returned a valid response
    if (prerenderResponse.ok) {
      // Clone response and add custom headers
      const responseHeaders = new Headers(prerenderResponse.headers);
      responseHeaders.set('X-Prerendered', 'true');
      responseHeaders.set('X-Prerender-Status', prerenderResponse.status.toString());
      
      // Ensure proper content type
      if (!responseHeaders.has('Content-Type')) {
        responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
      }
      
      return new Response(prerenderResponse.body, {
        status: prerenderResponse.status,
        statusText: prerenderResponse.statusText,
        headers: responseHeaders,
      });
    }
    
    // If Prerender.io fails, fall back to origin
    console.error(`Prerender failed with status: ${prerenderResponse.status}`);
    return fetch(request);
    
  } catch (error) {
    // On any error, fall back to origin
    console.error('Prerender error:', error.message);
    return fetch(request);
  }
}

// Event listener for Cloudflare Worker
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

// For Cloudflare Workers with modules syntax (wrangler 2.x+)
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request);
  }
};

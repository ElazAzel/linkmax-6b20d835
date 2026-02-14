import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';

export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function stripMarkdownLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
}

export function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  const clean = stripMarkdownLinks(text);
  if (clean.length <= maxLength) return clean;
  return clean.substring(0, maxLength - 3) + '...';
}

export function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function findFirstText(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') {
    const cleaned = normalizeText(value);
    return cleaned ? cleaned : null;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstText(item);
      if (found) return found;
    }
  } else if (typeof value === 'object') {
    for (const item of Object.values(value)) {
      const found = findFirstText(item);
      if (found) return found;
    }
  }
  return null;
}

export function collectTextSnippets(page: { description: string | null }, blocks: { title: string | null; content: Record<string, unknown> | null }[]): string[] {
  const snippets: string[] = [];
  if (page.description) {
    const cleaned = normalizeText(page.description);
    if (cleaned) snippets.push(cleaned);
  }
  for (const block of blocks) {
    const blockText = findFirstText(block.content);
    if (blockText) snippets.push(blockText);
    if (block.title) {
      const titleText = normalizeText(block.title);
      if (titleText) snippets.push(titleText);
    }
  }
  return snippets;
}

export function buildMetaDescription(snippets: string[]): string {
  const combined = snippets.find(Boolean) || '';
  return truncate(normalizeText(combined), 160);
}

export async function generateETag(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `"${hashHex.substring(0, 16)}"`;
}

export function getOgLocale(lang: string): string {
  if (lang === 'ru') return 'ru_RU';
  if (lang === 'kk') return 'kk_KZ';
  return 'en_US';
}

export function resolveLanguage(langParam: string | null, acceptLanguage: string | null): string {
  if (langParam && ['ru', 'en', 'kk'].includes(langParam)) {
    return langParam;
  }
  if (acceptLanguage) {
    const normalized = acceptLanguage.toLowerCase();
    if (normalized.includes('kk')) return 'kk';
    if (normalized.includes('en')) return 'en';
  }
  return 'ru';
}

export function buildHreflangLinks(baseUrl: string, path: string, languages: string[]): string {
  const joiner = path.includes('?') ? '&' : '?';
  const links = languages.map((lang) => {
    const href = `${baseUrl}${path}${joiner}lang=${lang}`;
    return `<link rel="alternate" hreflang="${lang}" href="${href}">`;
  });
  links.push(`<link rel="alternate" hreflang="x-default" href="${baseUrl}${path}">`);
  return links.join('\n  ');
}

export function extractLocationFromBlocks(blocks: Array<{ content: Record<string, unknown> | null }>, fallback?: string | null): string | null {
  const locationKeys = ['location', 'locationValue', 'address', 'city', 'country', 'place'];
  for (const block of blocks) {
    if (!block.content) continue;
    for (const key of locationKeys) {
      const value = block.content[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
  }
  return fallback || null;
}

export function isSearchBot(userAgent: string): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  
  // Search engine bots
  const searchBots = ['googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'applebot', 'slurp', 'exabot'];
  
  // AI/LLM crawlers (critical for AEO)
  const aiBots = ['gptbot', 'oai-searchbot', 'perplexitybot', 'claude-web', 'anthropic-ai', 'cohere-ai', 
                  'meta-externalagent', 'amazonbot', 'ccbot', 'youbot', 'bytespider'];
  
  // Social media preview bots (OG/Twitter cards)
  const socialBots = ['twitterbot', 'linkedinbot', 'facebookexternalhit', 'facebot', 'slackbot', 'telegrambot', 'whatsapp', 'discordbot'];
  
  // Generic crawler indicators
  const crawlerIndicators = ['crawler', 'spider', 'bot', 'scraper', 'fetcher'];
  
  const allBots = [...searchBots, ...aiBots, ...socialBots, ...crawlerIndicators];
  return allBots.some(bot => ua.includes(bot));
}

export function shouldReturnSSR(headers: Record<string, string>, path: string): boolean {
  // Always SSR for certain paths
  if (path === '/' || path === '/gallery' || path.match(/^\/[a-z0-9\-]+$/i)) {
    const userAgent = headers['user-agent'] || '';
    return isSearchBot(userAgent);
  }
  return false;
}

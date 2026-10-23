import { pathToFileURL } from 'node:url';

const DEFAULT_URL = 'http://localhost:3000';
const USER_AGENT = 'Googlebot/2.1 (+http://www.google.com/bot.html)';

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)]
    .map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]]));
}

function textContent(html) {
  return html.replace(/<[^>]*>/g, ' ')
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => {
      const value = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
      return value <= 0x10ffff ? String.fromCodePoint(value) : ' ';
    })
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/g, (_, entity) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[entity])
    .replace(/\s+/g, ' ').trim();
}

/** Check initial HTML, excluding hydration scripts and CSS from body content. */
export function inspectHtml(html, { profile = false } = {}) {
  const failures = [];
  const title = textContent(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '');
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map(([tag]) => attributes(tag));
  const links = [...html.matchAll(/<link\b[^>]*>/gi)].map(([tag]) => attributes(tag));
  const description = metas.find((tag) => tag.name?.toLowerCase() === 'description')?.content;
  if (!title) failures.push('Missing nonempty title');
  if (!description?.trim()) failures.push('Missing nonempty meta description');

  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? '';
  const visible = textContent(body.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1>/gi, ''));
  if (!visible) failures.push('No server-rendered body text (empty client shell)');

  if (profile) {
    const canonical = links.find((tag) => tag.rel?.toLowerCase().split(/\s+/).includes('canonical'))?.href;
    if (!canonical || !/^https?:\/\//i.test(canonical)) failures.push('Missing absolute profile canonical URL');
    if (!metas.find((tag) => tag.property?.toLowerCase() === 'og:title')?.content?.trim()) failures.push('Missing profile Open Graph title');
    const graph = [];
    for (const [, attrs, json] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (attributes(attrs).type?.toLowerCase() !== 'application/ld+json') continue;
      try {
        const document = JSON.parse(json);
        graph.push(...(Array.isArray(document) ? document : document['@graph'] ?? [document]));
      } catch {
        failures.push('Invalid JSON-LD');
      }
    }
    const profilePage = graph.find((node) => [node?.['@type']].flat().includes('ProfilePage'));
    if (!profilePage) failures.push('Missing ProfilePage JSON-LD');
    const entityId = profilePage?.mainEntity?.['@id'];
    const entity = entityId ? graph.find((node) => node?.['@id'] === entityId) : null;
    if (!entity?.name || typeof entity.name !== 'string') failures.push('Missing named profile main entity in JSON-LD');
    else if (!visible.includes(textContent(entity.name))) failures.push('Profile name is absent from server-rendered body');
  }
  return { title, failures };
}

// Usage: node scripts/verify-ssr.js [http://localhost:3000/published-slug/]
// Root URLs check basic SSR. Profile URLs also require canonical, Open Graph,
// ProfilePage JSON-LD and the actual profile name in the server-rendered body.
export async function verifyUrl(rawUrl = DEFAULT_URL) {
  const url = new URL(rawUrl);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Expected an HTTP(S) URL');
  console.log(`Checking ${url} as Googlebot`);
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
    signal: AbortSignal.timeout(15_000),
  });
  const failures = [];
  if (!response.ok) failures.push(`HTTP ${response.status}`);
  if (!response.headers.get('content-type')?.toLowerCase().includes('text/html')) failures.push('Response is not HTML');
  const result = inspectHtml(await response.text(), { profile: url.pathname.replace(/\/+$/, '') !== '' });
  failures.push(...result.failures);
  console.log(`HTTP ${response.status}; title: ${result.title || '(missing)'}`);
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  if (!failures.length) console.log('PASS: initial HTML contains server-rendered content and required SEO metadata');
  return failures.length === 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length > 3) throw new Error('Usage: node scripts/verify-ssr.js [URL]');
    if (!await verifyUrl(process.argv[2])) process.exitCode = 1;
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}

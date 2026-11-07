/**
 * Decides, without loading any content, whether a path is a marketing screen
 * with server metadata. The metadata itself (blog posts, niche landings,
 * comparisons) is ~100 KB of copy, so it is imported only for those paths and
 * stays out of the entry chunk that every public profile downloads.
 */
const CONTENT_PREFIXES = ['/blog/', '/for/', '/dlya/', '/alternatives/'];

/** Single-segment niche landings; kept in sync with NICHE_LANDINGS by a test. */
export const NICHE_ROOT_PATHS = [
  '/для-бьюти-мастеров',
  '/для-репетиторов',
  '/taplink-alternative',
  '/sayt-vizitka-dlya-uslug',
  '/multilink',
  '/link-in-bio-ru',
  '/vizitka-onlayn',
  '/for-masters',
];

const FIXED_PATHS = ['/pricing', '/alternatives', '/blog', '/sitemap', '/customers', '/terms', '/privacy', '/payment-terms'];

const MARKETING_PATHS = new Set([...NICHE_ROOT_PATHS, ...FIXED_PATHS]);

function normalize(pathname: string): string | null {
  try {
    return decodeURIComponent(pathname).replace(/\/$/, '') || '/';
  } catch {
    return null;
  }
}

export function needsMarketingMetadata(pathname: string): boolean {
  const path = normalize(pathname);
  if (!path) return false;
  return MARKETING_PATHS.has(path) || CONTENT_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export type MarketingMetadata = { title: string; description: string; canonical: string };

export async function loadMarketingMetadata(pathname: string, language: string): Promise<MarketingMetadata | null> {
  if (!needsMarketingMetadata(pathname)) return null;
  const { marketingMetadata } = await import('./marketing-metadata');
  return marketingMetadata(pathname, language);
}

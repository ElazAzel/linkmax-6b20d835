/**
 * Which routes are the LinkMAX interface (app design tokens) and which render
 * a page built by a user (frozen page tokens). See DESIGN.md → "Two surfaces".
 *
 * Keep APP_FIRST_SEGMENTS in sync with the inline boot script in index.html
 * (it sets the class before first paint); a test checks both lists match.
 */
export const APP_FIRST_SEGMENTS = [
  '', 'index', 'ru', 'en', 'kk', 'uz',
  'auth', 'dashboard', 'admin', 'install', 'join', 'invites', '.lovable',
  'pricing', 'gallery', 'customers', 'alternatives', 'seo-landing', 'experts',
  'terms', 'privacy', 'payment-terms', 'sitemap', 'blog',
  'for-masters', 'for', 'dlya', 'для-репетиторов', 'для-бьюти-мастеров',
  'taplink-alternative', 'sayt-vizitka-dlya-uslug', 'multilink', 'link-in-bio-ru', 'vizitka-onlayn',
  'design-system',
] as const;

const APP_SEGMENTS = new Set<string>(APP_FIRST_SEGMENTS);

export function isAppSurfacePath(pathname: string): boolean {
  const first = pathname.split('/')[1] ?? '';
  let segment = first;
  try {
    segment = decodeURIComponent(first);
  } catch {
    // Malformed escape: treat as a page slug.
  }
  return APP_SEGMENTS.has(segment);
}

export const APP_THEME_STORAGE_KEY = 'lm-app-theme';
export const APP_THEME_ATTRIBUTE = 'data-app-theme';

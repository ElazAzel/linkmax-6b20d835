/**
 * First path segments the app owns. A static route wins over `/$slug/`, so a
 * page with one of these slugs would never open; the landing's address
 * claim treats them as taken. Keep in sync with `src/routes/` — the test
 * next to this file fails when a new top-level route is missing here.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  // top-level routes in src/routes
  'admin', 'alternatives', 'auth', 'blog', 'booking', 'collab', 'customers', 'dashboard', 'demo_nails',
  'design-system', 'dev', 'dlya', 'en', 'events', 'experts', 'for', 'for-masters', 'from', 'gallery', 'goods',
  'index', 'install', 'invites', 'join', 'kk', 'link-in-bio-ru', 'multilink', 'p', 'payment-terms', 'pricing',
  'privacy', 'purchase', 'r', 'review', 'ru', 's', 'sayt-vizitka-dlya-uslug', 'seo-landing', 'sitemap',
  'taplink-alternative', 'team', 'terms', 'uz', 'vizitka-onlayn',
  // service words we keep free for future routes and support
  'api', 'app', 'www', 'help', 'support', 'login', 'signup', 'settings', 'lnkmx', 'linkmax',
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

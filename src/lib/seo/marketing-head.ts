import type { MarketingMetadata } from './marketing-route';

/**
 * Leaf-owned SSR tags. Never put canonicals or share images on the root layout.
 *
 * The copy comes from the root route's beforeLoad (loadMarketingMetadata), which
 * imports the heavy content modules only for marketing paths. Keep this file
 * free of content imports: every marketing route file imports it statically.
 */
export function buildMarketingHead(match: { pathname: string; context?: unknown }) {
  const page = (match.context as { marketing?: MarketingMetadata | null } | undefined)?.marketing;
  if (!page) return {};
  const article = match.pathname.startsWith('/blog/');
  return {
    meta: [
      { title: page.title }, { name: 'description', content: page.description },
      { property: 'og:title', content: page.title }, { property: 'og:description', content: page.description },
      { property: 'og:type', content: article ? 'article' : 'website' }, { property: 'og:url', content: page.canonical },
      { name: 'twitter:card', content: 'summary' }, { name: 'twitter:title', content: page.title },
      { name: 'twitter:description', content: page.description },
    ],
    links: [{ rel: 'canonical', href: page.canonical }],
  };
}

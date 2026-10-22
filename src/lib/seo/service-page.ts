import type { PublicPageData } from './public-page-snapshot';
import { resolveServiceBySlug, type ServiceResolution } from './service-resolver';
import { isBlockShownToVisitors } from '@/lib/blocks/block-visibility';
import { getPublicPageUrl } from '@/lib/utils/url-helpers';
import { safeJsonLd, toPlainText } from './public-page-seo';

export type PublicService = { status: 'ok'; slug: string; serviceSlug: string; displayName: string; indexable: boolean; service: NonNullable<ServiceResolution['pricingItem']> };
export function resolvePublicService(page: PublicPageData, serviceSlug: string): PublicService | { status: 'redirect' | 'missing' } {
  const slug = page.slug;
  if (!slug) return { status: 'missing' };
  // Anonymous snapshots obey the same RLS policies as the public profile.
  const items = page.blocks.flatMap(block => block.type === 'pricing' && isBlockShownToVisitors(block)
    ? block.items.map(item => ({ ...item, currency: item.currency || block.currency || 'KZT' })) : []);
  const result = resolveServiceBySlug(page.serviceSlugs, items, serviceSlug);
  if (!result.found || !result.pricingItem) return { status: result.notFoundReason === 'removed' || result.notFoundReason === 'item_missing' ? 'redirect' : 'missing' };
  return { status: 'ok', slug, serviceSlug, displayName: page.title || page.seo?.title || slug,
    indexable: page.isIndexable !== false && result.state !== 'thin', service: result.pricingItem };
}

export function buildServiceHead(page: PublicService) {
  const url = `${getPublicPageUrl(page.slug)}/services/${encodeURIComponent(page.serviceSlug)}`;
  const title = `${page.service.name} — ${page.displayName} | LinkMAX`;
  const description = toPlainText(page.service.description) || `${page.service.name}: стоимость и контакты ${page.displayName} для записи.`;
  const robots = page.indexable ? 'index, follow, max-image-preview:large' : 'noindex, follow';
  const schema = { '@context': 'https://schema.org', '@type': 'Service', name: page.service.name, description, url,
    provider: { '@type': 'Person', name: page.displayName, url: getPublicPageUrl(page.slug) },
    ...(page.service.price != null && Number.isFinite(page.service.price) && page.service.price > 0
      ? { offers: { '@type': 'Offer', price: page.service.price, priceCurrency: page.service.currency || 'KZT', url } } : {}) };
  return { meta: [{ title }, { name: 'description', content: description }, { name: 'robots', content: robots },
    { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:url', content: url }],
    links: [{ rel: 'canonical', href: url }], scripts: [{ type: 'application/ld+json', children: safeJsonLd(JSON.stringify(schema)) }] };
}

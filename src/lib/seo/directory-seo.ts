import { fetchExpertDirectoryProfiles, type ExpertDirectoryProfile } from '@/services/pages';
import { buildHubMeta, findHubCity, findHubNiche, type HubLang } from './expert-hubs';
import { safeJsonLd } from './public-page-seo';
import { getAppDomain, getPublicPageUrl } from '@/lib/utils/url-helpers';

export interface DirectoryParams { tag?: string; city?: string }
export interface ExpertDirectorySnapshot { experts: ExpertDirectoryProfile[]; fallbackExperts: ExpertDirectoryProfile[] }

export async function loadExpertDirectory(params: DirectoryParams, search: URLSearchParams): Promise<ExpertDirectorySnapshot> {
  const hubCity = findHubCity(params.city);
  const verifiedOnly = search.get('verified') === '1';
  const cities = hubCity ? hubCity.aliases : [search.get('city') || ''];
  const lists = await Promise.all(cities.map(city => fetchExpertDirectoryProfiles({ tag: params.tag, city, verifiedOnly, limit: 100 })));
  const seen = new Set<string>();
  const experts = lists.flat().filter(p => !seen.has(p.id) && !!seen.add(p.id));
  const fallbackExperts = hubCity && experts.length < 3
    ? await fetchExpertDirectoryProfiles({ tag: params.tag, verifiedOnly: false, limit: 12 }) : [];
  return { experts, fallbackExperts };
}

export function isKnownDirectory(params: DirectoryParams) {
  const niche = findHubNiche(params.tag);
  return (!params.tag || !!niche) && (!params.city || !!findHubCity(params.city)) && (!params.city || !params.tag || !!niche?.hub);
}

export function buildDirectoryHead(kind: 'experts' | 'gallery', params: DirectoryParams, search: URLSearchParams,
  pages: Array<{ slug: string; title: string | null }>, language: HubLang = 'ru') {
  const hub = buildHubMeta(language, findHubNiche(params.tag), findHubCity(params.city));
  const gallery = {
    ru: ['Галерея страниц — примеры сайтов и портфолио | LinkMAX', 'Примеры опубликованных страниц специалистов и компаний: услуги, портфолио и контакты на LinkMAX.'],
    en: ['Page gallery — websites and portfolios | LinkMAX', 'Explore published pages by professionals and businesses: services, portfolios and contact details on LinkMAX.'],
    kk: ['Беттер галереясы — сайттар мен портфолио | LinkMAX', 'LinkMAX-тағы мамандар мен компаниялардың жарияланған беттері: қызметтер, портфолио және байланыстар.'],
  }[language];
  const title = kind === 'gallery' ? gallery[0] : hub.title;
  const description = kind === 'gallery' ? gallery[1] : hub.description;
  const canonical = `${getAppDomain()}${kind === 'gallery' ? '/gallery' : hub.path}`;
  const filtered = ['q', 'city', 'verified', ...(kind === 'gallery' ? ['niche'] : [])].some(k => !!search.get(k));
  const robots = filtered || !isKnownDirectory(params) ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1';
  const schema = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, description, url: canonical,
    mainEntity: { '@type': 'ItemList', itemListElement: pages.map((p, index) => ({ '@type': 'ListItem', position: index + 1, url: getPublicPageUrl(p.slug), name: p.title || p.slug })) } };
  return {
    meta: [{ title }, { name: 'description', content: description }, { name: 'robots', content: robots }, { name: 'googlebot', content: robots },
      { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:url', content: canonical }, { property: 'og:type', content: 'website' }],
    links: [{ rel: 'canonical', href: canonical }],
    scripts: [{ type: 'application/ld+json', children: safeJsonLd(JSON.stringify(schema)) }],
  };
}

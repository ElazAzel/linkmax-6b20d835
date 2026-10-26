import i18n from '@/i18n/config';
import type { TFunction } from 'i18next';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { getProPrice } from '@/domain/billing/catalog';
import { safeJsonLd } from './public-page-seo';
import { SEARCH_ROBOTS } from './site-policy';

export function getLandingFaq(t: TFunction) {
  return Array.from({ length: 6 }, (_, i) => ({ q: t(`landing.kx.faq.q${i + 1}`), a: t(`landing.kx.faq.a${i + 1}`) }));
}

export function buildLandingHead(language: string, path = '/') {
  const lang = ['ru', 'en', 'kk', 'uz'].includes(language) ? language : 'ru';
  const t = i18n.getFixedT(lang);
  const domain = getAppDomain();
  const canonical = `${domain}${/^\/(ru|en|kk|uz)$/.test(path) ? path : '/'}`;
  const title = t('landing.revenue.seo.title');
  const description = t('landing.revenue.seo.description');
  const org = `${domain}#organization`;
  const graph = [
    { '@type': 'WebSite', '@id': `${domain}/#website`, name: 'LinkMAX', url: `${domain}/`, publisher: { '@id': org }, inLanguage: ['ru', 'en', 'kk', 'uz'] },
    { '@type': 'SoftwareApplication', '@id': `${domain}/#application`, name: 'LinkMAX', url: `${domain}/`, applicationCategory: 'BusinessApplication', operatingSystem: 'Web',
      description, offers: [{ '@type': 'Offer', price: '0', priceCurrency: 'KZT', url: `${domain}/pricing` },
        { '@type': 'Offer', name: 'PRO', price: String(getProPrice(12).monthlyKzt), priceCurrency: 'KZT', url: `${domain}/pricing` }], publisher: { '@id': org } },
    { '@type': 'WebPage', '@id': `${canonical}#page`, name: title, description, url: canonical, inLanguage: lang, isPartOf: { '@id': `${domain}/#website` }, about: { '@id': `${domain}/#application` } },
    { '@type': 'FAQPage', mainEntity: getLandingFaq(t).map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ];
  return {
    meta: [{ title }, { name: 'description', content: description }, { name: 'robots', content: SEARCH_ROBOTS }, { name: 'googlebot', content: SEARCH_ROBOTS },
      { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:type', content: 'website' }, { property: 'og:url', content: canonical },
      { property: 'og:image', content: `${domain}/og-image.png` }, { property: 'og:image:width', content: '1200' }, { property: 'og:image:height', content: '630' }, { name: 'twitter:image', content: `${domain}/og-image.png` },
      { property: 'og:locale', content: ({ ru: 'ru_RU', en: 'en_US', kk: 'kk_KZ', uz: 'uz_UZ' })[lang] || 'ru_RU' },
      { name: 'twitter:card', content: 'summary_large_image' }, { name: 'twitter:title', content: title }, { name: 'twitter:description', content: description },
      { name: 'theme-color', content: '#0a0a0a', media: '(prefers-color-scheme: light)' }, { name: 'theme-color', content: '#0a0a0a', media: '(prefers-color-scheme: dark)' }],
    links: [{ rel: 'canonical', href: canonical }, ...['ru', 'en', 'kk', 'uz'].map(l => ({ rel: 'alternate', hrefLang: l, href: `${domain}/${l}` })), { rel: 'alternate', hrefLang: 'x-default', href: `${domain}/` }],
    scripts: [{ type: 'application/ld+json', children: safeJsonLd(JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })) }],
  };
}

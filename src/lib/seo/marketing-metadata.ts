import i18n from '@/i18n/config';
import { NICHE_LANDINGS, getNicheLandingByKey } from '@/lib/niche-landing-data';
import { getBlogPost } from '@/lib/blog-posts';
import { getAlternativeProfile } from '@/lib/alternatives-data';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { getLegalSeo } from '@/components/legal/LegalDocumentContent';
import { requestLanguage } from './site-policy';

/** Head metadata for legacy marketing screens whose effect-only heads cannot run during SSR. */
export function marketingMetadata(pathname: string, language = 'ru') {
  let path: string;
  try { path = decodeURIComponent(pathname).replace(/\/$/, '') || '/'; } catch { return null; }
  const t = i18n.getFixedT(language);
  const legalKind = ({ '/terms': 'terms', '/privacy': 'privacy', '/payment-terms': 'payment' } as const)[path as '/terms' | '/privacy' | '/payment-terms'];
  if (legalKind) return { ...getLegalSeo(legalKind, language), canonical: `${getAppDomain()}${path}` };
  const landing = NICHE_LANDINGS.find(p => p.canonicalPath === path)
    || (path === '/for-masters' ? getNicheLandingByKey('beauty-masters') : undefined)
    || (/^\/(dlya|for)\//.test(path) ? getNicheLandingByKey(path.split('/')[2]) : undefined);
  if (landing) return { title: landing.seoTitle, description: landing.seoDescription, canonical: `${getAppDomain()}${path}` };
  if (path.startsWith('/blog/')) {
    const post = getBlogPost(path.slice(6));
    if (post) return { title: post.metaTitle || post.title, description: post.metaDescription || post.description, canonical: `${getAppDomain()}/blog/${post.slug}` };
  }
  if (path.startsWith('/alternatives/')) {
    const profile = getAlternativeProfile(path.split('/')[2]);
    if (profile) return { title: `LinkMAX и ${profile.competitor} — сравнение возможностей`, description: profile.summary, canonical: `${getAppDomain()}${profile.route}` };
  }
  const localized: Record<string, [string, string]> = {
    '/pricing': [t('pricing.seo.title'), t('pricing.seo.description')],
    '/alternatives': [t('alternatives.seo.title'), t('alternatives.seo.description')],
    '/customers': [t('customers.seo.title'), t('customers.seo.description')],
  };
  const fixed: Record<string, [string, string]> = {
    '/blog': ['Блог LinkMAX — заявки, оплаты и сайт-визитка', 'Гайды для специалистов, мастеров, коучей и фрилансеров: как собрать сайт-визитку, принимать заявки и работать с клиентами.'],
    '/sitemap': ['Карта сайта LinkMAX', 'Разделы LinkMAX: публичные страницы, каталог специалистов, галерея, тарифы и статьи.'],
    '/customers': ['Примеры страниц специалистов и компаний | LinkMAX', 'Посмотрите примеры публичных страниц, портфолио и услуг, созданных на LinkMAX.'],
    '/terms': ['Пользовательское соглашение - LinkMAX', 'Условия использования LinkMAX: аккаунт, страницы, CRM, AI, платежи, обязанности пользователей и правила платформы.'],
    '/privacy': ['Политика конфиденциальности - LinkMAX', 'Как LinkMAX обрабатывает аккаунтные, клиентские, аналитические, платежные и технические данные.'],
    '/payment-terms': ['Оплата и возвраты - LinkMAX', 'Условия оплаты, комиссии, подписки и возвраты на платформе LinkMAX.'],
  };
  const copy = localized[path] || fixed[path];
  return copy ? { title: copy[0], description: copy[1], canonical: `${getAppDomain()}${path}` } : null;
}

/** Leaf-owned SSR tags. Never put canonicals or share images on the root layout. */
export function buildMarketingHead(match: { pathname: string; search: unknown }) {
  const search = new URLSearchParams(match.search as Record<string, string>).toString();
  const language = typeof window === 'undefined' ? requestLanguage(match.pathname, search) : i18n.language;
  const page = marketingMetadata(match.pathname, language);
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

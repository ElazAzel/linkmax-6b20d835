import i18n from '@/i18n/config';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { requestLanguage } from './site-policy';

type Content = { title: string; description: string };

/** Anonymous REST reads only: no sessions, owner access or download credentials. */
async function publicRead(path: string, body?: Record<string, string>): Promise<Record<string, unknown>[]> {
  const base = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key) throw new Error('Public content unavailable');
  const response = await fetch(`${base}/rest/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { apikey: key, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Public content unavailable');
  const data: unknown = await response.json();
  return (Array.isArray(data) ? data : data && typeof data === 'object' ? [data] : []) as Record<string, unknown>[];
}

function text(value: unknown, language: string): string {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const translations = value as Record<string, unknown>;
    return text(translations[language] ?? translations.ru ?? translations.en, language);
  }
  return '';
}

export async function fetchContentMetadata(kind: 'goods' | 'event' | 'subpage' | 'collab', params: Record<string, string>, language: string): Promise<Content | null> {
  const eq = (value: string) => encodeURIComponent(value);
  if (kind === 'goods') {
    const [product] = await publicRead('rpc/get_digital_product_public', { _product_id: params.id });
    return product ? { title: text(product.title, language), description: text(product.description, language) } : null;
  }
  if (kind === 'collab') {
    const [collab] = await publicRead(`collaborations?select=requester_id,target_id&collab_slug=eq.${eq(params.collabSlug)}&status=eq.accepted&limit=1`);
    if (!collab) return null;
    const profiles = await publicRead(`public_user_profiles?select=display_name,username&id=in.(${eq(String(collab.requester_id))},${eq(String(collab.target_id))})`);
    const names = profiles.map(p => text(p.display_name || p.username, language)).filter(Boolean).join(' × ');
    return names ? { title: names, description: `${i18n.getFixedT(language)('collab.title')}: ${names}` } : null;
  }
  const [home] = await publicRead(`pages?select=id,site_id,title&slug=eq.${eq(params.slug)}&is_published=eq.true&limit=1`);
  if (!home) return null;
  if (kind === 'event') {
    const [event] = await publicRead(`events?select=title_i18n_json,description_i18n_json&id=eq.${eq(params.eventId)}&page_id=eq.${eq(String(home.id))}&limit=1`);
    return event ? { title: `${text(event.title_i18n_json, language)} — ${text(home.title, language) || params.slug}`, description: text(event.description_i18n_json, language) } : null;
  }
  if (!home.site_id) return null;
  const [page] = await publicRead(`pages?select=title,description,seo_meta&site_id=eq.${eq(String(home.site_id))}&page_path=eq.${eq(params.pagePath)}&is_published=eq.true&limit=1`);
  if (!page) return null;
  const seo = page.seo_meta && typeof page.seo_meta === 'object' ? page.seo_meta as Record<string, unknown> : {};
  return { title: text(seo.title || page.title, language), description: text(seo.description || page.description, language) };
}

export function buildContentHead(content: Content | null | undefined, pathname: string) {
  const url = `${getAppDomain()}${pathname}`;
  const title = content?.title ? `${content.title} | LinkMAX` : 'LinkMAX';
  const description = content?.description || content?.title || '';
  return {
    meta: [{ title }, { name: 'description', content: description },
      { property: 'og:title', content: title }, { property: 'og:description', content: description },
      { property: 'og:type', content: 'website' }, { property: 'og:url', content: url },
      { name: 'twitter:card', content: 'summary' },
      ...(!content ? [{ name: 'robots', content: 'noindex, nofollow' }, { name: 'googlebot', content: 'noindex, nofollow' }] : [])],
    links: [{ rel: 'canonical', href: url }],
  };
}

export function contentLanguage(location: { pathname: string; searchStr: string }) {
  return requestLanguage(location.pathname, location.searchStr);
}
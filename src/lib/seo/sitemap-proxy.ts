/**
 * Serves the profile/expert/event sitemaps from lnkmx.my itself. Yandex only
 * accepts sitemaps on the site's own host, and Google trusts them more there;
 * the XML is still built by the generate-sitemap edge function.
 */
type ProxiedSitemap = 'sitemap-profiles' | 'sitemap-experts' | 'sitemap-events';

export async function proxySitemap(name: ProxiedSitemap): Promise<Response> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!baseUrl) return new Response('Sitemap unavailable\n', { status: 503 });
  try {
    const upstream = await fetch(`${baseUrl}/functions/v1/generate-sitemap/${name}.xml`, {
      headers: key ? { apikey: key, authorization: `Bearer ${key}` } : undefined,
      signal: AbortSignal.timeout(6000),
    });
    if (!upstream.ok) return new Response('Sitemap unavailable\n', { status: 503, headers: { 'retry-after': '600' } });
    const xml = await upstream.text();
    if (!/<(?:urlset|sitemapindex)\b/.test(xml)) return new Response('Sitemap unavailable\n', { status: 503, headers: { 'retry-after': '600' } });
    return new Response(xml, {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=900, s-maxage=3600',
      },
    });
  } catch {
    return new Response('Sitemap unavailable\n', { status: 503, headers: { 'retry-after': '600' } });
  }
}

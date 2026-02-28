# SEO SSR & Bot Rendering

This project uses a **bot-oriented SSR layer** for indexing without changing the main React/Vite SPA behavior.

## How it works

1. **Cloudflare Worker** (`cloudflare-worker/prerender-worker.js`)
   - Detects search engine bots by User-Agent.
   - Routes bots to Supabase Edge Function SSR endpoints:
     - `/ssr/landing` → landing page HTML
     - `/ssr/gallery` → gallery HTML
     - `/ssr/:slug` → public profile HTML
   - Humans continue to receive the normal SPA.

2. **Supabase Edge Function** (`supabase/functions/generate-sitemap`)
   - Generates `sitemap.xml`.
   - Renders SSR HTML for landing, gallery, and profile pages.
   - Adds meta tags, canonical, hreflang, OG/Twitter, and JSON-LD.
   - Returns correct HTTP status (200/404).
   - Caches SSR output with `Cache-Control` headers.

## SSR endpoints

```
https://<project>.supabase.co/functions/v1/generate-sitemap/ssr/landing
https://<project>.supabase.co/functions/v1/generate-sitemap/ssr/gallery
https://<project>.supabase.co/functions/v1/generate-sitemap/ssr/{slug}
```

Add `?lang=ru|en|kk` to select language. If omitted, the SSR layer uses the
`Accept-Language` header to infer the language (defaults to `ru`).

## Cache policy

- Landing: `s-maxage=3600`
- Gallery: `s-maxage=900`
- Profile: `s-maxage=3600`
- Sitemap: `max-age=3600`

## Testing (manual)

```
curl -A "Googlebot" https://lnkmx.my/
curl -A "Googlebot" https://lnkmx.my/gallery
curl -A "Googlebot" https://lnkmx.my/{slug}
curl https://lnkmx.my/sitemap.xml
```

## Testing (unit)

```
deno test supabase/functions/generate-sitemap
```

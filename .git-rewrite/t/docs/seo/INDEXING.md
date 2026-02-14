# lnkmx.my SEO & Indexing Documentation

## Canonical URL Strategy

### Domain Configuration
- **Canonical Domain**: `https://lnkmx.my`
- **Protocol**: HTTPS only (HTTP redirects to HTTPS)
- **WWW**: No www (www.lnkmx.my redirects to lnkmx.my)
- **Trailing Slash**: No trailing slash on paths (except root `/`)

### URL Structure

| Page Type | Canonical URL | Notes |
|-----------|---------------|-------|
| Homepage | `https://lnkmx.my/` | Root with trailing slash |
| Static pages | `https://lnkmx.my/pricing` | No trailing slash |
| User pages | `https://lnkmx.my/{slug}` | No trailing slash |
| Expert directory | `https://lnkmx.my/experts` | Main directory |
| Expert niche | `https://lnkmx.my/experts/{tag}` | Filter by niche |
| Language variant | `https://lnkmx.my/page?lang=ru` | Query param, not path |

### Redirects Required

Configure these redirects at the hosting/CDN level:

```
# HTTP to HTTPS
http://lnkmx.my/* → https://lnkmx.my/* (301)
http://www.lnkmx.my/* → https://lnkmx.my/* (301)

# WWW to non-WWW
https://www.lnkmx.my/* → https://lnkmx.my/* (301)

# Trailing slash normalization
https://lnkmx.my/pricing/ → https://lnkmx.my/pricing (301)
https://lnkmx.my/user-slug/ → https://lnkmx.my/user-slug (301)
```

---

## robots.txt

Location: `/public/robots.txt`

### Allowed Routes
- `/` - All public pages
- `/gallery` - User gallery
- `/pricing` - Pricing page
- `/experts` - Expert directory
- `/alternatives` - Comparison page
- `/{user-slug}` - User pages

### Blocked Routes
- `/dashboard` - User dashboard
- `/admin` - Admin panel
- `/auth` - Authentication pages
- `/api/` - API endpoints
- `/crm` - CRM system
- `/p/` - Preview/draft pages
- `/install` - App installation
- `/join/` - Team join flows
- `/team/` - Team pages (private)

### Sitemaps
```
Sitemap: https://lnkmx.my/sitemap.xml
Sitemap: https://pphdcfxucfndmwulpfwv.supabase.co/functions/v1/generate-sitemap
```

---

## sitemap.xml

### Static Sitemap
Location: `/public/sitemap.xml`

Contains:
- Homepage
- Static pages (pricing, gallery, etc.)
- Expert niche pages
- Legal pages

### Dynamic Sitemap
Endpoint: `https://pphdcfxucfndmwulpfwv.supabase.co/functions/v1/generate-sitemap`

Features:
- All published user pages
- Updated automatically on publish/unpublish
- 1-hour cache with ETag support
- Includes hreflang for all 3 languages
- Includes image sitemap for user avatars

### Sitemap Index
Location: `/public/sitemap-index.xml`

References both static and dynamic sitemaps.

---

## Hreflang Implementation

### Supported Languages
- `ru` - Russian (default)
- `en` - English
- `kk` - Kazakh
- `x-default` - Default (Russian)

### Implementation
Each page includes hreflang links in the `<head>`:

```html
<link rel="alternate" hreflang="ru" href="https://lnkmx.my/page?lang=ru" />
<link rel="alternate" hreflang="en" href="https://lnkmx.my/page?lang=en" />
<link rel="alternate" hreflang="kk" href="https://lnkmx.my/page?lang=kk" />
<link rel="alternate" hreflang="x-default" href="https://lnkmx.my/page" />
```

### Components
- `StaticSEOHead.tsx` - Static pages
- `EnhancedSEOHead.tsx` - User pages
- `SEOLandingHead.tsx` - Landing page

---

## SSR / Crawler-Friendly Content

### Strategy
Since this is a Vite SPA, we use:

1. **noscript fallback** - Semantic HTML in `<noscript>` tags
2. **JSON-LD schemas** - Structured data in `<head>`
3. **Meta tags** - Dynamic updates via React

### Components
- `CrawlerFriendlyContent.tsx` - Generates semantic HTML for user pages
- `index.html` - Static fallback for homepage

### What Crawlers See
Using `view-source:https://lnkmx.my/`:

1. **Title & Description** - In `<head>`
2. **Schema.org JSON-LD** - WebApplication, Organization schemas
3. **noscript content** - Full page content in semantic HTML
4. **Canonical & hreflang** - Proper link tags

---

## Google Search Console Setup

### Step 1: Add Property
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add property"
3. Choose "Domain" type
4. Enter: `lnkmx.my`

### Step 2: Verify Domain
Add DNS TXT record:
```
Type: TXT
Host: @ (or leave empty)
Value: google-site-verification=XXXXXX
TTL: 3600
```

Alternatively, add to `index.html`:
```html
<meta name="google-site-verification" content="YOUR_CODE" />
```

### Step 3: Submit Sitemaps
1. Go to Sitemaps section
2. Add:
   - `https://lnkmx.my/sitemap.xml`
   - `https://lnkmx.my/sitemap-index.xml`

### Step 4: Request Indexing
1. Use URL Inspection tool
2. Enter key URLs
3. Click "Request indexing"

Priority URLs to index:
- `https://lnkmx.my/`
- `https://lnkmx.my/pricing`
- `https://lnkmx.my/experts`
- `https://lnkmx.my/gallery`

---

## Verification Commands

### Check robots.txt
```bash
curl -I https://lnkmx.my/robots.txt
# Should return 200 OK

curl https://lnkmx.my/robots.txt
# Should show robots.txt content
```

### Check sitemap
```bash
curl -I https://lnkmx.my/sitemap.xml
# Should return 200 OK, Content-Type: application/xml

curl https://lnkmx.my/sitemap.xml | head -50
# Should show XML sitemap with URLs
```

### Check canonical
```bash
curl -s https://lnkmx.my/ | grep -i canonical
# Should show: <link rel="canonical" href="https://lnkmx.my/" />
```

### Check hreflang
```bash
curl -s https://lnkmx.my/ | grep -i hreflang
# Should show all 4 hreflang links
```

### Check SSR fallback
```bash
curl -s https://lnkmx.my/ | grep -i "<noscript>"
# Should show noscript content
```

### Check HTTP status
```bash
curl -I https://lnkmx.my/
# Should return 200 OK

curl -I https://lnkmx.my/nonexistent-page
# Should return 200 (SPA) or 404 if configured
```

---

## Quality Checks

### Lighthouse
Run Lighthouse audit on key pages:
- Performance > 90
- SEO > 95
- Accessibility > 90

### Mobile-Friendly Test
Test at: https://search.google.com/test/mobile-friendly

### Rich Results Test
Test Schema.org: https://search.google.com/test/rich-results

### Ahrefs/Semrush
Monitor:
- Indexation status
- Crawl errors
- Backlink profile
- Keyword rankings

---

## Monitoring & Alerts

### What to Monitor
1. **4xx/5xx errors** - via Supabase logs
2. **Crawl rate** - via GSC
3. **Index coverage** - via GSC
4. **Core Web Vitals** - via GSC/Lighthouse

### Edge Function Logs
Check sitemap generation:
```bash
# Via Supabase dashboard or CLI
supabase functions logs generate-sitemap
```

---

## Troubleshooting

### Page not indexing
1. Check robots.txt doesn't block it
2. Verify canonical points to itself
3. Check for noindex meta tag
4. Submit URL in GSC

### Duplicate content
1. Ensure only one canonical exists
2. Check www/non-www redirects
3. Verify trailing slash handling

### Hreflang errors
1. All versions must link to each other
2. Each version links to itself
3. x-default should point to main version

---

## Files Reference

| File | Purpose |
|------|---------|
| `index.html` | Main HTML with SSR fallback |
| `public/robots.txt` | Crawler instructions |
| `public/sitemap.xml` | Static sitemap |
| `public/sitemap-index.xml` | Sitemap index |
| `supabase/functions/generate-sitemap/` | Dynamic sitemap |
| `src/components/seo/EnhancedSEOHead.tsx` | User page SEO |
| `src/components/seo/StaticSEOHead.tsx` | Static page SEO |
| `src/components/seo/CrawlerFriendlyContent.tsx` | SSR fallback |
| `docs/seo/INDEXING.md` | This documentation |

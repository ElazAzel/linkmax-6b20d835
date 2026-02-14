# lnkmx.my Technical SEO Checklist

## Pre-Launch Checklist

### Canonical URLs
- [ ] Canonical domain decided: `https://lnkmx.my` (no www)
- [ ] All pages have `<link rel="canonical">` tag
- [ ] Canonical points to self (not other page)
- [ ] No trailing slashes on paths (except root)

### Redirects
- [ ] HTTP → HTTPS redirect (301)
- [ ] www → non-www redirect (301)
- [ ] Trailing slash → no trailing slash (301)
- [ ] Old URLs → new URLs (if changed)

### robots.txt
- [ ] robots.txt accessible at `/robots.txt`
- [ ] Returns 200 status
- [ ] Allows public pages
- [ ] Blocks private routes (/dashboard, /admin, etc.)
- [ ] Contains Sitemap directive
- [ ] No blocking of CSS/JS needed for rendering

### Sitemap
- [ ] sitemap.xml accessible
- [ ] Valid XML syntax
- [ ] Contains all public pages
- [ ] Excludes noindex pages
- [ ] Has lastmod dates
- [ ] Has hreflang alternates
- [ ] Submitted to Search Console

### Hreflang
- [ ] All 3 languages implemented (ru, en, kk)
- [ ] x-default points to main version
- [ ] Each version references all others
- [ ] Each version references itself

### Meta Tags
- [ ] Unique title per page (< 60 chars)
- [ ] Unique description per page (< 160 chars)
- [ ] robots meta set correctly
- [ ] Open Graph tags complete
- [ ] Twitter Card tags complete

### Structured Data
- [ ] WebApplication schema on homepage
- [ ] Organization schema
- [ ] Person/Organization on user pages
- [ ] FAQ schema where applicable
- [ ] Service schema for pricing
- [ ] Event schema for events

### SSR / Crawler Content
- [ ] view-source shows content (not empty)
- [ ] noscript fallback in place
- [ ] No "Loading..." as only content
- [ ] Semantic HTML structure
- [ ] Proper heading hierarchy (H1 → H2 → H3)

### HTTP Status Codes
- [ ] Public pages return 200
- [ ] 404 page exists and returns 404
- [ ] No 500 errors on production
- [ ] Auth pages return 200 (with noindex)

### Performance
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Mobile-friendly
- [ ] Images optimized

---

## Verification Commands

```bash
# robots.txt
curl -I https://lnkmx.my/robots.txt

# sitemap
curl -I https://lnkmx.my/sitemap.xml
curl https://lnkmx.my/sitemap.xml | xmllint --noout -

# canonical
curl -s https://lnkmx.my/ | grep -i canonical

# hreflang
curl -s https://lnkmx.my/ | grep -i hreflang

# status codes
curl -I https://lnkmx.my/
curl -I https://lnkmx.my/pricing
curl -I https://lnkmx.my/nonexistent-page

# redirects
curl -I http://lnkmx.my/
curl -I https://www.lnkmx.my/
curl -I https://lnkmx.my/pricing/
```

---

## Post-Launch Monitoring

### Daily
- [ ] Check for 4xx/5xx errors in logs
- [ ] Monitor Core Web Vitals

### Weekly
- [ ] Review GSC coverage report
- [ ] Check for new crawl errors
- [ ] Monitor search performance

### Monthly
- [ ] Full SEO audit
- [ ] Keyword ranking check
- [ ] Competitor analysis
- [ ] Content freshness review

---

## URL Mapping Table

| URL Type | Pattern | Canonical | Indexed | Notes |
|----------|---------|-----------|---------|-------|
| Homepage | `/` | `https://lnkmx.my/` | Yes | Main entry |
| Pricing | `/pricing` | `https://lnkmx.my/pricing` | Yes | Conversion page |
| Gallery | `/gallery` | `https://lnkmx.my/gallery` | Yes | Social proof |
| Experts | `/experts` | `https://lnkmx.my/experts` | Yes | Directory |
| Niche | `/experts/{tag}` | `https://lnkmx.my/experts/{tag}` | Yes | Filtered |
| User page | `/{slug}` | `https://lnkmx.my/{slug}` | Yes* | *If published |
| Alternatives | `/alternatives` | `https://lnkmx.my/alternatives` | Yes | Comparison |
| Terms | `/terms` | `https://lnkmx.my/terms` | Yes | Legal |
| Privacy | `/privacy` | `https://lnkmx.my/privacy` | Yes | Legal |
| Dashboard | `/dashboard` | N/A | No | Private |
| Auth | `/auth` | N/A | No | Private |
| Admin | `/admin` | N/A | No | Private |
| CRM | `/crm` | N/A | No | Private |

---

## Quality Gates

### User Page Indexation Criteria
A user page is indexed if it meets these criteria:
1. `is_published = true`
2. Has profile name (not empty)
3. Has at least 1 content block
4. Not a reserved slug

### Noindex Triggers
Pages get `noindex` if:
- Private (dashboard, admin, auth)
- Draft/unpublished user page
- Low quality score (< threshold)
- Explicitly set by user

---

## Emergency Procedures

### Site-wide Deindexation (Accidental)
1. Check robots.txt for `Disallow: /`
2. Check for site-wide noindex meta
3. Remove blocking rules
4. Request indexing in GSC

### Duplicate Content Issues
1. Identify duplicate URLs
2. Choose canonical version
3. Add 301 redirects
4. Update internal links
5. Resubmit sitemap

### Crawl Errors Spike
1. Check server status
2. Review recent deployments
3. Check DNS/SSL
4. Fix 4xx/5xx sources
5. Monitor resolution

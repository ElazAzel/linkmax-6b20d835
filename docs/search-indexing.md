# Search indexing

Public profiles, services, gallery and expert directory content must be present in the first HTTP HTML response, together with a self canonical and their own metadata. Private application routes and error responses send `X-Robots-Tag: noindex, nofollow`; missing profiles and services return real 404 responses. Removed service mappings redirect to their parent profile.

The anonymous public REST snapshot is the source for profile and service SSR. Its RLS rules continue to protect paid blocks. Directory loaders respect publication and owner indexing settings. Request locale must agree between route head, server rendering and initial hydration; the server render uses a separate i18next instance per request.

`scripts/generate-sitemap.mjs` generates the static sitemap from implemented canonical landing routes and published, indexable profiles using the configured public backend. It preserves actual profile modification dates and does not invent dates for static pages. Dynamic profile, expert and event maps retain the existing Lovable Cloud edge URLs. The proxy rejects upstream HTML masquerading as successful XML and sends a retryable 503 when unavailable.

Run the read-only verification after building and starting the standalone server:

```sh
python scripts/verify-indexing.py --base http://127.0.0.1:4178 --output tmp/indexing-local.json
python scripts/verify-indexing.py --output tmp/indexing-production.json
```

The script follows declared same-origin sitemaps, checks only sitemap URL locations (not image locations), fetches every page without JavaScript and checks status, canonical, title, description, H1, indexability and JSON-LD. It also probes missing pages and private routes. It never submits URLs to a search engine.

Search Console inspection on 22 October 2026 showed that `https://lnkmx.my/elazart` was absent from the index after its 14 September crawl: no user canonical was detected and Google selected the homepage. This is historical crawl evidence, not the state of the current HTML. Live inspection returned a Google service error twice; neither attempt is evidence of a successful indexing request. Search Console listed only `/sitemap.xml`, last processed successfully on 18 October with 82 discovered pages.

Valid HTML, structured data, llms.txt and sitemap submission improve discovery and interpretation; search engines independently decide whether and when to index, rank or cite a page.

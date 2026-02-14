# Google Search Console Setup Guide

## Overview
This guide covers setting up Google Search Console (GSC) for lnkmx.my to monitor indexation, crawl errors, and search performance.

---

## Step 1: Add Property

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Sign in with your Google account
3. Click **"Add property"** button
4. Choose **"Domain"** property type
5. Enter: `lnkmx.my`

> **Note**: Domain property covers all subdomains and protocols automatically.

---

## Step 2: Verify Domain Ownership

### Option A: DNS TXT Record (Recommended)

1. GSC will show a TXT record value like:
   ```
   google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

2. Add this to your DNS provider:
   ```
   Type: TXT
   Host: @ (or leave empty for root)
   Value: google-site-verification=YOUR_CODE
   TTL: 3600 (or default)
   ```

3. Wait 5-30 minutes for DNS propagation
4. Click "Verify" in GSC

### Option B: HTML Meta Tag (Alternative)

Add to `index.html` in the `<head>` section:
```html
<meta name="google-site-verification" content="YOUR_CODE" />
```

> **Important**: Don't commit verification codes to public repos. Use environment variables or add after deployment.

---

## Step 3: Submit Sitemaps

After verification:

1. Go to **Sitemaps** in the left menu
2. Enter sitemap URLs one by one:
   - `https://lnkmx.my/sitemap.xml`
   - `https://lnkmx.my/sitemap-index.xml`
3. Click **Submit** for each

### Expected Status
- Status: "Success"
- Discovered URLs: Should match your page count

---

## Step 4: Request Indexing for Key Pages

1. Go to **URL Inspection** tool
2. Enter your priority URLs:
   - `https://lnkmx.my/`
   - `https://lnkmx.my/pricing`
   - `https://lnkmx.my/experts`
   - `https://lnkmx.my/gallery`
   - `https://lnkmx.my/alternatives`
3. Click **"Request Indexing"** for each

> **Note**: Google limits indexing requests. Prioritize most important pages.

---

## Step 5: Monitor Coverage

### Index Coverage Report
Check regularly for:
- **Valid pages**: Successfully indexed
- **Excluded pages**: Review why (intentional vs errors)
- **Errors**: Fix immediately

### Common Issues

| Issue | Solution |
|-------|----------|
| "Submitted URL marked 'noindex'" | Remove noindex meta tag |
| "Redirect error" | Fix redirect chains |
| "Soft 404" | Ensure proper 404 handling |
| "Duplicate without canonical" | Add canonical tags |
| "Crawled - currently not indexed" | Improve content quality |

---

## Step 6: Core Web Vitals

Monitor in **Core Web Vitals** report:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

---

## Step 7: Set Up Alerts

1. Go to **Settings** → **Email preferences**
2. Enable notifications for:
   - Critical issues
   - New crawl errors
   - Manual actions

---

## Ongoing Maintenance

### Weekly
- Check for new crawl errors
- Review excluded pages
- Monitor search performance

### Monthly
- Analyze keyword performance
- Review click-through rates
- Check for manual actions

### After Major Changes
- Resubmit sitemap
- Request indexing for new pages
- Monitor for crawl errors

---

## API Integration (Optional)

For programmatic access:

1. Enable Search Console API in Google Cloud Console
2. Create service account credentials
3. Add service account to GSC property
4. Use API for automated reporting

```javascript
// Example: Fetch indexation status
const { google } = require('googleapis');
const searchconsole = google.searchconsole('v1');

// ... authentication setup ...

const res = await searchconsole.urlInspection.index.inspect({
  requestBody: {
    inspectionUrl: 'https://lnkmx.my/',
    siteUrl: 'sc-domain:lnkmx.my'
  }
});
```

---

## Troubleshooting

### "Property could not be verified"
- Wait for DNS propagation (up to 48h)
- Check DNS record format
- Try alternative verification method

### "Sitemap could not be read"
- Verify sitemap URL is accessible
- Check for XML syntax errors
- Ensure proper Content-Type header

### "URL is not on Google"
- Check robots.txt doesn't block
- Verify canonical URL
- Request indexing manually
- Improve page quality

---

## Security Notes

1. **Never share** verification codes publicly
2. **Limit access** to GSC to trusted team members
3. **Monitor** for unauthorized users
4. **Review** linked services regularly

---

## Resources

- [GSC Help Center](https://support.google.com/webmasters)
- [Search Central Blog](https://developers.google.com/search/blog)
- [URL Inspection API](https://developers.google.com/webmaster-tools/v1/urlInspection.index)

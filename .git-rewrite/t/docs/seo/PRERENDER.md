# Prerender.io Integration for lnkmx.my

## Overview

Prerender.io provides dynamic rendering for SPAs, serving pre-rendered HTML to search engine bots while users get the normal React experience.

---

## IP Addresses Whitelist

### Primary IP Ranges (CIDR /22)

Add these to your WAF/CDN/Firewall allowlist:

```
103.207.40.0/22
104.224.12.0/22
2602:2dd::/36 (IPv6)
```

### Alternative Narrow Ranges (/24)

If your provider doesn't support /22, use these /24 ranges:

```
104.224.12.0/24
104.224.13.0/24
104.224.14.0/24
104.224.15.0/24
103.207.40.0/24
103.207.41.0/24
103.207.42.0/24
103.207.43.0/24
```

### Live IP List (Auto-Updated)

Check monthly for updates:
- **URL**: https://ipranges.prerender.io/ipranges-all.txt

---

## Cloudflare Configuration

### Option 1: WAF Custom Rule (Recommended)

1. Go to **Security → WAF → Custom Rules**
2. Create rule: "Allow Prerender.io"
3. Expression:
```
(ip.src in {103.207.40.0/22 104.224.12.0/22})
```
4. Action: **Skip** (all remaining rules)

### Option 2: IP Access Rules

1. Go to **Security → WAF → Tools → IP Access Rules**
2. Add each IP range with action **Allow**:
   - `103.207.40.0/22` - Allow
   - `104.224.12.0/22` - Allow

### Option 3: Firewall Rules (Legacy)

```
(ip.src in {103.207.40.0/22 104.224.12.0/22}) and (cf.client.bot)
```
Action: Allow

---

## Vercel Configuration

Add to `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Prerender-Token",
          "value": "YOUR_PRERENDER_TOKEN"
        }
      ]
    }
  ]
}
```

For middleware-based integration, see Vercel Edge Middleware docs.

---

## Nginx Configuration

```nginx
# Allow Prerender.io IPs
geo $prerender_ip {
    default 0;
    103.207.40.0/22 1;
    104.224.12.0/22 1;
}

# In server block
location / {
    if ($prerender_ip) {
        # Skip rate limiting / challenges for Prerender
        set $skip_challenge 1;
    }
    # ... rest of config
}
```

---

## Integration Methods

### Method 1: Middleware (Node.js/Express)

```javascript
const prerender = require('prerender-node');

app.use(prerender.set('prerenderToken', 'YOUR_TOKEN'));
```

### Method 2: CDN-Level (Cloudflare Workers)

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const userAgent = request.headers.get('User-Agent') || '';
  const botUserAgents = [
    'googlebot', 'bingbot', 'yandex', 'baiduspider',
    'facebookexternalhit', 'twitterbot', 'linkedinbot',
    'whatsapp', 'slackbot', 'telegrambot', 'applebot'
  ];
  
  const isBot = botUserAgents.some(bot => 
    userAgent.toLowerCase().includes(bot)
  );
  
  if (isBot) {
    const prerenderUrl = `https://service.prerender.io/${request.url}`;
    return fetch(prerenderUrl, {
      headers: {
        'X-Prerender-Token': 'YOUR_TOKEN'
      }
    });
  }
  
  return fetch(request);
}
```

### Method 3: Apache .htaccess

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Prerender.io bot detection
    RewriteCond %{HTTP_USER_AGENT} googlebot|bingbot|yandex|baiduspider|facebookexternalhit|twitterbot|linkedinbot [NC,OR]
    RewriteCond %{HTTP_USER_AGENT} whatsapp|slackbot|telegrambot|applebot [NC]
    RewriteCond %{REQUEST_URI} !^/api/ [NC]
    
    RewriteRule ^(.*)$ https://service.prerender.io/https://lnkmx.my/$1 [P,L]
</IfModule>
```

---

## Bot User-Agents to Detect

```
googlebot
bingbot
yandex
baiduspider
facebookexternalhit
twitterbot
rogerbot
linkedinbot
embedly
quora link preview
showyoubot
outbrain
pinterest
slackbot
vkShare
W3C_Validator
whatsapp
applebot
```

---

## Testing

### Verify Prerender is Working

```bash
# Test with Googlebot UA
curl -A "Googlebot" https://lnkmx.my/ | head -100

# Check if HTML contains rendered content
curl -A "Googlebot" https://lnkmx.my/ | grep -i "<title>"

# Test specific user page
curl -A "Googlebot" https://lnkmx.my/test-user | head -100
```

### Verify IP Whitelist

```bash
# From Prerender's perspective (they should get 200, not 403)
# Check your server logs after Prerender crawls
```

---

## Prerender.io Dashboard Setup

1. Sign up at https://prerender.io
2. Get your **Prerender Token**
3. Add domain: `lnkmx.my`
4. Configure:
   - Cache duration: 24 hours (recommended)
   - Recache on deploy: Enable webhook
   - Sitemap URL: `https://lnkmx.my/sitemap.xml`

---

## Webhook for Cache Invalidation

When a user publishes/unpublishes a page, call:

```bash
POST https://api.prerender.io/recache
Content-Type: application/json
{
  "prerenderToken": "YOUR_TOKEN",
  "url": "https://lnkmx.my/{slug}"
}
```

---

## Monitoring

### Check Prerender Status

- Dashboard: https://prerender.io/dashboard
- Monitor: Cache hits, render times, errors

### Common Issues

| Issue | Solution |
|-------|----------|
| 403 from your server | Whitelist Prerender IPs |
| Timeout | Optimize page load time |
| Stale content | Set up recache webhook |
| Missing pages | Submit sitemap to Prerender |

---

## Security Notes

- Prerender IPs are **static** and safe to whitelist
- Check https://ipranges.prerender.io/ipranges-all.txt monthly
- Never expose Prerender Token in client-side code
- Store token in environment variables

---

## Files Reference

| File | Purpose |
|------|---------|
| `docs/seo/PRERENDER.md` | This documentation |
| `public/robots.txt` | Bot rules |
| `public/sitemap.xml` | Page index for Prerender |

---

## Next Steps

1. ✅ Whitelist IP addresses in CDN/WAF
2. ⬜ Get Prerender.io account and token
3. ⬜ Implement middleware or CDN worker
4. ⬜ Test with `curl -A "Googlebot"`
5. ⬜ Set up recache webhook on publish
6. ⬜ Monitor in Prerender dashboard

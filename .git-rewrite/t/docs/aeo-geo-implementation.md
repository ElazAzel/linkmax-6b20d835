# AEO/GEO Implementation Guide

## Overview

This document describes the Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO) implementation for lnkmx.my user pages.

## Architecture

### Core Components

```
src/lib/seo/
├── index.ts           # Centralized exports
├── answer-block.ts    # Answer block generator
├── auto-faq.ts        # Auto-FAQ generator
├── geo-schemas.ts     # GEO Schema.org generators
├── key-facts.ts       # Key facts extractor
├── entity-linking.ts  # Entity linking (sameAs, knowsAbout)
└── anchors.ts         # Section anchors

src/components/seo/
├── EnhancedSEOHead.tsx       # Meta tags & JSON-LD injection
└── CrawlerFriendlyContent.tsx # Noscript fallback HTML
```

### Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Blocks   │────▶│  SEO Generators  │────▶│   HTML Output   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   JSON-LD Graph  │
                    └──────────────────┘
```

## Features

### 1. Answer Block (AEO)

Generates a 2-4 sentence summary for AI extraction:

```
"{Name} — {role/niche} из {location}. Услуги: {services}. Доступна онлайн-запись."
```

**Implementation:** `src/lib/seo/answer-block.ts`

### 2. Key Facts

Atomic facts for AI citation:

- Name, Role/Specialization
- Location
- Services count and names
- Price range
- Booking availability
- Social links

**Implementation:** `src/lib/seo/key-facts.ts`

### 3. Auto-FAQ

Generates relevant FAQ questions based on:
- Pricing (if available)
- Booking availability
- Service descriptions

**Implementation:** `src/lib/seo/auto-faq.ts`

### 4. GEO Schemas

Combined JSON-LD graph including:
- Person / Organization / LocalBusiness
- ProfilePage / WebPage
- BreadcrumbList
- FAQPage
- Event[]
- Service[]
- HowTo (for booking flow)

**Implementation:** `src/lib/seo/geo-schemas.ts`

## Verification Commands

### Check HTML Source

```bash
curl -s "https://lnkmx.my/{slug}" | grep -E "(answer-block|key-facts|schema-graph)"
```

### Validate JSON-LD

```bash
curl -s "https://lnkmx.my/{slug}" | grep -oP '(?<=<script type="application/ld\+json" id="schema-graph">).*(?=</script>)' | jq .
```

### Lighthouse Audit

```bash
lighthouse https://lnkmx.my/{slug} --only-categories=seo --output=json
```

### Schema Validator

1. Open https://validator.schema.org/
2. Enter page URL
3. Verify all schemas are valid

## Prerender.io Integration

Bot detection and prerendering is handled by the Cloudflare Worker:

**Location:** `cloudflare-worker/prerender-worker.js`

**Supported Bots:**
- Googlebot, Bingbot, Yandex
- ChatGPT-User, GPTBot, PerplexityBot
- Facebook, Twitter, LinkedIn crawlers

## Quality Gate

Pages are indexed only if quality score >= 40:

| Criteria | Points |
|----------|--------|
| 2+ blocks | 20 |
| Profile/Avatar block | 20 |
| Name present | 15 |
| Bio 50+ chars | 20 |
| Value blocks (FAQ, pricing) | 15 |
| Social links | 10 |

**Anti-spam deductions:**
- Blocked domains: -30
- Too many links (new account): -20

## i18n Support

All generators support `ru`, `en`, `kk` languages:

- hreflang tags for each language
- Localized FAQ templates
- Localized fact labels

## Testing

Run SEO tests:

```bash
bun run test src/lib/seo/
```

## Example Output

### Meta Tags

```html
<meta name="description" content="Анна — Психолог из Алматы. Услуги: Консультация, Терапия, Коучинг. Доступна онлайн-запись.">
<meta name="ai-summary" content="Анна — Психолог из Алматы...">
<meta property="og:type" content="profile">
```

### JSON-LD Graph

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://lnkmx.my/anna#main",
      "name": "Анна",
      "jobTitle": "Психолог",
      "knowsAbout": ["Консультация", "Терапия", "Коучинг"]
    },
    {
      "@type": "ProfilePage",
      "mainEntity": { "@id": "https://lnkmx.my/anna#main" }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [...]
    }
  ]
}
```

### Noscript Fallback

```html
<noscript>
  <article itemscope itemtype="https://schema.org/Person">
    <h1 itemprop="name">Анна</h1>
    <section id="answer">
      <p itemprop="description">Анна — Психолог из Алматы...</p>
    </section>
    <section id="key-facts">
      <ul>
        <li><strong>Специализация:</strong> Психолог</li>
        <li><strong>Количество услуг:</strong> 5</li>
      </ul>
    </section>
  </article>
</noscript>
```

## Roadmap

- [ ] Landing page FAQ/HowTo Schema
- [ ] /guides/* content pages
- [ ] /compare/* comparison tables
- [ ] /experts/{niche} directory pages
- [ ] CI/CD schema validation

# Performance Optimization Guide

## Current Performance Status (2026-01-25)

### Target Metrics
- Mobile Performance: >= 90 (Lighthouse)
- Desktop Performance: >= 95 (Lighthouse)
- LCP: <= 2.5s
- INP: <= 200ms
- CLS: <= 0.1
- TBT: <= 200ms

## Implemented Optimizations

### 1. Route-based Code Splitting
All page components are lazy-loaded via `React.lazy()` in `src/main.tsx`:
- Index, Auth, Dashboard, PublicPage, Gallery, Pricing, etc.
- Reduces initial bundle size significantly

### 2. Font Loading Optimization
Located in `index.html`:
- Using `font-display: swap` for non-blocking font loading
- Preconnect to `fonts.googleapis.com` and `fonts.gstatic.com`
- Critical inline CSS for font fallback

### 3. Resource Hints
- `preconnect` for Supabase API
- `dns-prefetch` for AI gateway
- Properly ordered link tags

### 4. PWA Caching Strategy
Configured in `vite.config.ts`:
- StaleWhileRevalidate for app files (24h)
- CacheFirst for Google Fonts (7 days)
- NetworkFirst for Supabase API (5 min)
- Image caching (24h, max 100 entries)

### 5. Image Optimization Best Practices
- Use `loading="lazy"` for below-fold images
- Use `decoding="async"` for non-critical images
- Provide width/height to prevent CLS
- Use modern formats (WebP/AVIF) where possible

### 6. Animation Performance
All animations use GPU-accelerated properties:
- `transform` and `opacity` only
- `will-change` hints where needed
- Respects `prefers-reduced-motion`

## Performance Monitoring

### Runtime Web Vitals
The `usePerformanceMonitor` hook (`src/hooks/usePerformanceMonitor.ts`) provides:
- Async/sync operation timing
- Slow operation detection (> 500ms)
- Performance statistics

### Usage
```typescript
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';

const { measureAsync, getStats } = usePerformanceMonitor();

// Measure async operations
const data = await measureAsync('fetchPageData', 'query', () => 
  supabase.from('pages').select('*')
);
```

## Known Issues & Solutions

### Multiple Redirects
- Canonical URL structure: `https://lnkmx.my/{slug}`
- No trailing slash redirects
- Single canonical domain

### LCP Optimization
- Hero section uses text as LCP element (fast)
- Background animations are GPU-accelerated
- No blocking resources above fold

## Local Testing Commands

```bash
# Build and preview
npm run build && npm run preview

# Lighthouse CLI (requires lighthouse installed)
lighthouse http://localhost:4173 --view --preset=desktop
lighthouse http://localhost:4173 --view --preset=mobile
```

## Monitoring Checklist

- [ ] Check Lighthouse scores weekly
- [ ] Monitor Core Web Vitals in Search Console
- [ ] Review bundle size after major changes
- [ ] Test on real mobile devices periodically

# Key page dependency trees

## / (Commercial landing)
Entry: `src/pages/Index.tsx`

Dependencies:
- `src/components/landing/v2/DynamicIslandNav.tsx`
  - `src/components/ui/button.tsx`
  - `src/components/ui/dropdown-menu.tsx`
  - `src/components/ui/sheet.tsx`
  - `src/components/ui/switch.tsx`
  - `src/components/ui/tooltip.tsx`
  - `src/components/landing/LanguageSwitcher.tsx`
  - `src/components/theme/ThemeToggle.tsx`
- `src/components/landing/v3/HeroBentoOS.tsx`
  - `src/components/ui/button.tsx`
  - `src/lib/utils/slug.ts`
- `src/components/landing/v2/LogoTicker.tsx`
- `src/components/landing/v2/FAQSection.tsx`
  - `src/components/ui/accordion.tsx`
- `src/components/landing/SEOLandingHead.tsx`
  - `src/lib/utils/url-helpers.ts`
- `src/components/seo/SEOMetaEnhancer.tsx`
- `src/components/seo/GEOTagging.tsx`
- `src/components/seo/AEOOptimizer.tsx`
- `src/components/seo/AISearchOptimizer.tsx`
- `src/components/dashboard-v2/common/ScreenErrorBoundary.tsx`
- `src/hooks/analytics/useLandingAnalytics.ts`
- `src/hooks/analytics/useMarketingAnalytics.ts`
- `src/components/ui/button.tsx`
- `src/lib/utils/url-helpers.ts`

## /dashboard (Authenticated revenue home)
Entry: `src/pages/DashboardV2.tsx`

Dependencies:
- `src/components/dashboard-v2/DashboardV2Shell.tsx`
- `src/components/dashboard-v2/screens/HomeScreen.tsx`
  - `src/components/dashboard-v2/revenue/OutcomeHome.tsx`
    - `src/components/dashboard-v2/revenue/OutcomeStrip.tsx`
    - `src/components/dashboard-v2/revenue/NextRevenueAction.tsx`
    - `src/components/dashboard-v2/revenue/AttentionQueue.tsx`
  - `src/hooks/revenue/useRevenueOutcomeSummary.ts`
- `src/components/dashboard-v2/screens/ActivityScreen.tsx`
- `src/components/dashboard-v2/screens/InsightsScreen.tsx`

## /auth
Entry: `src/pages/Auth.tsx`

Dependencies:
- `src/components/screens/Auth.tsx`
- shared form, button, input, card and authentication helpers.

## /pricing
Entry: `src/pages/Pricing.tsx`

Dependencies:
- `src/components/landing/SimplePricingSection.tsx`
- `src/domain/billing/catalog.ts`
- shared Button and marketing navigation components.

## /:slug (Published customer page)
Entry: `src/pages/PublicPage.tsx`

Dependencies:
- block renderer pipeline under `src/components/blocks/`
- public booking flow under `src/components/booking/`
- page theme and SEO components.


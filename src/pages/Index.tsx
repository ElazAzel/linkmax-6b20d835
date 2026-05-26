import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCallback, lazy, Suspense } from 'react';
import { useLandingAnalytics, useSectionObserver } from '@/hooks/analytics/useLandingAnalytics';
import { useMarketingAnalytics } from '@/hooks/analytics/useMarketingAnalytics';
import { SEOLandingHead } from '@/components/landing/SEOLandingHead';

import { getAppDomain } from '@/lib/utils/url-helpers';

// Critical above-fold components - load eagerly
import { HeroBentoOS } from '@/components/landing/v3/HeroBentoOS';
import { DynamicIslandNav } from '@/components/landing/v2/DynamicIslandNav';

// Below-fold & non-critical components - lazy loaded
const SEOMetaEnhancer = lazy(() => import('@/components/seo/SEOMetaEnhancer').then(m => ({ default: m.SEOMetaEnhancer })));
const GEOTagging = lazy(() => import('@/components/seo/GEOTagging').then(m => ({ default: m.GEOTagging })));
const AEOOptimizer = lazy(() => import('@/components/seo/AEOOptimizer').then(m => ({ default: m.AEOOptimizer })));
const AISearchOptimizer = lazy(() => import('@/components/seo/AISearchOptimizer').then(m => ({ default: m.AISearchOptimizer })));
const LogoTicker = lazy(() => import('@/components/landing/v2/LogoTicker').then(m => ({ default: m.LogoTicker })));
const BentoGridSection = lazy(() => import('@/components/landing/v2/BentoGridSection').then(m => ({ default: m.BentoGridSection })));
const InteractiveDemo = lazy(() => import('@/components/landing/v2/InteractiveDemo').then(m => ({ default: m.InteractiveDemo })));
const Testimonials = lazy(() => import('@/components/landing/v2/Testimonials').then(m => ({ default: m.Testimonials })));
const PricingAurora = lazy(() => import('@/components/landing/v2/PricingAurora').then(m => ({ default: m.PricingAurora })));
const PremiumFooter = lazy(() => import('@/components/landing/v2/PremiumFooter').then(m => ({ default: m.PremiumFooter })));
const BottomCTA = lazy(() => import('@/components/landing/v2/BottomCTA').then(m => ({ default: m.BottomCTA })));
const RevenueCalculator = lazy(() => import('@/components/landing/v2/RevenueCalculator').then(m => ({ default: m.RevenueCalculator })));
const ComparisonTable = lazy(() => import('@/components/landing/v2/ComparisonTable').then(m => ({ default: m.ComparisonTable })));
const FAQSection = lazy(() => import('@/components/landing/v2/FAQSection').then(m => ({ default: m.FAQSection })));
const StickyMobileCTA = lazy(() => import('@/components/landing/v2/StickyMobileCTA').then(m => ({ default: m.StickyMobileCTA })));
const GrainOverlay = lazy(() => import('@/components/landing/v2/GrainOverlay').then(m => ({ default: m.GrainOverlay })));
const LiquidCursor = lazy(() => import('@/components/landing/v2/LiquidCursor').then(m => ({ default: m.LiquidCursor })));
const CanvasBackground = lazy(() => import('@/components/ui/CanvasBackground').then(m => ({ default: m.CanvasBackground })));

/**
 * Landing Page Index
 * Premium "Living Canvas" aesthetic refresh.
 */
export default function Index() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const { trackSectionView, trackCtaClick } = useLandingAnalytics();
  const { trackMarketingEvent, trackOnce } = useMarketingAnalytics();

  type CtaType = 'create' | 'gallery' | 'pricing' | 'signup' | 'login';

  // Method to handle navigation and tracking
  const handleNav = useCallback((path: string, ctaType: CtaType, location: string) => {
    trackCtaClick(ctaType, location);
    navigate(path);
  }, [navigate, trackCtaClick]);

  const handleCreatePage = useCallback((location: string, ctaType: 'signup' | 'pricing' = 'signup') => {
    trackMarketingEvent({ eventType: 'signup_from_landing', metadata: { location, ctaType } });
    handleNav('/auth', ctaType, location);
  }, [handleNav, trackMarketingEvent]);

  // Analytics observers
  const trackMarketingSection = useCallback(
    (sectionId: string) => {
      trackSectionView(sectionId);
      if (sectionId === 'how_it_works') trackOnce({ eventType: 'how_it_works_view' });
      if (sectionId === 'pricing') trackOnce({ eventType: 'pricing_view' });
    },
    [trackOnce, trackSectionView]
  );

  const heroSectionRef = useSectionObserver<HTMLDivElement>('hero', trackMarketingSection);
  const featuresSectionRef = useSectionObserver<HTMLDivElement>('features', trackMarketingSection);
  const demoSectionRef = useSectionObserver<HTMLDivElement>('demo', trackMarketingSection);
  const pricingSectionRef = useSectionObserver<HTMLDivElement>('pricing', trackMarketingSection);

  return (
    <>
      <SEOLandingHead currentLanguage={i18n.language} />
      <Suspense fallback={null}>
        <SEOMetaEnhancer
          pageUrl={`${getAppDomain()}/`}
          pageTitle={t('landing.v4.hero.title', 'LinkMAX - Ваша Бизнес-ОС')}
          pageDescription={t('landing.v4.hero.subtitle', 'Замените 10 сервисов одним. Сайт, CRM и финансы для экспертов.')}
          imageUrl={`${getAppDomain()}/og-image.png`}
          imageAlt="LinkMAX"
          type="website"
        />
        <GEOTagging includeOrganization={true} />
        <AEOOptimizer pageUrl={`${getAppDomain()}/`} type="howto" />
        <AISearchOptimizer pageType="homepage" entityName="LinkMAX" entityCategory="SaaS" />
      </Suspense>

      <div className="bg-[#fafbfc] min-h-screen text-foreground selection:bg-blue-100 selection:text-blue-600 relative overflow-x-hidden">
        <DynamicIslandNav
          onLogin={() => handleNav('/auth', 'login', 'nav_login')}
          onSignup={() => handleCreatePage('nav_signup')}
        />

        <main className="flex-grow">
          <div id="hero" ref={heroSectionRef}>
            <HeroBentoOS
              onStart={() => handleCreatePage('hero_cta')}
              onExamples={() => handleNav('/gallery', 'gallery', 'hero_examples')}
            />
          </div>


          <Suspense fallback={<div className="h-20" />}>
            <LogoTicker />
          </Suspense>

          <div ref={featuresSectionRef}>
            <Suspense fallback={<div className="h-96" />}>
              <BentoGridSection />
            </Suspense>
          </div>

          <div id="demo" ref={demoSectionRef} className="relative z-0">
            <Suspense fallback={<div className="h-96" />}>
              <InteractiveDemo />
            </Suspense>
          </div>

          <Suspense fallback={<div className="h-96" />}>
            <ComparisonTable />
          </Suspense>

          <Suspense fallback={<div className="h-96" />}>
            <RevenueCalculator />
          </Suspense>

          <div ref={pricingSectionRef} className="relative z-20 bg-transparent">
            <Suspense fallback={<div className="h-96" />}>
              <Testimonials />
            </Suspense>

            <Suspense fallback={<div className="h-96" />}>
              <PricingAurora onPlanSelect={(plan) => handleCreatePage(`pricing_${plan}`, 'pricing')} />
            </Suspense>
          </div>

          <Suspense fallback={<div className="h-96" />}>
            <FAQSection />
          </Suspense>

          <Suspense fallback={<div className="h-40" />}>
            <BottomCTA />
          </Suspense>
        </main>

        <Suspense fallback={<div className="h-40" />}>
          <PremiumFooter />
        </Suspense>

        <Suspense fallback={null}>
          <StickyMobileCTA />
        </Suspense>
      </div>
    </>
  );
}

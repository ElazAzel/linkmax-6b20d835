import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCallback, lazy, Suspense } from 'react';
import { useLandingAnalytics, useSectionObserver } from '@/hooks/analytics/useLandingAnalytics';
import { useMarketingAnalytics } from '@/hooks/analytics/useMarketingAnalytics';
import { SEOLandingHead } from '@/components/landing/SEOLandingHead';
import { useIsMobile } from '@/hooks/ui/use-mobile';

// Critical above-fold components - load eagerly
import { HeroSection } from '@/components/landing/v2/HeroSection';
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
const GrainOverlay = lazy(() => import('@/components/landing/v2/GrainOverlay').then(m => ({ default: m.GrainOverlay })));
const LiquidCursor = lazy(() => import('@/components/landing/v2/LiquidCursor').then(m => ({ default: m.LiquidCursor })));

export default function Index() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isMobile = useIsMobile();
  const { trackSectionView, trackCtaClick } = useLandingAnalytics();
  const { trackMarketingEvent, trackOnce } = useMarketingAnalytics();

  // Method to handle navigation and tracking
  const handleNav = useCallback((path: string, section: string) => {
    trackCtaClick(section as 'create' | 'gallery' | 'pricing' | 'signup', path);
    navigate(path);
  }, [navigate, trackCtaClick]);

  const handleCreatePage = useCallback((location: string) => {
    trackMarketingEvent({ eventType: 'signup_from_landing', metadata: { location } });
    handleNav('/auth', location);
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

  useSectionObserver('hero', trackMarketingSection);
  useSectionObserver('features', trackMarketingSection);
  useSectionObserver('demo', trackMarketingSection);
  useSectionObserver('pricing', trackMarketingSection);

  return (
    <>
      {/* SEO & Meta Tags */}
      <SEOLandingHead currentLanguage={i18n.language} />
      <Suspense fallback={null}>
        <SEOMetaEnhancer
          pageUrl="https://lnkmx.my/"
          pageTitle={t('landing.v4.hero.title', 'Build pages that convert')}
          pageDescription={t('landing.v4.hero.subtitle', 'The all-in-one platform for creators. AI builds the structure, you get the leads.')}
          imageUrl="https://lnkmx.my/og-image.png"
          imageAlt="lnkmx - AI Page Builder"
          type="website"
        />
        <GEOTagging includeOrganization={true} />
        <AEOOptimizer
          pageUrl="https://lnkmx.my/"
          type="howto"
          howToName={t('landing.v4.seo.howToName', 'How to build a landing page with AI')}
          howToDescription={t('landing.v4.seo.howToDesc', 'Create a professional page in 2 minutes')}
          howToSteps={[]}
        />
        <AISearchOptimizer
          pageType="homepage"
          primaryQuestion={t('landing.v4.seo.question', 'What is lnkmx?')}
          primaryAnswer={t('landing.v4.seo.answer', 'lnkmx is an AI-powered page builder for creators.')}
          entityName="lnkmx"
          entityCategory="SaaS"
        />
      </Suspense>

      <div className="bg-background min-h-screen text-foreground selection:bg-primary/30 relative" style={{ overflowX: 'clip' }}>

        {/* PREMIUM LAYERS - lazy loaded, skip LiquidCursor on mobile */}
        <Suspense fallback={null}>
          <GrainOverlay />
          {!isMobile && <LiquidCursor />}
        </Suspense>
        <DynamicIslandNav
          onLogin={() => handleNav('/auth', 'nav_login')}
          onSignup={() => handleCreatePage('nav_signup')}
        />

        <div id="hero">
          <HeroSection
            onStart={() => handleCreatePage('hero_cta')}
            onExamples={() => handleNav('/gallery', 'hero_examples')}
          />
        </div>

        <Suspense fallback={<div className="h-20" />}>
          <LogoTicker />
        </Suspense>

        <div id="features">
          <Suspense fallback={<div className="h-96" />}>
            <BentoGridSection />
          </Suspense>
        </div>

        <div id="demo" className="relative z-0">
          <Suspense fallback={<div className="h-96" />}>
            <InteractiveDemo />
          </Suspense>
        </div>

        <div className="relative z-20 bg-background">
          <Suspense fallback={<div className="h-96" />}>
            <Testimonials />
          </Suspense>

          <div id="pricing">
            <Suspense fallback={<div className="h-96" />}>
              <PricingAurora onPlanSelect={(plan) => handleCreatePage(`pricing_${plan}`)} />
            </Suspense>
          </div>

          {/* Footer */}
          <Suspense fallback={<div className="h-40" />}>
            <PremiumFooter />
          </Suspense>
        </div>

      </div>
    </>
  );
}

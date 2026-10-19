import { lazy, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@/lib/router-compat';

import { KxHeader } from '@/components/landing/kx/KxHeader';
import { KxHero } from '@/components/landing/kx/KxHero';
import { KxBuild, KxCta, KxFaq, KxFooter, KxPricing, KxSteps } from '@/components/landing/kx/KxSections';
import { SEOLandingHead } from '@/components/landing/SEOLandingHead';
import { ScreenErrorBoundary } from '@/components/dashboard-v2/common/ScreenErrorBoundary';
import { useLandingAnalytics, useSectionObserver } from '@/hooks/analytics/useLandingAnalytics';
import { useMarketingAnalytics } from '@/hooks/analytics/useMarketingAnalytics';
import { getAppDomain } from '@/lib/utils/url-helpers';

const SEOMetaEnhancer = lazy(() => import('@/components/seo/SEOMetaEnhancer').then((module) => ({ default: module.SEOMetaEnhancer })));
const GEOTagging = lazy(() => import('@/components/seo/GEOTagging').then((module) => ({ default: module.GEOTagging })));
const AEOOptimizer = lazy(() => import('@/components/seo/AEOOptimizer').then((module) => ({ default: module.AEOOptimizer })));
const AISearchOptimizer = lazy(() => import('@/components/seo/AISearchOptimizer').then((module) => ({ default: module.AISearchOptimizer })));

const LANDING_SCREEN_NAME = 'Index';
const LANDING_AEO_TYPE = 'howto';
const LANDING_PAGE_TYPE = 'homepage';
const LANDING_ENTITY_CATEGORY = 'SaaS';

type CtaType = 'create' | 'gallery' | 'pricing' | 'signup' | 'login';

export default function Index() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { trackSectionView, trackCtaClick } = useLandingAnalytics();
  const { trackMarketingEvent, trackOnce } = useMarketingAnalytics();
  const seoImageAlt = t('landing.revenue.seo.imageAlt', 'LinkMAX — путь клиента по одной ссылке');

  const handleNav = useCallback((path: string, ctaType: CtaType, location: string) => {
    trackCtaClick(ctaType, location);
    navigate(path);
  }, [navigate, trackCtaClick]);

  const handleCreatePage = useCallback((location: string, ctaType: 'signup' | 'pricing' = 'signup', desiredSlug?: string) => {
    const cleanDesiredSlug = typeof desiredSlug === 'string' ? desiredSlug : undefined;
    trackMarketingEvent({
      eventType: 'signup_from_landing',
      metadata: { location, ctaType, desiredSlug: cleanDesiredSlug },
    });

    if (!cleanDesiredSlug) {
      handleNav('/auth', ctaType, location);
      return;
    }

    const params = new URLSearchParams({ mode: 'signup', from: 'landing', slug: cleanDesiredSlug });
    handleNav(`/auth?${params.toString()}`, ctaType, location);
  }, [handleNav, trackMarketingEvent]);

  const trackMarketingSection = useCallback((sectionId: string) => {
    trackSectionView(sectionId);
    trackMarketingEvent({
      eventType: 'landing_view',
      metadata: { sectionId, timestamp: Date.now() },
    });
    if (sectionId === 'revenue_flow') {
      trackOnce({ eventType: 'how_it_works_view' });
    }
  }, [trackMarketingEvent, trackOnce, trackSectionView]);

  const heroSectionRef = useSectionObserver<HTMLDivElement>('hero', trackMarketingSection);
  const revenueSectionRef = useSectionObserver<HTMLDivElement>('revenue_flow', trackMarketingSection);
  const faqSectionRef = useSectionObserver<HTMLDivElement>('faq', trackMarketingSection);

  return (
    <ScreenErrorBoundary screenName={LANDING_SCREEN_NAME}>
      <SEOLandingHead currentLanguage={i18n.language} />
      <Suspense fallback={null}>
        <SEOMetaEnhancer
          pageUrl={`${getAppDomain()}/`}
          pageTitle={t('landing.revenue.seo.title', 'LinkMAX — страница, запись, оплата и работа с клиентами')}
          pageDescription={t('landing.revenue.seo.description', 'Одна ссылка для сервисного бизнеса: покажите предложение, примите запись или заявку, зафиксируйте оплату и не потеряйте следующий шаг по клиенту.')}
          imageUrl={`${getAppDomain()}/og-image.png`}
          imageAlt={seoImageAlt}
          type="website"
        />
        <GEOTagging includeOrganization />
        <AEOOptimizer pageUrl={`${getAppDomain()}/`} type={LANDING_AEO_TYPE} />
        <AISearchOptimizer pageType={LANDING_PAGE_TYPE} entityName={seoImageAlt} entityCategory={LANDING_ENTITY_CATEGORY} />
      </Suspense>

      <div className="kx min-h-screen">
        <KxHeader
          onLogin={() => handleNav('/auth', 'login', 'nav_login')}
          onSignup={() => handleCreatePage('nav_signup')}
        />

        <main>
          <div id="hero" ref={heroSectionRef}>
            <KxHero onStart={(desiredSlug) => handleCreatePage('hero_cta', 'signup', desiredSlug)} />
          </div>

          <div ref={revenueSectionRef}>
            <KxBuild />
            <KxSteps />
            <KxPricing
              onStart={() => handleCreatePage('pricing_free_cta')}
              onPricing={() => handleNav('/pricing', 'pricing', 'landing_pricing_cta')}
            />
          </div>

          <div ref={faqSectionRef}>
            <KxFaq />
          </div>

          <KxCta onStart={(desiredSlug) => handleCreatePage('final_cta', 'signup', desiredSlug)} />
        </main>

        <KxFooter />
      </div>
    </ScreenErrorBoundary>
  );
}

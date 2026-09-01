import { lazy, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { DynamicIslandNav } from '@/components/landing/v2/DynamicIslandNav';
import { FAQSection } from '@/components/landing/v2/FAQSection';
import { LogoTicker } from '@/components/landing/v2/LogoTicker';
import { HeroBentoOS } from '@/components/landing/v3/HeroBentoOS';
import { RevenueLandingSections } from '@/components/landing/RevenueLandingSections';
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

      <div className="min-h-screen overflow-x-hidden bg-[#f6f6f1] text-[#101318] selection:bg-[#ff5701] selection:text-white">
        <DynamicIslandNav
          onLogin={() => handleNav('/auth', 'login', 'nav_login')}
          onSignup={() => handleCreatePage('nav_signup')}
        />

        <main>
          <div id="hero" ref={heroSectionRef}>
            <HeroBentoOS
              onStart={(desiredSlug) => handleCreatePage('hero_cta', 'signup', desiredSlug)}
              onExamples={() => handleNav('/gallery', 'gallery', 'hero_examples')}
            />
          </div>

          <div className="relative z-10 border-b border-[#ded9c9] bg-white">
            <LogoTicker />
          </div>

          <div ref={revenueSectionRef}>
            <RevenueLandingSections
              onStart={() => handleCreatePage('revenue_flow_cta')}
              onPricing={() => handleNav('/pricing', 'pricing', 'revenue_pricing_cta')}
            />
          </div>

          <div ref={faqSectionRef}>
            <FAQSection />
          </div>
        </main>

        <SimpleFooter />
      </div>
    </ScreenErrorBoundary>
  );
}

function SimpleFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#f6f6f1] px-4 pb-8 pt-4 text-center text-xs text-[#62675f] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-[#ded9c9] pt-5">
        <span>{t('landing.short.footer.copyright', '© {{year}} LinkMAX', { year })}</span>
        <a href="/privacy" className="hover:text-[#101318]">{t('landing.short.footer.privacy', 'Privacy')}</a>
        <a href="/terms" className="hover:text-[#101318]">{t('landing.short.footer.terms', 'Terms')}</a>
        <a href="/payment-terms" className="hover:text-[#101318]">{t('landing.short.footer.payments', 'Payments')}</a>
      </div>
    </footer>
  );
}

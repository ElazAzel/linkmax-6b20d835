import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from '@/lib/router-compat';

import { KxHeader } from '@/components/landing/kx/KxHeader';
import { KxHero } from '@/components/landing/kx/KxHero';
import { KxBuild, KxCta, KxFaq, KxFooter, KxPricing, KxSteps } from '@/components/landing/kx/KxSections';
import { SEOLandingHead } from '@/components/landing/SEOLandingHead';
import { ScreenErrorBoundary } from '@/components/dashboard-v2/common/ScreenErrorBoundary';
import { useLandingAnalytics, useSectionObserver } from '@/hooks/analytics/useLandingAnalytics';
import { useMarketingAnalytics } from '@/hooks/analytics/useMarketingAnalytics';

type CtaType = 'create' | 'gallery' | 'pricing' | 'signup' | 'login';

export default function Index() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { trackSectionView, trackCtaClick } = useLandingAnalytics();
  const { trackMarketingEvent, trackOnce } = useMarketingAnalytics();

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
    <ScreenErrorBoundary screenName="Index">
      <SEOLandingHead currentLanguage={i18n.language} />

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

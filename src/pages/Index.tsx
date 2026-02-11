import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect } from 'react';
import { useLandingAnalytics, useSectionObserver } from '@/hooks/useLandingAnalytics';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';
import { SEOLandingHead } from '@/components/landing/SEOLandingHead';
import { SEOMetaEnhancer } from '@/components/seo/SEOMetaEnhancer';
import { GEOTagging } from '@/components/seo/GEOTagging';
import { AEOOptimizer } from '@/components/seo/AEOOptimizer';
import { AISearchOptimizer } from '@/components/seo/AISearchOptimizer';

// v2 Components
import { HeroSection } from '@/components/landing/v2/HeroSection';
import { LogoTicker } from '@/components/landing/v2/LogoTicker';
import { BentoGridSection } from '@/components/landing/v2/BentoGridSection';
import { InteractiveDemo } from '@/components/landing/v2/InteractiveDemo';
import { Testimonials } from '@/components/landing/v2/Testimonials';
import { PricingAurora } from '@/components/landing/v2/PricingAurora';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export default function Index() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { trackSectionView, trackCtaClick } = useLandingAnalytics();
  const { trackMarketingEvent, trackOnce } = useMarketingAnalytics();

  // Method to handle navigation and tracking
  const handleNav = useCallback((path: string, section: string) => {
    trackCtaClick(section, path);
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
        howToName="How to build a landing page with AI"
        howToDescription="Create a professional page in 2 minutes"
        howToSteps={[]}
      />
      <AISearchOptimizer
        pageType="homepage"
        primaryQuestion="What is lnkmx?"
        primaryAnswer="lnkmx is an AI-powered page builder for creators."
        entityName="lnkmx"
        entityCategory="SaaS"
      />

      <div className="bg-background min-h-screen text-foreground overflow-x-hidden selection:bg-primary/30">

        {/* Navbar Overlay */}
        <nav className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center pointer-events-none">
          <div className="pointer-events-auto bg-background/5 p-2 rounded-xl backdrop-blur-md">
            <span className="text-xl font-black tracking-tighter px-2">lnk<span className="text-primary">mx</span></span>
          </div>
          <div className="pointer-events-auto flex items-center gap-2 bg-background/5 p-1.5 rounded-xl backdrop-blur-md">
            <LanguageSwitcher />
            <Button size="sm" variant="ghost" onClick={() => handleNav('/auth', 'nav_login')}>Login</Button>
            <Button size="sm" onClick={() => handleCreatePage('nav_signup')}>Get Started</Button>
          </div>
        </nav>

        <div id="hero">
          <HeroSection
            onStart={() => handleCreatePage('hero_cta')}
            onExamples={() => handleNav('/gallery', 'hero_examples')}
          />
        </div>

        <LogoTicker />

        <div id="features">
          <BentoGridSection />
        </div>

        <div id="demo">
          <InteractiveDemo />
        </div>

        <Testimonials />

        <div id="pricing">
          <PricingAurora onPlanSelect={(plan) => handleCreatePage(`pricing_${plan}`)} />
        </div>

        {/* Footer */}
        <footer className="py-12 border-t border-border/10 bg-background/50 backdrop-blur-sm relative z-10">
          <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
            <div className="flex justify-center gap-6 mb-8 font-medium">
              <button onClick={() => handleNav('/privacy', 'footer')} className="hover:text-foreground transition-colors">Privacy</button>
              <button onClick={() => handleNav('/terms', 'footer')} className="hover:text-foreground transition-colors">Terms</button>
              <button onClick={() => handleNav('/contact', 'footer')} className="hover:text-foreground transition-colors">Contact</button>
            </div>
            <p>&copy; {new Date().getFullYear()} lnkmx. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </>
  );
}

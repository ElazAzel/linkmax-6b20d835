'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { useLandingAnalytics, useSectionObserver } from '@/hooks/useLandingAnalytics';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';

// SEO components (Client side logic kept for legacy/dynamic updates)
import { SEOLandingHead } from '@/components/landing/SEOLandingHead';
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
import { PremiumFooter } from '@/components/landing/v2/PremiumFooter';
import { GrainOverlay } from '@/components/landing/v2/GrainOverlay';
import { DynamicIslandNav } from '@/components/landing/v2/DynamicIslandNav';
import { LiquidCursor } from '@/components/landing/v2/LiquidCursor';

export default function LandingClient() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const { trackSectionView, trackCtaClick } = useLandingAnalytics();
    const { trackMarketingEvent, trackOnce } = useMarketingAnalytics();

    // Method to handle navigation and tracking
    const handleNav = useCallback((path: string, section: string) => {
        trackCtaClick(section as 'create' | 'gallery' | 'pricing' | 'signup', path);
        router.push(path);
    }, [router, trackCtaClick]);

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
            <SEOLandingHead currentLanguage={i18n.language} />
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

            <div className="bg-background min-h-screen text-foreground selection:bg-primary/30 relative" style={{ overflowX: 'clip' }}>

                {/* PREMIUM LAYERS */}
                <GrainOverlay />
                <LiquidCursor />
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

                <LogoTicker />

                <div id="features">
                    <BentoGridSection />
                </div>

                <div id="demo" className="relative z-0">
                    <InteractiveDemo />
                </div>

                <div className="relative z-20 bg-background">
                    <Testimonials />

                    <div id="pricing">
                        <PricingAurora onPlanSelect={(plan) => handleCreatePage(`pricing_${plan}`)} />
                    </div>

                    {/* Footer */}
                    <PremiumFooter />
                </div>

            </div>
        </>
    );
}

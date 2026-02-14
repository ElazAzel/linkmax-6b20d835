/**
 * Landing Page v5.0 - Complete Redesign
 * Human-centric copywriting, conversion optimized, SEO/AIO ready
 * Mobile-first, performance focused
 */
import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLandingAnalytics } from '@/hooks/useLandingAnalytics';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';
import { Sparkles } from 'lucide-react';

// Critical sections - eager load for LCP
import HeroSection from '@/components/landing-v5/HeroSection';
import ProblemSolutionSection from '@/components/landing-v5/ProblemSolutionSection';
import NavBar from '@/components/landing-v5/NavBar';
import SEOHead from '@/components/landing-v5/SEOHead';

// Lazy load below-the-fold sections for performance
const HowItWorksSection = lazy(() => import('@/components/landing-v5/HowItWorksSection'));
const ResultsSection = lazy(() => import('@/components/landing-v5/ResultsSection'));
const BlocksShowcaseSection = lazy(() => import('@/components/landing-v5/BlocksShowcaseSection'));
const ExamplesGallerySection = lazy(() => import('@/components/landing-v5/ExamplesGallerySection'));
const TrustSection = lazy(() => import('@/components/landing-v5/TrustSection'));
const PricingSection = lazy(() => import('@/components/landing-v5/PricingSection'));
const SEOExplainerSection = lazy(() => import('@/components/landing-v5/SEOExplainerSection'));
const FAQSection = lazy(() => import('@/components/landing-v5/FAQSection'));
const FinalCTASection = lazy(() => import('@/components/landing-v5/FinalCTASection'));
const FooterSection = lazy(() => import('@/components/landing-v5/FooterSection'));

// Skeleton for lazy sections
function SectionSkeleton({ height = 'py-16' }: { height?: string }) {
  return (
    <div className={cn("px-5", height)}>
      <div className="max-w-xl mx-auto space-y-4">
        <div className="h-6 bg-muted/40 rounded-full w-24 mx-auto" />
        <div className="h-8 bg-muted/50 rounded-lg w-2/3 mx-auto" />
        <div className="h-4 bg-muted/30 rounded w-full" />
        <div className="h-4 bg-muted/30 rounded w-4/5" />
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="h-24 bg-muted/40 rounded-xl" />
          <div className="h-24 bg-muted/40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export default function LandingV5() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const { trackCtaClick } = useLandingAnalytics();
  const { trackMarketingEvent } = useMarketingAnalytics();

  // Scroll handler for floating CTA
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCta(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation handlers
  const handleCreatePage = useCallback((location: string) => {
    trackCtaClick('create', location);
    trackMarketingEvent({ eventType: 'signup_from_landing', metadata: { location } });
    navigate('/auth');
  }, [navigate, trackCtaClick, trackMarketingEvent]);

  const handleViewExamples = useCallback((location: string) => {
    trackCtaClick('gallery', location);
    navigate('/gallery');
  }, [navigate, trackCtaClick]);

  const handleViewPricing = useCallback((location: string) => {
    trackCtaClick('pricing', location);
    navigate('/pricing');
  }, [navigate, trackCtaClick]);

  const isKZ = i18n.language === 'ru' || i18n.language === 'kk';

  return (
    <>
      <SEOHead language={i18n.language} />
      
      <div className="min-h-screen bg-background overflow-x-hidden">
        {/* Navigation - Critical */}
        <NavBar 
          onCreatePage={() => handleCreatePage('nav')}
          onViewExamples={() => handleViewExamples('nav')}
        />

        {/* Main content */}
        <main>
          {/* 1. HERO - Critical for LCP */}
          <HeroSection 
            onCreatePage={() => handleCreatePage('hero')}
            onViewExamples={() => handleViewExamples('hero')}
          />

          {/* 2. PROBLEM → SOLUTION - Critical */}
          <ProblemSolutionSection />

          {/* 3. HOW IT WORKS (3 steps) */}
          <Suspense fallback={<SectionSkeleton />}>
            <HowItWorksSection 
              onCreatePage={() => handleCreatePage('how_it_works')}
            />
          </Suspense>

          {/* 4. RESULTS / USE CASES */}
          <Suspense fallback={<SectionSkeleton />}>
            <ResultsSection 
              onCreatePage={() => handleCreatePage('results')}
            />
          </Suspense>

          {/* 5. BLOCKS SHOWCASE */}
          <Suspense fallback={<SectionSkeleton height="py-12" />}>
            <BlocksShowcaseSection />
          </Suspense>

          {/* 6. EXAMPLES GALLERY */}
          <Suspense fallback={<SectionSkeleton />}>
            <ExamplesGallerySection 
              onViewAll={() => handleViewExamples('gallery')}
            />
          </Suspense>

          {/* 7. TRUST / PROOF */}
          <Suspense fallback={<SectionSkeleton height="py-12" />}>
            <TrustSection />
          </Suspense>

          {/* 8. PRICING */}
          <Suspense fallback={<SectionSkeleton />}>
            <PricingSection 
              isKZ={isKZ}
              onSelectFree={() => handleCreatePage('pricing_free')}
              onSelectPro={() => handleViewPricing('pricing_pro')}
            />
          </Suspense>

          {/* 9. SEO EXPLAINER (AI-friendly) */}
          <Suspense fallback={<SectionSkeleton height="py-12" />}>
            <SEOExplainerSection />
          </Suspense>

          {/* 10. FAQ */}
          <Suspense fallback={<SectionSkeleton />}>
            <FAQSection />
          </Suspense>

          {/* 11. FINAL CTA */}
          <Suspense fallback={<SectionSkeleton height="py-16" />}>
            <FinalCTASection 
              onCreatePage={() => handleCreatePage('final_cta')}
              onViewExamples={() => handleViewExamples('final_cta')}
            />
          </Suspense>
        </main>

        {/* 12. FOOTER */}
        <Suspense fallback={null}>
          <FooterSection />
        </Suspense>

        {/* Floating CTA */}
        {showFloatingCta && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4">
            <Button 
              size="lg"
              onClick={() => handleCreatePage('floating')}
              className={cn(
                "h-12 px-6 rounded-full font-bold",
                "bg-gradient-to-r from-primary to-primary/90",
                "shadow-2xl shadow-primary/30 hover:shadow-primary/40",
                "hover:scale-[1.02] active:scale-[0.98] transition-all"
              )}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t('landingV5.floatingCta')}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

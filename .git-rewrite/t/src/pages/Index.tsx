import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, Mail, Phone } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { LandingGallerySection } from '@/components/landing/LandingGallerySection';
import { FAQSection } from '@/components/landing/FAQSection';
import { TermsLink } from '@/components/legal/TermsOfServiceModal';
import { PrivacyLink } from '@/components/legal/PrivacyPolicyModal';
import { SEOLandingHead } from '@/components/landing/SEOLandingHead';
import { HeroSection } from '@/components/landing/HeroSection';
import { TargetAudienceSection } from '@/components/landing/TargetAudienceSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { PremiumValueSection } from '@/components/landing/PremiumValueSection';
import { SimplePricingSection } from '@/components/landing/SimplePricingSection';

function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

export default function Index() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowFloatingCta(scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroSection = useScrollAnimation();
  const audienceSection = useScrollAnimation();
  const howItWorksSection = useScrollAnimation();
  const premiumSection = useScrollAnimation();
  const pricingSection = useScrollAnimation();
  const gallerySection = useScrollAnimation();

  return (
    <>
      <SEOLandingHead currentLanguage={i18n.language} />
      <div className="min-h-screen bg-background overflow-x-hidden">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] lg:w-[1000px] lg:h-[1000px] bg-gradient-to-br from-primary/10 sm:from-primary/15 via-violet-500/5 sm:via-violet-500/10 to-transparent rounded-full blur-[60px] sm:blur-[120px] lg:blur-[180px]" />
          <div className="hidden sm:block absolute top-1/3 -right-20 w-[400px] h-[400px] lg:w-[800px] lg:h-[800px] bg-gradient-to-bl from-blue-500/12 via-cyan-500/8 to-transparent rounded-full blur-[100px] lg:blur-[150px]" />
        </div>

        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 animate-fade-in">
          <div className="mx-3 sm:mx-6 mt-3 sm:mt-4">
            <div className="backdrop-blur-2xl bg-card/70 border border-border/40 rounded-2xl shadow-glass-lg">
              <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                <div className="flex items-center group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                    Link<span className="text-gradient">MAX</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-3">
                  <LanguageSwitcher />
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/gallery')}
                    className="inline-flex font-medium hover:bg-foreground/5 rounded-xl"
                    size="sm"
                  >
                    <Users className="h-4 w-4 sm:mr-1.5" />
                    <span className="hidden sm:inline">{t('landing.nav.gallery', 'Галерея')}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/auth')}
                    className="hidden sm:inline-flex font-medium hover:bg-foreground/5 rounded-xl"
                    size="sm"
                  >
                    {t('landing.nav.signIn')}
                  </Button>
                  <Button 
                    onClick={() => navigate('/auth')}
                    className="rounded-xl font-medium shadow-lg shadow-primary/30 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 text-sm sm:text-base px-3 sm:px-4"
                    size="sm"
                  >
                    {t('landing.nav.getStarted')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero - New conversion-focused */}
        <HeroSection 
          isVisible={heroSection.isVisible} 
          sectionRef={heroSection.ref as React.RefObject<HTMLElement>} 
        />

        {/* Target Audience - Who is it for */}
        <TargetAudienceSection 
          isVisible={audienceSection.isVisible} 
          sectionRef={audienceSection.ref} 
        />

        {/* How it works in 2 minutes */}
        <HowItWorksSection 
          isVisible={howItWorksSection.isVisible} 
          sectionRef={howItWorksSection.ref} 
        />

        {/* Premium Value - Why pay */}
        <PremiumValueSection 
          isVisible={premiumSection.isVisible} 
          sectionRef={premiumSection.ref} 
        />

        {/* Gallery Section */}
        <Suspense fallback={null}>
          <LandingGallerySection />
        </Suspense>

        {/* Simple Pricing */}
        <SimplePricingSection 
          isVisible={pricingSection.isVisible} 
          sectionRef={pricingSection.ref} 
        />

        {/* FAQ */}
        <Suspense fallback={null}>
          <FAQSection />
        </Suspense>

        {/* Footer */}
        <footer className="border-t border-border/40 py-8 sm:py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
                <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <span className="text-lg sm:text-xl font-bold">
                    Link<span className="text-gradient">MAX</span>
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                    <span 
                      onClick={() => navigate('/alternatives')} 
                      className="hover:text-foreground transition-colors cursor-pointer"
                    >
                      {t('landing.footer.alternatives', 'Сравнение')}
                    </span>
                    <span>•</span>
                    <span 
                      onClick={() => navigate('/pricing')} 
                      className="hover:text-foreground transition-colors cursor-pointer"
                    >
                      {t('pricing.title', 'Тарифы')}
                    </span>
                    <span>•</span>
                    <TermsLink className="hover:text-foreground transition-colors cursor-pointer">
                      {t('legal.termsOfService')}
                    </TermsLink>
                    <span>•</span>
                    <PrivacyLink className="hover:text-foreground transition-colors cursor-pointer">
                      {t('legal.privacyPolicy')}
                    </PrivacyLink>
                  </div>
                </div>
              </div>
              
              {/* Company Details for RoboKassa compliance */}
              <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
                <p className="mb-1">ИП BEEGIN • БИН: 971207300019</p>
                <p className="mb-2">г. Алматы, ул. Шолохова, д. 20/7</p>
              </div>
              
              {/* Contact Info */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-border/30">
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-muted-foreground">
                  <a 
                    href="mailto:admin@lnkmx.my" 
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    admin@lnkmx.my
                  </a>
                  <a 
                    href="tel:+77051097664" 
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    +7 705 109 7664
                  </a>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t('landing.footer.copyright')}
                </p>
              </div>
            </div>
          </div>
        </footer>

        {/* Floating CTA Button for Mobile */}
        {isMobile && (
          <div 
            className={`fixed bottom-6 left-4 right-4 z-50 transition-all duration-300 ${
              showFloatingCta 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-10 pointer-events-none'
            }`}
          >
            <Button 
              onClick={() => navigate('/auth')}
              className="w-full rounded-2xl py-6 font-bold text-base shadow-2xl shadow-primary/40 bg-gradient-to-r from-primary via-blue-500 to-violet-600 hover:shadow-primary/50 active:scale-[0.98] transition-all"
            >
              <Sparkles className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="truncate">{t('landing.floatingCta', 'Создать бесплатно')}</span>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCallback, lazy, Suspense } from 'react';
import { useLandingAnalytics, useSectionObserver } from '@/hooks/analytics/useLandingAnalytics';
import { useMarketingAnalytics } from '@/hooks/analytics/useMarketingAnalytics';
import { SEOLandingHead } from '@/components/landing/SEOLandingHead';

import { getAppDomain } from '@/lib/utils/url-helpers';
import { ScreenErrorBoundary } from '@/components/dashboard-v2/common/ScreenErrorBoundary';
import { Button } from '@/components/ui/button';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

import { HeroOS2026 } from '@/components/landing/v3/HeroOS2026';
import { ProofStrip } from '@/components/landing/v3/ProofStrip';
import { ValueBento } from '@/components/landing/v3/ValueBento';
import { DynamicIslandNav } from '@/components/landing/v2/DynamicIslandNav';
import { FAQSection } from '@/components/landing/v2/FAQSection';
import { LogoTicker } from '@/components/landing/v2/LogoTicker';


const SEOMetaEnhancer = lazy(() => import('@/components/seo/SEOMetaEnhancer').then(m => ({ default: m.SEOMetaEnhancer })));
const GEOTagging = lazy(() => import('@/components/seo/GEOTagging').then(m => ({ default: m.GEOTagging })));
const AEOOptimizer = lazy(() => import('@/components/seo/AEOOptimizer').then(m => ({ default: m.AEOOptimizer })));
const AISearchOptimizer = lazy(() => import('@/components/seo/AISearchOptimizer').then(m => ({ default: m.AISearchOptimizer })));

const LANDING_SCREEN_NAME = 'Index';
const LANDING_AEO_TYPE = 'howto';
const LANDING_PAGE_TYPE = 'homepage';
const LANDING_ENTITY_CATEGORY = 'SaaS';

/**
 * Landing Page Index
 * Product OS landing built from the existing marketing section pipeline.
 */
export default function Index() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const seoImageAlt = t('landing.short.seo.imageAlt', 'LinkMAX');

  const { trackSectionView, trackCtaClick } = useLandingAnalytics();
  const { trackMarketingEvent, trackOnce } = useMarketingAnalytics();

  type CtaType = 'create' | 'gallery' | 'pricing' | 'signup' | 'login';

  // Method to handle navigation and tracking
  const handleNav = useCallback((path: string, ctaType: CtaType, location: string) => {
    trackCtaClick(ctaType, location);
    navigate(path);
  }, [navigate, trackCtaClick]);

  const handleCreatePage = useCallback((location: string, ctaType: 'signup' | 'pricing' = 'signup', desiredSlug?: string) => {
    const cleanDesiredSlug = typeof desiredSlug === 'string' ? desiredSlug : undefined;
    trackMarketingEvent({ eventType: 'signup_from_landing', metadata: { location, ctaType, desiredSlug: cleanDesiredSlug } });
    if (!cleanDesiredSlug) {
      handleNav('/auth', ctaType, location);
      return;
    }
    const params = new URLSearchParams({ mode: 'signup', from: 'landing', slug: cleanDesiredSlug });
    handleNav(`/auth?${params.toString()}`, ctaType, location);
  }, [handleNav, trackMarketingEvent]);

  // Analytics observers
  const trackMarketingSection = useCallback(
    (sectionId: string) => {
      trackSectionView(sectionId);
      if (sectionId === 'how_it_works') trackOnce({ eventType: 'how_it_works_view' });
    },
    [trackOnce, trackSectionView]
  );

  const heroSectionRef = useSectionObserver<HTMLDivElement>('hero', trackMarketingSection);
  const featuresSectionRef = useSectionObserver<HTMLDivElement>('features', trackMarketingSection);
  const howItWorksSectionRef = useSectionObserver<HTMLDivElement>('how_it_works', trackMarketingSection);
  const faqSectionRef = useSectionObserver<HTMLDivElement>('faq', trackMarketingSection);

  return (
    <ScreenErrorBoundary screenName={LANDING_SCREEN_NAME}>
      <SEOLandingHead currentLanguage={i18n.language} />
      <Suspense fallback={null}>
        <SEOMetaEnhancer
          pageUrl={`${getAppDomain()}/`}
          pageTitle={t('landing.short.seo.title', 'LinkMAX - создайте страницу для клиентов за пару минут')}
          pageDescription={t('landing.short.seo.description', 'Одна ссылка для услуг, записи, оплаты, заявок и мини-CRM. Бесплатный старт без кода.')}
          imageUrl={`${getAppDomain()}/og-image.png`}
          imageAlt={seoImageAlt}
          type="website"
        />
        <GEOTagging includeOrganization={true} />
        <AEOOptimizer pageUrl={`${getAppDomain()}/`} type={LANDING_AEO_TYPE} />
        <AISearchOptimizer pageType={LANDING_PAGE_TYPE} entityName={seoImageAlt} entityCategory={LANDING_ENTITY_CATEGORY} />
      </Suspense>

      <div className="min-h-screen overflow-x-hidden bg-brand-canvas text-brand-ink selection:bg-[hsl(var(--brand-sun))] selection:text-brand-ink">
        <DynamicIslandNav
          onLogin={() => handleNav('/auth', 'login', 'nav_login')}
          onSignup={() => handleCreatePage('nav_signup')}
        />

        <main className="flex-grow">
          <div id="hero" ref={heroSectionRef}>
            <HeroOS2026
              onStart={(desiredSlug?: string) => handleCreatePage('hero_cta', 'signup', desiredSlug)}
              onExamples={() => handleNav('/gallery', 'gallery', 'hero_examples')}
            />
          </div>

          <ProofStrip />

          <div id="features" ref={featuresSectionRef}>
            <ValueBento />
          </div>

          <LogoTicker />


          <div id="how-it-works" ref={howItWorksSectionRef}>
            <HowItWorksSection onStart={() => handleCreatePage('how_it_works_cta')} />
          </div>

          <div ref={faqSectionRef}>
            <FAQSection />
          </div>

          <ShortFinalCTA onStart={() => handleCreatePage('final_cta')} />
        </main>

        <SimpleFooter />
      </div>
    </ScreenErrorBoundary>
  );
}

function HowItWorksSection({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();
  const steps = [
    t('landing.short.steps.one', 'Введите короткий адрес страницы.'),
    t('landing.short.steps.two', 'Ответьте на несколько вопросов о бизнесе.'),
    t('landing.short.steps.three', 'AI соберёт структуру, тексты и первые блоки.'),
  ];

  return (
    <section className="bg-brand-ink px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <div className="grid gap-8 md:grid-cols-[0.82fr_1.18fr] md:items-center">
          <div>
            <h2 className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl">
              {t('landing.short.steps.title', 'Как запуститься')}
            </h2>
            <p className="mt-5 text-base leading-7 text-white/[0.70]">
              {t('landing.short.steps.subtitle', 'Без настройки конструктора с нуля: сначала получаете готовую основу, потом меняете детали.')}
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-4 border-b border-white/15 py-4">
                <span className="font-metric flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-coral text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-white">{step}</p>
              </div>
            ))}
            <Button onClick={onStart} className="mt-3 h-12 rounded-md bg-white px-5 text-base font-semibold text-brand-ink hover:bg-brand-canvas">
              {t('landing.short.steps.cta', 'Создать страницу')}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ShortFinalCTA({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation();

  return (
    <section className="bg-brand-coral px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1120px] gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white">
            {t('landing.short.final.eyebrow', 'Готовы начать')}
          </div>
          <h2 className="font-display max-w-2xl text-3xl font-semibold leading-tight md:text-5xl">
          {t('landing.short.final.title', 'Страница может быть готова уже сегодня')}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white">
            {t('landing.short.final.subtitle', 'Начните бесплатно: сначала соберите страницу, потом подключите запись, оплату и CRM по мере роста.')}
          </p>

        </div>
        <Button onClick={onStart} className="h-12 rounded-md bg-brand-ink px-6 text-base font-semibold text-white hover:bg-black md:h-14">
          {t('landing.short.final.cta', 'Создать страницу')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function SimpleFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-canvas px-4 pb-8 pt-8 text-center text-xs text-brand-sage sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-brand-ink/15 pt-5">
        <span>{t('landing.short.footer.copyright', '© {{year}} LinkMAX', { year })}</span>
        <a href="/privacy" className="font-medium text-brand-ink/70 underline-offset-4 hover:text-brand-ink hover:underline transition-colors">{t('landing.short.footer.privacy', 'Privacy')}</a>
        <a href="/terms" className="font-medium text-brand-ink/70 underline-offset-4 hover:text-brand-ink hover:underline transition-colors">{t('landing.short.footer.terms', 'Terms')}</a>
        <a href="/payment-terms" className="font-medium text-brand-ink/70 underline-offset-4 hover:text-brand-ink hover:underline transition-colors">{t('landing.short.footer.payments', 'Payments')}</a>
      </div>
    </footer>
  );
}

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
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';

import { HeroBentoOS } from '@/components/landing/v3/HeroBentoOS';
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

  // Enhanced section observers with theme-aware callbacks
  const trackThemeAwareMarketingSection = useCallback(
    (sectionId: string, isDarkMode: boolean) => {
      trackSectionView(sectionId);
      trackMarketingEvent({ 
        eventType: 'section_view', 
        metadata: { 
          sectionId, 
          theme: isDarkMode ? 'dark' : 'light',
          timestamp: Date.now() 
        } 
      });
      if (sectionId === 'how_it_works') trackOnce({ eventType: 'how_it_works_view' });
    },
    [trackOnce, trackSectionView, trackMarketingEvent]
  );

  const heroSectionRef = useSectionObserver<HTMLDivElement>('hero', (sectionId) => trackThemeAwareMarketingSection(sectionId, i18n.language === 'kk' || document.documentElement.classList.contains('dark')));
  const featuresSectionRef = useSectionObserver<HTMLDivElement>('features', (sectionId) => trackThemeAwareMarketingSection(sectionId, i18n.language === 'kk' || document.documentElement.classList.contains('dark')));
  const howItWorksSectionRef = useSectionObserver<HTMLDivElement>('how_it_works', (sectionId) => trackThemeAwareMarketingSection(sectionId, i18n.language === 'kk' || document.documentElement.classList.contains('dark')));
  const faqSectionRef = useSectionObserver<HTMLDivElement>('faq', (sectionId) => trackThemeAwareMarketingSection(sectionId, i18n.language === 'kk' || document.documentElement.classList.contains('dark')));

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
        {/* Theme-aware background effects for dark mode with enhanced visual depth */}
        <div className="absolute inset-0">
          {/* Base gradient that adapts to theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-canvas via-brand-canvas to-brand-canvas/80 dark:from-brand-ink dark:via-brand-ink/95 dark:to-brand-ink/90 transition-all duration-500" />
          
          {/* Theme-aware animated gradient orbs */}
          <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-brand-coral/20 dark:bg-brand-coral/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-brand-blue/15 dark:bg-brand-blue/5 rounded-full blur-3xl animate-float-medium" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[700px] h-[700px] bg-brand-mint/15 dark:bg-brand-mint/5 rounded-full blur-3xl animate-float-fast" style={{ animationDelay: '2s' }} />
          
          {/* Subtle grid pattern for depth */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(var(--brand-ink))/10_1px,transparent_1px),linear-gradient(90deg,rgba(var(--brand-ink))/10_1px,transparent_1px)] bg-size-[40px_40px] dark:bg-[linear-gradient(rgba(var(--brand-canvas))/15_1px,transparent_1px),linear-gradient(90deg,rgba(var(--brand-canvas))/15_1px,transparent_1px)] opacity-50" />
        </div>

        {/* Enhanced theme transition overlay with theme-aware effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-canvas/60 dark:via-brand-ink/60 to-brand-canvas dark:to-brand-ink/90 pointer-events-none transition-all duration-500" />
        
        {/* Theme-aware vignette for better focus */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-brand-canvas/80 dark:to-brand-ink/80 pointer-events-none" />
        <DynamicIslandNav
          onLogin={() => handleNav('/auth', 'login', 'nav_login')}
          onSignup={() => handleCreatePage('nav_signup')}
        />

        <main className="flex-grow">
          <div id="hero" ref={heroSectionRef}>
            <HeroBentoOS
              onStart={(desiredSlug) => handleCreatePage('hero_cta', 'signup', desiredSlug)}
              onExamples={() => handleNav('/gallery', 'gallery', 'hero_examples')}
            />
          </div>

          <div id="features" ref={featuresSectionRef} className="relative">
            {/* Theme-aware section background with subtle gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-brand-canvas/50 via-transparent to-brand-canvas/30 dark:from-brand-ink/50 dark:via-transparent dark:to-brand-ink/30 -z-10" />
            <ShortFeatureSection />
          </div>

          <LogoTicker className="relative z-10" />

          <div id="how-it-works" ref={howItWorksSectionRef} className="relative">
            {/* Theme-aware section background with diagonal pattern */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-canvas/50 via-transparent to-brand-canvas/30 dark:from-brand-ink/50 dark:via-transparent dark:to-brand-ink/30 -z-10" />
            <HowItWorksSection onStart={() => handleCreatePage('how_it_works_cta')} />
          </div>

          <div ref={faqSectionRef} className="relative">
            {/* Theme-aware section background with subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-brand-canvas via-brand-canvas/50 to-brand-canvas dark:from-brand-ink dark:via-brand-ink/50 dark:to-brand-ink -z-10" />
            <FAQSection />
          </div>

          <ShortFinalCTA onStart={() => handleCreatePage('final_cta')} />
        </main>

        <SimpleFooter />
      </div>
    </ScreenErrorBoundary>
  );
}

function ShortFeatureSection() {
  const { t } = useTranslation();
  const items = [
    {
      id: 'page',
      title: t('landing.short.features.pageTitle', 'Страница'),
      body: t('landing.short.features.pageBody', 'Услуги, ссылки, портфолио, отзывы и кнопки связи в одном коротком профиле.'),
    },
    {
      id: 'leads',
      title: t('landing.short.features.leadsTitle', 'Заявки'),
      body: t('landing.short.features.leadsBody', 'Формы, мессенджеры и записи складываются в единый поток, а не теряются в переписках.'),
    },
    {
      id: 'money',
      title: t('landing.short.features.moneyTitle', 'Оплата'),
      body: t('landing.short.features.moneyBody', 'Инвойсы, платежи и базовая CRM уже рядом со страницей.'),
    },
  ];

  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <div className="grid gap-8 border-y border-brand-ink/15 py-10 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div>
            <div className="mb-4 inline-flex rounded-md border border-brand-ink/20 bg-white px-3 py-1 text-xs font-bold uppercase text-brand-ink">
              {t('landing.short.features.badge', 'LinkMAX OS')}
            </div>
            <h2 className="font-display text-4xl font-semibold leading-tight text-brand-ink md:text-5xl">
              {t('landing.short.features.title', 'Что это?')}
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-brand-sage">
              {t('landing.short.features.subtitle', 'Одна публичная ссылка для малого бизнеса: показать предложение, принять заявку и продолжить работу с клиентом.')}
            </p>
          </div>

          <div className="grid gap-3">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-[48px_1fr] items-start gap-4 rounded-lg border border-brand-ink/15 bg-white p-5">
                <div className="font-metric flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-brand-canvas text-sm font-bold text-brand-ink whitespace-nowrap">
                  0{index + 1}
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-mint" />
                  <div>
                    <h3 className="text-lg font-semibold text-brand-ink">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-brand-sage">{item.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
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

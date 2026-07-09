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

const SEOMetaEnhancer = lazy(() => import('@/components/seo/SEOMetaEnhancer').then(m => ({ default: m.SEOMetaEnhancer })));
const GEOTagging = lazy(() => import('@/components/seo/GEOTagging').then(m => ({ default: m.GEOTagging })));
const AEOOptimizer = lazy(() => import('@/components/seo/AEOOptimizer').then(m => ({ default: m.AEOOptimizer })));
const AISearchOptimizer = lazy(() => import('@/components/seo/AISearchOptimizer').then(m => ({ default: m.AISearchOptimizer })));

/**
 * Landing Page Index
 * Product OS landing built from the existing marketing section pipeline.
 */
export default function Index() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

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
    <ScreenErrorBoundary screenName="Index">
      <SEOLandingHead currentLanguage={i18n.language} />
      <Suspense fallback={null}>
        <SEOMetaEnhancer
          pageUrl={`${getAppDomain()}/`}
          pageTitle={t('landing.short.seo.title', 'LinkMAX - создайте страницу для клиентов за пару минут')}
          pageDescription={t('landing.short.seo.description', 'Одна ссылка для услуг, записи, оплаты, заявок и мини-CRM. Бесплатный старт без кода.')}
          imageUrl={`${getAppDomain()}/og-image.png`}
          imageAlt="LinkMAX"
          type="website"
        />
        <GEOTagging includeOrganization={true} />
        <AEOOptimizer pageUrl={`${getAppDomain()}/`} type="howto" />
        <AISearchOptimizer pageType="homepage" entityName="LinkMAX" entityCategory="SaaS" />
      </Suspense>

      <div className="min-h-screen overflow-x-hidden bg-[#f6f6f1] text-[#101318] selection:bg-[#ffdfcf] selection:text-[#101318]">
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

          <div id="features" ref={featuresSectionRef}>
            <ShortFeatureSection />
          </div>

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

function ShortFeatureSection() {
  const { t } = useTranslation();
  const items = [
    {
      title: t('landing.short.features.pageTitle', 'Страница'),
      body: t('landing.short.features.pageBody', 'Услуги, ссылки, портфолио, отзывы и кнопки связи в одном коротком профиле.'),
    },
    {
      title: t('landing.short.features.leadsTitle', 'Заявки'),
      body: t('landing.short.features.leadsBody', 'Формы, мессенджеры и записи складываются в единый поток, а не теряются в переписках.'),
    },
    {
      title: t('landing.short.features.moneyTitle', 'Оплата'),
      body: t('landing.short.features.moneyBody', 'Инвойсы, платежи и базовая CRM уже рядом со страницей.'),
    },
  ];

  return (
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px]">
        <div className="grid gap-8 border-y border-[#ded9c9] py-10 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div>
            <div className="mb-4 inline-flex rounded-full bg-[#101318] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-white">
              LinkMAX OS
            </div>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-[#101318] md:text-[56px] md:leading-[0.94]">
              {t('landing.short.features.title', 'Что это?')}
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-[#62675f]">
              {t('landing.short.features.subtitle', 'Одна публичная ссылка для малого бизнеса: показать предложение, принять заявку и продолжить работу с клиентом.')}
            </p>
          </div>

          <div className="grid gap-3">
            {items.map((item, index) => (
              <div key={item.title} className="group grid gap-4 rounded-[24px] bg-white p-5 shadow-[0_12px_34px_rgba(16,19,24,0.06)] transition-transform hover:-translate-y-0.5 sm:grid-cols-[64px_1fr]">
                <div className="flex h-16 w-16 items-center justify-center rounded-[20px] bg-[#f6f6f1] text-lg font-black text-[#101318]">
                  0{index + 1}
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#ff5701]" />
                  <div>
                    <h3 className="text-lg font-semibold text-[#101318]">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#62675f]">{item.body}</p>
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
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1120px] rounded-[32px] bg-[#101318] p-5 text-white shadow-[0_22px_70px_rgba(16,19,24,0.18)] md:p-8">
        <div className="grid gap-8 md:grid-cols-[0.82fr_1.18fr] md:items-center">
          <div>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white md:text-[56px] md:leading-[0.94]">
              {t('landing.short.steps.title', 'Как запуститься')}
            </h2>
            <p className="mt-5 text-base leading-7 text-white/[0.70]">
              {t('landing.short.steps.subtitle', 'Без настройки конструктора с нуля: сначала получаете готовую основу, потом меняете детали.')}
            </p>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center gap-4 rounded-[20px] border border-white/[0.10] bg-white/[0.08] p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ff5701] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm font-semibold text-white">{step}</p>
              </div>
            ))}
            <Button onClick={onStart} className="mt-2 h-12 rounded-[14px] bg-white px-5 text-base font-semibold text-[#101318] hover:bg-[#f6f6f1]">
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
    <section className="px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1120px] gap-6 rounded-[32px] bg-[#ff5701] px-6 py-8 text-white shadow-[0_22px_70px_rgba(255,87,1,0.22)] md:grid-cols-[1fr_auto] md:items-center md:px-8">
        <div>
          <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white/[0.70]">
            {t('landing.short.final.eyebrow', 'Готовы начать')}
          </div>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.04em] md:text-[48px] md:leading-[0.98]">
          {t('landing.short.final.title', 'Страница может быть готова уже сегодня')}
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/[0.78]">
            {t('landing.short.final.subtitle', 'Начните бесплатно: сначала соберите страницу, потом подключите запись, оплату и CRM по мере роста.')}
          </p>
        </div>
        <Button onClick={onStart} className="h-[52px] rounded-[16px] bg-[#101318] px-6 text-base font-semibold text-white hover:bg-[#232832] md:h-14">
          {t('landing.short.final.cta', 'Создать страницу')}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}

function SimpleFooter() {
  return (
    <footer className="px-4 pb-8 pt-4 text-center text-xs text-[#62675f] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-[#ded9c9] pt-5">
        <span>© {new Date().getFullYear()} LinkMAX</span>
        <a href="/privacy" className="hover:text-[#101318]">Privacy</a>
        <a href="/terms" className="hover:text-[#101318]">Terms</a>
        <a href="/payment-terms" className="hover:text-[#101318]">Payments</a>
      </div>
    </footer>
  );
}

/**
 * Landing Page v4.0 - Human Copywriting + Conversion Optimized
 * Focus: Clear value prop in 10 seconds, human tone, mobile-first
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap,
  Crown,
  BarChart3,
  ArrowRight,
  Check,
  Bot,
  Send,
  Target,
  TrendingUp,
  Briefcase,
  Scissors,
  Camera,
  X,
  Users,
  Sparkles,
  MessageSquare,
  Clock,
  Star,
  Shield,
  Gift,
  Play,
  ChevronRight,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { LandingGallerySection } from '@/components/landing/LandingGallerySection';
import { FAQSection } from '@/components/landing/FAQSection';
import { NichesDetailSection } from '@/components/landing/NichesDetailSection';
import { LinkInBioSection } from '@/components/landing/LinkInBioSection';
import { TermsLink } from '@/components/legal/TermsOfServiceModal';
import { PrivacyLink } from '@/components/legal/PrivacyPolicyModal';
import { SEOLandingHead } from '@/components/landing/SEOLandingHead';
import { cn } from '@/lib/utils';
import { useLandingAnalytics, useSectionObserver } from '@/hooks/useLandingAnalytics';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';

// Subtle grid background
function AnimatedGridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.02]">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, currentColor 1px, transparent 1px),
            linear-gradient(to bottom, currentColor 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}

// Scroll animation hook
function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

// Merge refs utility
function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref && 'current' in ref) {
        (ref as React.MutableRefObject<T>).current = node;
      }
    });
  };
}

export default function Index() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const isMobile = useIsMobile();
  const { trackSectionView, trackCtaClick } = useLandingAnalytics();
  const { trackMarketingEvent, trackOnce } = useMarketingAnalytics();

  // Scroll animations
  const heroAnim = useScrollAnimation(0.1);
  const problemAnim = useScrollAnimation(0.1);
  const howItWorksAnim = useScrollAnimation(0.1);
  const benefitsAnim = useScrollAnimation(0.1);
  const blocksAnim = useScrollAnimation(0.1);
  const useCasesAnim = useScrollAnimation(0.1);
  const proofAnim = useScrollAnimation(0.1);
  const pricingAnim = useScrollAnimation(0.1);
  const finalCtaAnim = useScrollAnimation(0.1);

  const trackMarketingSection = useCallback(
    (sectionId: string) => {
      trackSectionView(sectionId);
      if (sectionId === 'how_it_works') {
        trackOnce({ eventType: 'how_it_works_view' });
      }
      if (sectionId === 'pricing') {
        trackOnce({ eventType: 'pricing_view' });
      }
    },
    [trackOnce, trackSectionView]
  );

  const howItWorksSectionRef = useSectionObserver('how_it_works', trackMarketingSection);
  const pricingSectionRef = useSectionObserver('pricing', trackMarketingSection);

  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCta(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isKZ = i18n.language === 'ru' || i18n.language === 'kk';

  const handleCreatePage = useCallback(
    (location: string, eventType?: 'hero_primary_cta_click' | 'signup_from_landing') => {
      trackCtaClick('create', location);
      trackMarketingEvent({ eventType: 'signup_from_landing', metadata: { location } });
      if (eventType) {
        trackMarketingEvent({ eventType, metadata: { location } });
      }
      navigate('/auth');
    },
    [navigate, trackCtaClick, trackMarketingEvent]
  );

  const handleViewExamples = useCallback(
    (location: string, eventType?: 'hero_secondary_cta_click') => {
      trackCtaClick('gallery', location);
      if (eventType) {
        trackMarketingEvent({ eventType, metadata: { location } });
      }
      navigate('/gallery');
    },
    [navigate, trackCtaClick, trackMarketingEvent]
  );

  const handleViewPricing = useCallback(
    (location: string) => {
      trackCtaClick('pricing', location);
      navigate('/pricing');
    },
    [navigate, trackCtaClick]
  );

  return (
    <>
      <SEOLandingHead currentLanguage={i18n.language} />
      <div className="min-h-screen bg-background overflow-x-hidden">
        <AnimatedGridBackground />

        {/* Navigation */}
        <nav className="fixed left-0 right-0 z-50 px-4 top-0 pt-3">
          <div className="max-w-xl mx-auto">
            <div className="bg-card/90 backdrop-blur-xl border border-border/40 rounded-2xl shadow-lg">
              <div className="px-4 h-14 flex items-center justify-between">
                <button 
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="flex items-center group"
                >
                  <span className="text-lg font-black transition-transform group-hover:scale-105">
                    lnk<span className="text-primary">mx</span>
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewExamples('nav')}
                    className="hidden sm:flex rounded-xl"
                  >
                    {t('landing.nav.examples', 'Примеры')}
                  </Button>
                  <Button 
                    onClick={() => handleCreatePage('nav')}
                    className="rounded-xl font-semibold shadow-md shadow-primary/20"
                    size="sm"
                  >
                    {t('landing.nav.getStarted', 'Создать')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* ========== HERO SECTION ========== */}
        <section ref={heroAnim.ref} className="pt-24 pb-8 sm:pb-12 px-5">
          <div className={cn(
            "max-w-xl mx-auto text-center transition-all duration-700",
            heroAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            {/* Trust badge */}
            <Badge className="mb-5 h-7 px-3 text-xs font-medium bg-primary/10 text-primary border-primary/20 rounded-full">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              {t('landing.v4.hero.badge', 'Бесплатно. Без кода. За 2 минуты.')}
            </Badge>

            {/* H1 - Clear value prop */}
            <h1 className="text-[1.75rem] sm:text-4xl font-black tracking-tight mb-4 leading-[1.15]">
              {t('landing.v4.hero.title', 'Собери страницу, которая приводит клиентов')}
            </h1>

            {/* Subtitle - specific benefits */}
            <p className="text-base sm:text-lg text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
              {t('landing.v4.hero.subtitle', 'AI сделает структуру и тексты. Заявки придут в Telegram. Ты увидишь, что работает.')}
            </p>

            {/* Primary CTA */}
            <div className="flex flex-col gap-3 max-w-xs mx-auto mb-6">
              <Button 
                size="lg"
                onClick={() => handleCreatePage('hero', 'hero_primary_cta_click')}
                className="h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {t('landing.v4.hero.cta', 'Создать страницу')}
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => handleViewExamples('hero', 'hero_secondary_cta_click')}
                className="text-muted-foreground hover:text-foreground"
              >
                <Users className="h-4 w-4 mr-2" />
                {t('landing.v4.hero.secondary', 'Посмотреть примеры')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" />
                {t('landing.v4.hero.trust1', 'Без карты')}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" />
                {t('landing.v4.hero.trust2', 'Редактор на телефоне')}
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" />
                {t('landing.v4.hero.trust3', 'Публикация за клик')}
              </span>
            </div>
          </div>
        </section>

        {/* ========== FOR WHOM ========== */}
        <section className="py-8 px-5 bg-muted/30">
          <div className="max-w-xl mx-auto">
            <p className="text-center text-sm font-medium text-muted-foreground mb-5">
              {t('landing.v4.forWhom.label', 'Для тех, кто продаёт через соцсети:')}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { icon: Briefcase, label: t('landing.v4.forWhom.expert', 'Эксперты') },
                { icon: Scissors, label: t('landing.v4.forWhom.beauty', 'Бьюти') },
                { icon: Camera, label: t('landing.v4.forWhom.creator', 'Креаторы') },
                { icon: TrendingUp, label: t('landing.v4.forWhom.business', 'Бизнес') },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-card border border-border/50 text-sm font-medium">
                  <item.icon className="h-4 w-4 text-primary" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== PROBLEM SECTION ========== */}
        <section ref={problemAnim.ref} className="py-10 px-5">
          <div className={cn(
            "max-w-xl mx-auto transition-all duration-700",
            problemAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
              {t('landing.v4.problem.title', 'Знакомо?')}
            </h2>

            <div className="space-y-3">
              {[
                t('landing.v4.problem.item1', 'В bio ссылка на WhatsApp, и клиенты спрашивают одно и то же'),
                t('landing.v4.problem.item2', 'Нет понятного прайса - теряешь тех, кто не хочет писать'),
                t('landing.v4.problem.item3', 'Непонятно, какие посты и сторис реально приводят заявки'),
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
                  <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </div>

            <Card className="mt-5 p-4 bg-primary/5 border-primary/20">
              <p className="text-sm leading-relaxed">
                <span className="font-semibold">lnkmx</span> {t('landing.v4.problem.solution', '- одна страница, где всё понятно: кто ты, чем помогаешь, сколько стоит и куда нажать.')}
              </p>
            </Card>
          </div>
        </section>

        {/* ========== HOW IT WORKS ========== */}
        <section 
          ref={mergeRefs(howItWorksAnim.ref, howItWorksSectionRef)}
          className="py-10 px-5 bg-muted/30"
        >
          <div className={cn(
            "max-w-xl mx-auto transition-all duration-700",
            howItWorksAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            <Badge className="mb-4 mx-auto flex w-fit h-6 px-3 text-xs font-medium bg-primary/10 text-primary border-primary/20 rounded-full">
              <Clock className="h-3.5 w-3.5 mr-1.5" />
              {t('landing.v4.howItWorks.badge', '2 минуты до результата')}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">
              {t('landing.v4.howItWorks.title', 'Как это работает')}
            </h2>

            <div className="space-y-4">
              <StepCard
                number="1"
                icon={<Target className="h-5 w-5" />}
                title={t('landing.v4.howItWorks.step1.title', 'Расскажи, чем занимаешься')}
                description={t('landing.v4.howItWorks.step1.desc', 'Выбери нишу и добавь пару фактов о себе')}
              />
              <StepCard
                number="2"
                icon={<Bot className="h-5 w-5" />}
                title={t('landing.v4.howItWorks.step2.title', 'AI соберёт страницу')}
                description={t('landing.v4.howItWorks.step2.desc', 'Структура, тексты, кнопки - редактируй как хочешь')}
              />
              <StepCard
                number="3"
                icon={<Send className="h-5 w-5" />}
                title={t('landing.v4.howItWorks.step3.title', 'Получай заявки')}
                description={t('landing.v4.howItWorks.step3.desc', 'Ссылка для соцсетей готова, лиды идут в Telegram')}
              />
            </div>

            <div className="mt-8 text-center">
              <Button 
                size="lg"
                onClick={() => handleCreatePage('how_it_works')}
                className="h-12 px-6 rounded-xl font-semibold shadow-lg shadow-primary/20"
              >
                {t('landing.v4.howItWorks.cta', 'Попробовать')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* ========== BENEFITS / WHAT YOU GET ========== */}
        <section ref={benefitsAnim.ref} className="py-10 px-5">
          <div className={cn(
            "max-w-xl mx-auto transition-all duration-700",
            benefitsAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-8">
              {t('landing.v4.benefits.title', 'Что получишь')}
            </h2>

            <div className="grid gap-3">
              <BenefitCard
                icon={<MessageSquare className="h-5 w-5" />}
                iconBg="bg-blue-500"
                title={t('landing.v4.benefits.crm.title', 'Мини-CRM + Telegram')}
                description={t('landing.v4.benefits.crm.desc', 'Все заявки в одном месте. Мгновенные уведомления в телефон.')}
              />
              <BenefitCard
                icon={<BarChart3 className="h-5 w-5" />}
                iconBg="bg-amber-500"
                title={t('landing.v4.benefits.analytics.title', 'Аналитика кликов')}
                description={t('landing.v4.benefits.analytics.desc', 'Видишь, какие блоки работают. Понимаешь, что улучшить.')}
              />
              <BenefitCard
                icon={<Bot className="h-5 w-5" />}
                iconBg="bg-violet-500"
                title={t('landing.v4.benefits.ai.title', 'AI-помощник')}
                description={t('landing.v4.benefits.ai.desc', 'Генерирует тексты, структуру и идеи. Экономит часы работы.')}
              />
              <BenefitCard
                icon={<Zap className="h-5 w-5" />}
                iconBg="bg-emerald-500"
                title={t('landing.v4.benefits.mobile.title', 'Мобильный редактор')}
                description={t('landing.v4.benefits.mobile.desc', 'Редактируй с телефона. Публикуй за секунду.')}
              />
            </div>
          </div>
        </section>

        {/* ========== BLOCKS SHOWCASE ========== */}
        <section ref={blocksAnim.ref} className="py-10 px-5 bg-muted/30">
          <div className={cn(
            "max-w-xl mx-auto transition-all duration-700",
            blocksAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">
              {t('landing.v4.blocks.title', '25+ готовых блоков')}
            </h2>
            <p className="text-center text-sm text-muted-foreground mb-6">
              {t('landing.v4.blocks.subtitle', 'Drag & drop. Работает на любом устройстве.')}
            </p>

            {/* Horizontal scroll on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
              {[
                { name: t('blockTypes.profile', 'Профиль'), emoji: '👤' },
                { name: t('blockTypes.link', 'Ссылки'), emoji: '🔗' },
                { name: t('blockTypes.pricing', 'Прайс'), emoji: '💰' },
                { name: t('blockTypes.form', 'Форма'), emoji: '📝' },
                { name: t('blockTypes.booking', 'Запись'), emoji: '📅' },
                { name: t('blockTypes.faq', 'FAQ'), emoji: '❓' },
                { name: t('blockTypes.testimonial', 'Отзывы'), emoji: '⭐' },
                { name: t('blockTypes.map', 'Карта'), emoji: '📍' },
                { name: t('blockTypes.product', 'Товары'), emoji: '🛍️' },
                { name: t('blockTypes.video', 'Видео'), emoji: '🎬' },
              ].map((block, i) => (
                <div 
                  key={i} 
                  className="flex-shrink-0 flex items-center gap-2 py-2 px-3 rounded-xl bg-card border border-border/50 text-sm font-medium"
                >
                  <span>{block.emoji}</span>
                  {block.name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== USE CASES ========== */}
        <section ref={useCasesAnim.ref} className="py-10 px-5">
          <div className={cn(
            "max-w-xl mx-auto transition-all duration-700",
            useCasesAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">
              {t('landing.v4.useCases.title', 'Готовые сценарии')}
            </h2>
            <p className="text-center text-sm text-muted-foreground mb-6">
              {t('landing.v4.useCases.subtitle', 'Выбери шаблон - AI адаптирует под тебя')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <UseCaseCard
                icon={<Briefcase className="h-5 w-5" />}
                title={t('landing.v4.useCases.expert.title', 'Эксперт / Консультант')}
                items={[
                  t('landing.v4.useCases.expert.item1', 'Оффер на первом экране'),
                  t('landing.v4.useCases.expert.item2', 'Пакеты услуг и цены'),
                  t('landing.v4.useCases.expert.item3', 'Форма заявки'),
                ]}
              />
              <UseCaseCard
                icon={<Scissors className="h-5 w-5" />}
                title={t('landing.v4.useCases.beauty.title', 'Бьюти / Услуги')}
                items={[
                  t('landing.v4.useCases.beauty.item1', 'Онлайн-запись'),
                  t('landing.v4.useCases.beauty.item2', 'Отзывы и до/после'),
                  t('landing.v4.useCases.beauty.item3', 'Карта и контакты'),
                ]}
              />
              <UseCaseCard
                icon={<Camera className="h-5 w-5" />}
                title={t('landing.v4.useCases.creator.title', 'Креатор / Портфолио')}
                items={[
                  t('landing.v4.useCases.creator.item1', 'Лучшие работы'),
                  t('landing.v4.useCases.creator.item2', 'Соцсети и подписки'),
                  t('landing.v4.useCases.creator.item3', 'Бриф для заказа'),
                ]}
              />
              <UseCaseCard
                icon={<TrendingUp className="h-5 w-5" />}
                title={t('landing.v4.useCases.shop.title', 'Магазин / Каталог')}
                items={[
                  t('landing.v4.useCases.shop.item1', 'Товары с ценами'),
                  t('landing.v4.useCases.shop.item2', 'FAQ и доставка'),
                  t('landing.v4.useCases.shop.item3', 'Быстрый заказ'),
                ]}
              />
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                size="lg"
                onClick={() => handleCreatePage('use_cases')}
                className="h-12 rounded-xl font-semibold"
              >
                {t('landing.v4.useCases.cta', 'Выбрать сценарий')}
              </Button>
            </div>
          </div>
        </section>

        {/* ========== NICHES DETAIL ========== */}
        <Suspense fallback={null}>
          <NichesDetailSection />
        </Suspense>

        {/* ========== LINK IN BIO SEO ========== */}
        <Suspense fallback={null}>
          <LinkInBioSection />
        </Suspense>

        {/* ========== SOCIAL PROOF / GALLERY ========== */}
        <section ref={proofAnim.ref} className="py-10 px-5 bg-muted/30">
          <div className={cn(
            "max-w-xl mx-auto transition-all duration-700",
            proofAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">
              {t('landing.v4.proof.title', 'Примеры страниц')}
            </h2>
            <p className="text-center text-sm text-muted-foreground mb-6">
              {t('landing.v4.proof.subtitle', 'Посмотри, как другие используют lnkmx')}
            </p>
            <Suspense fallback={null}>
              <LandingGallerySection />
            </Suspense>
            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => handleViewExamples('proof')}
                className="text-sm"
              >
                {t('landing.gallery.viewAll', 'Смотреть все')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </section>

        {/* ========== PRICING ========== */}
        <section 
          ref={mergeRefs(pricingAnim.ref, pricingSectionRef)}
          className="py-10 px-5"
        >
          <div className={cn(
            "max-w-xl mx-auto transition-all duration-700",
            pricingAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">
              {t('landing.v4.pricing.title', 'Простые тарифы')}
            </h2>
            <p className="text-center text-sm text-muted-foreground mb-6">
              {t('landing.v4.pricing.subtitle', 'Начни бесплатно. Подключи Pro, когда нужно больше.')}
            </p>

            <div className="grid gap-4">
              {/* Free */}
              <Card className="p-5 border border-border/50">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Free</h3>
                    <p className="text-2xl font-black">{isKZ ? '0 ₸' : '$0'}</p>
                  </div>
                  <Badge variant="secondary">{t('landing.v4.pricing.forever', 'Навсегда')}</Badge>
                </div>
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {t('landing.v4.pricing.free.f1', 'Базовые блоки')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {t('landing.v4.pricing.free.f2', '1 AI-генерация/месяц')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {t('landing.v4.pricing.free.f3', 'Базовая статистика')}
                  </li>
                </ul>
                <Button 
                  variant="outline" 
                  className="w-full h-11 rounded-xl font-semibold"
                  onClick={() => handleCreatePage('pricing_free')}
                >
                  {t('landing.v4.pricing.freeCta', 'Начать бесплатно')}
                </Button>
              </Card>

              {/* Pro */}
              <Card className="p-5 border-2 border-primary bg-primary/5 relative">
                <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  {t('landing.v4.pricing.recommended', 'Рекомендуем')}
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      Pro <Crown className="h-4 w-4 text-amber-500" />
                    </h3>
                    <p className="text-2xl font-black">
                      {isKZ ? '2 610 ₸' : '$5'}
                      <span className="text-sm font-normal text-muted-foreground">/{t('landing.v4.pricing.month', 'мес')}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isKZ ? '31 320 ₸ за год' : '$60/year'} · {t('landing.v4.pricing.save', 'экономия 40%')}
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {t('landing.v4.pricing.pro.f1', 'Все 25+ блоков')}
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <Check className="h-4 w-4 text-primary" />
                    {t('landing.v4.pricing.pro.f2', 'Mini-CRM + Telegram-уведомления')}
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <Check className="h-4 w-4 text-primary" />
                    {t('landing.v4.pricing.pro.f3', '5 AI-генераций/месяц')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {t('landing.v4.pricing.pro.f4', 'Расширенная аналитика')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {t('landing.v4.pricing.pro.f5', 'Без watermark')}
                  </li>
                </ul>
                <Button 
                  className="w-full h-11 rounded-xl font-semibold shadow-md shadow-primary/20"
                  onClick={() => handleViewPricing('pricing_pro')}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {t('landing.v4.pricing.proCta', 'Выбрать Pro')}
                </Button>
              </Card>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              <Shield className="inline h-3.5 w-3.5 mr-1" />
              {t('landing.v4.pricing.guarantee', '0% комиссии с продаж. Возврат 14 дней.')}
            </p>
          </div>
        </section>

        {/* ========== FAQ ========== */}
        <Suspense fallback={null}>
          <FAQSection />
        </Suspense>

        {/* ========== FINAL CTA ========== */}
        <section ref={finalCtaAnim.ref} className="py-14 px-5 bg-gradient-to-b from-muted/30 to-primary/5">
          <div className={cn(
            "max-w-xl mx-auto text-center transition-all duration-700",
            finalCtaAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}>
            <h2 className="text-xl sm:text-2xl font-bold mb-3">
              {t('landing.v4.finalCta.title', 'Готов собрать страницу?')}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {t('landing.v4.finalCta.subtitle', 'Бесплатно. Без кода. Результат за 2 минуты.')}
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button 
                size="lg"
                onClick={() => handleCreatePage('final_cta')}
                className="h-14 rounded-2xl text-base font-bold shadow-xl shadow-primary/25"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                {t('landing.v4.finalCta.cta', 'Создать страницу')}
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => handleViewExamples('final_cta')}
                className="text-muted-foreground"
              >
                {t('landing.v4.finalCta.secondary', 'Или посмотри примеры')}
              </Button>
            </div>
          </div>
        </section>

        {/* ========== FOOTER ========== */}
        <footer className="border-t border-border/30 py-8 px-5 bg-muted/20">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <span className="text-lg font-black">
                lnk<span className="text-primary">mx</span>
              </span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground mb-4">
              <button onClick={() => navigate('/alternatives')} className="hover:text-foreground transition-colors">
                {t('landing.footer.alternatives', 'Сравнение')}
              </button>
              <span>·</span>
              <button onClick={() => navigate('/pricing')} className="hover:text-foreground transition-colors">
                {t('pricing.title', 'Тарифы')}
              </button>
              <span>·</span>
              <button onClick={() => navigate('/gallery')} className="hover:text-foreground transition-colors">
                {t('landing.nav.gallery', 'Галерея')}
              </button>
              <span>·</span>
              <TermsLink className="hover:text-foreground transition-colors">
                {t('legal.termsOfService', 'Условия')}
              </TermsLink>
              <span>·</span>
              <PrivacyLink className="hover:text-foreground transition-colors">
                {t('legal.privacyPolicy', 'Политика')}
              </PrivacyLink>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              © {new Date().getFullYear()} lnkmx
            </p>
          </div>
        </footer>

        {/* Floating CTA */}
        {showFloatingCta && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4">
            <Button 
              size="lg"
              onClick={() => handleCreatePage('floating')}
              className="h-12 px-6 rounded-full font-bold shadow-2xl shadow-primary/30"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t('landing.floatingCta.create', 'Создать')}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

// ========== COMPONENTS ==========

function StepCard({ 
  number, 
  icon, 
  title, 
  description 
}: { 
  number: string; 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function BenefitCard({ 
  icon, 
  iconBg, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  iconBg: string; 
  title: string; 
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50">
      <div className={cn("flex-shrink-0 h-10 w-10 rounded-xl flex items-center justify-center text-white", iconBg)}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function UseCaseCard({ 
  icon, 
  title, 
  items 
}: { 
  icon: React.ReactNode; 
  title: string; 
  items: string[];
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
            <Check className="h-3 w-3 text-primary flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

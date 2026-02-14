import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Sparkles, 
  Link2, 
  Zap, 
  Shield, 
  Smartphone, 
  Share2, 
  ArrowRight,
  Star,
  TrendingUp,
  Check,
  X,
  Crown,
  Users,
  BarChart3,
  Palette,
  Bot,
  Globe,
  Clock,
  Wand2,
  Rocket,
  MessageSquare,
  Briefcase,
  Scissors,
  Camera,
  Dumbbell,
  GraduationCap,
  Heart,
  Brain,
  Coffee,
  ShoppingBag,
  Building2,
  Stethoscope,
  School,
  Wrench,
  BadgeCheck,
  Layers,
  Target,
  Gift,
  Trophy,
  Flame,
  Timer,
  Percent,
  CreditCard
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { openPremiumPurchase } from '@/lib/upgrade-utils';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { InteractiveDemo } from '@/components/landing/InteractiveDemo';
import { LandingFeaturedPages } from '@/components/landing/LandingFeaturedPages';
import { LandingGallerySection } from '@/components/landing/LandingGallerySection';
import { FAQSection } from '@/components/landing/FAQSection';
import { UseCasesGallery } from '@/components/landing/UseCasesGallery';
import { TermsLink } from '@/components/legal/TermsOfServiceModal';
import { PrivacyLink } from '@/components/legal/PrivacyPolicyModal';
import { Hero3D } from '@/components/landing/Hero3D';
import { SEOLandingHead } from '@/components/landing/SEOLandingHead';
import { TableOfContents } from '@/components/landing/TableOfContents';
import { LinkInBioSection } from '@/components/landing/LinkInBioSection';
import { NichesDetailSection } from '@/components/landing/NichesDetailSection';

// Intersection Observer hook for scroll animations
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
  const [username, setUsername] = useState('');
  const [showFloatingCta, setShowFloatingCta] = useState(false);
  const isMobile = useIsMobile();

  // Show floating CTA after scrolling past hero section
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setShowFloatingCta(scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCreatePage = () => {
    if (username.trim()) {
      navigate(`/auth?username=${encodeURIComponent(username.trim())}`);
    } else {
      navigate('/auth');
    }
  };

  // LinkMAX unique advantages - what makes us different
  const uniqueAdvantages = [
    { 
      icon: Wand2, 
      title: t('landing.unique.ai.title', 'AI делает всё за вас'), 
      description: t('landing.unique.ai.desc', 'Опишите свой бизнес — получите готовую страницу за 2 минуты. Никакого конструирования вручную.'),
      gradient: 'from-violet-500 to-purple-600',
      stat: '2 мин'
    },
    { 
      icon: Percent, 
      title: t('landing.unique.price.title', '0% комиссии'), 
      description: t('landing.unique.price.desc', 'Все деньги от продаж — ваши. Мы не берём процент с транзакций.'),
      gradient: 'from-emerald-500 to-teal-500',
      stat: '0%'
    },
    { 
      icon: Trophy, 
      title: t('landing.unique.gamification.title', 'Геймификация'), 
      description: t('landing.unique.gamification.desc', 'Достижения, ежедневные квесты, стрики и награды. Ведение страницы становится игрой.'),
      gradient: 'from-amber-500 to-orange-500',
      stat: '🏆'
    },
    { 
      icon: Users, 
      title: t('landing.unique.community.title', 'Сообщество'), 
      description: t('landing.unique.community.desc', 'Галерея страниц, коллаборации, команды, шаут-ауты. Растите вместе с другими.'),
      gradient: 'from-pink-500 to-rose-500',
      stat: '∞'
    },
  ];

  // Who is LinkMAX for - specific niches
  const targetAudiences = [
    { icon: Scissors, label: t('landing.audiences.items.barber', 'Барберы'), color: 'from-blue-500 to-cyan-500' },
    { icon: Camera, label: t('landing.audiences.items.photographer', 'Фотографы'), color: 'from-purple-500 to-violet-500' },
    { icon: Dumbbell, label: t('landing.audiences.items.coach', 'Тренеры'), color: 'from-emerald-500 to-teal-500' },
    { icon: GraduationCap, label: t('landing.audiences.items.tutor', 'Репетиторы'), color: 'from-amber-500 to-orange-500' },
    { icon: Heart, label: t('landing.audiences.items.beauty', 'Мастера красоты'), color: 'from-pink-500 to-rose-500' },
    { icon: Brain, label: t('landing.audiences.items.psychologist', 'Психологи'), color: 'from-indigo-500 to-blue-500' },
    { icon: Coffee, label: t('landing.audiences.items.cafe', 'Кофейни'), color: 'from-amber-600 to-yellow-500' },
    { icon: ShoppingBag, label: t('landing.audiences.items.shop', 'Магазины'), color: 'from-teal-500 to-cyan-500' },
    { icon: Building2, label: t('landing.audiences.items.agency', 'Агентства'), color: 'from-slate-500 to-zinc-600' },
    { icon: Stethoscope, label: t('landing.audiences.items.clinic', 'Клиники'), color: 'from-sky-500 to-blue-500' },
    { icon: School, label: t('landing.audiences.items.school', 'Школы'), color: 'from-green-500 to-emerald-500' },
    { icon: Wrench, label: t('landing.audiences.items.service', 'Сервисы'), color: 'from-orange-500 to-red-500' },
  ];

  // What can you do with LinkMAX
  const capabilities = [
    { icon: Link2, title: t('landing.capabilities.links.title', 'Все ссылки в одном месте'), description: t('landing.capabilities.links.desc', 'Соцсети, мессенджеры, портфолио — одна ссылка для всего') },
    { icon: CreditCard, title: t('landing.capabilities.sell.title', 'Продавайте услуги'), description: t('landing.capabilities.sell.desc', 'Каталог товаров, прайс-листы, онлайн-запись и оплата') },
    { icon: BarChart3, title: t('landing.capabilities.analytics.title', 'Аналитика кликов'), description: t('landing.capabilities.analytics.desc', 'Узнайте, какие ссылки работают лучше всего') },
    { icon: MessageSquare, title: t('landing.capabilities.crm.title', 'Мини-CRM'), description: t('landing.capabilities.crm.desc', 'Управляйте лидами и заявками прямо в платформе') },
    { icon: Users, title: t('landing.capabilities.teams.title', 'Команды'), description: t('landing.capabilities.teams.desc', 'Создавайте командные страницы вместе с коллегами') },
    { icon: Bot, title: t('landing.capabilities.aiGen.title', 'AI-генерация'), description: t('landing.capabilities.aiGen.desc', 'Контент, тексты, структура — всё создаётся автоматически') },
  ];

  // Stats
  const stats = [
    { value: '2', suffix: t('landing.stats.minutesSuffix', ' мин'), label: t('landing.stats.timeLabel', 'На создание страницы') },
    { value: '20+', suffix: '', label: t('landing.stats.blocksLabel', 'Типов блоков') },
    { value: '0', suffix: '%', label: t('landing.stats.commissionLabel', 'Комиссия платформы') },
  ];

  // Pricing features
  const freeFeatures = [
    t('landing.pricing.features.free.presetThemes'),
    t('landing.pricing.features.free.unlimitedLinks'),
    t('landing.pricing.features.free.basicBlocks'),
    t('landing.pricing.features.free.messengers'),
    t('landing.pricing.features.free.maps'),
    t('landing.pricing.features.free.basicStats'),
    t('landing.pricing.features.free.qrCode'),
    t('landing.pricing.features.free.ai3'),
  ];

  const proFeatures = [
    t('landing.pricing.features.pro.allFree'),
    t('landing.pricing.features.pro.proThemes'),
    t('landing.pricing.features.pro.media'),
    t('landing.pricing.features.pro.pricing'),
    t('landing.pricing.features.pro.scheduler'),
    t('landing.pricing.features.pro.clickAnalytics'),
    t('landing.pricing.features.pro.noWatermark'),
    t('landing.pricing.features.pro.miniCrm'),
    t('landing.pricing.features.pro.unlimitedAi'),
  ];

  const businessFeatures = [
    t('landing.pricing.features.business.allPro'),
    t('landing.pricing.features.business.payments'),
    t('landing.pricing.features.business.whiteLabel'),
    t('landing.pricing.features.business.fullCrm'),
    t('landing.pricing.features.business.customDomain'),
    t('landing.pricing.features.business.marketingAddons'),
  ];

  // Billing period state
  const [billingPeriod, setBillingPeriod] = useState<'3' | '6' | '12'>('12');

  const pricingPlans = {
    pro: {
      '3': { monthly: 6.25, total: 18.75 },
      '6': { monthly: 4.40, total: 26.40 },
      '12': { monthly: 3.15, total: 37.80 },
    },
    business: {
      '3': { monthly: 14.25, total: 42.75 },
      '6': { monthly: 10.50, total: 63 },
      '12': { monthly: 7.50, total: 90 },
    }
  };

  const getSavingsPercent = (plan: 'pro' | 'business') => {
    const baseMonthly = pricingPlans[plan]['3'].monthly;
    const currentMonthly = pricingPlans[plan][billingPeriod].monthly;
    return Math.round((1 - currentMonthly / baseMonthly) * 100);
  };

  // Animation refs
  const heroSection = useScrollAnimation();
  const statsSection = useScrollAnimation();
  const uniqueSection = useScrollAnimation();
  const audiencesSection = useScrollAnimation();
  const capabilitiesSection = useScrollAnimation();
  const useCasesSection = useScrollAnimation();
  const pricingSection = useScrollAnimation();
  const faqSection = useScrollAnimation();
  const ctaSection = useScrollAnimation();

  return (
    <>
      <SEOLandingHead currentLanguage={i18n.language} />
      <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Korner-style Grid Background - Simplified on mobile for performance */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Subtle gradient blobs - reduced blur on mobile */}
        <div className="absolute -top-40 -left-40 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] lg:w-[1000px] lg:h-[1000px] bg-gradient-to-br from-primary/10 sm:from-primary/15 via-violet-500/5 sm:via-violet-500/10 to-transparent rounded-full blur-[60px] sm:blur-[120px] lg:blur-[180px]" />
        <div className="hidden sm:block absolute top-1/3 -right-20 w-[400px] h-[400px] lg:w-[800px] lg:h-[800px] bg-gradient-to-bl from-blue-500/12 via-cyan-500/8 to-transparent rounded-full blur-[100px] lg:blur-[150px]" />
        <div className="hidden sm:block absolute -bottom-20 left-1/4 w-[500px] h-[500px] lg:w-[900px] lg:h-[900px] bg-gradient-to-tr from-purple-500/12 via-pink-500/8 to-transparent rounded-full blur-[120px] lg:blur-[160px]" />
        
        {/* Multi-layer animated grid with edge fade */}
        <div className="absolute inset-0 grid-fade-edges">
          <div 
            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.015] animate-grid-morph-1"
            style={{
              backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
            }}
          />
          <div 
            className="absolute inset-0 opacity-[0.02] dark:opacity-[0.012] animate-grid-morph-2"
            style={{
              backgroundImage: `linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)`,
            }}
          />
          <div 
            className="absolute inset-0 opacity-[0.015] dark:opacity-[0.01] animate-grid-morph-3"
            style={{
              backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 0.5px, transparent 0.5px), linear-gradient(to bottom, hsl(var(--foreground)) 0.5px, transparent 0.5px)`,
            }}
          />
        </div>
        
        {/* Diagonal accent lines - hidden on mobile for performance */}
        <svg className="hidden lg:block absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diagonal-lines" patternUnits="userSpaceOnUse" width="100" height="100" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="100" stroke="hsl(var(--foreground))" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diagonal-lines)" />
        </svg>
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

      {/* Hero Section - Clean and focused */}
      <section ref={heroSection.ref} className="relative pt-32 sm:pt-40 lg:pt-48 pb-16 sm:pb-24 lg:pb-32 px-5 sm:px-6">
        {/* Defer Hero3D until visible for better LCP */}
        {!isMobile && heroSection.isVisible && (
          <div className="hidden lg:block">
            <Suspense fallback={null}>
              <Hero3D />
            </Suspense>
          </div>
        )}
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left - Text content */}
            <div className="space-y-8">
              <div className={`space-y-6 opacity-0 ${heroSection.isVisible ? 'animate-blur-in' : ''}`}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-primary">{t('landing.hero.badge', 'AI-powered link-in-bio')}</span>
                </div>
                
                <h1 className="text-[2.5rem] sm:text-[3.5rem] lg:text-[4.5rem] font-extrabold tracking-[-0.02em] leading-[1.05]">
                  {t('landing.hero.title', 'Страница, которая')}
                  <br />
                  <span className="text-gradient bg-[length:200%_auto] animate-gradient-x">
                    {t('landing.hero.titleHighlight', 'продаёт за вас.')}
                  </span>
                </h1>
                
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-md leading-relaxed font-normal">
                  {t('landing.hero.description', 'Создайте профессиональную страницу за 2 минуты с помощью AI. Все ссылки, услуги и контакты — в одном месте.')}
                </p>
              </div>

              {/* Username Input */}
              <div 
                className={`opacity-0 ${heroSection.isVisible ? 'animate-fade-in-up' : ''}`}
                style={{ animationDelay: '200ms' }}
              >
                <div className="relative flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-card/80 backdrop-blur-2xl border border-border/50 shadow-glass-lg max-w-md">
                  <div className="flex-shrink-0 pl-2 sm:pl-4 text-muted-foreground font-medium text-xs sm:text-sm">
                    lnkmx.my/
                  </div>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder={t('landing.hero.usernamePlaceholder', 'yourname')}
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-lg font-medium placeholder:text-muted-foreground/50"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
                  />
                  <Button 
                    onClick={handleCreatePage}
                    className="rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl transition-all duration-300 px-4 sm:px-6 py-4 sm:py-5"
                  >
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3 flex flex-wrap items-center gap-2 sm:gap-4">
                  <span className="flex items-center gap-1">
                    <Check className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    {t('landing.hero.free', 'Бесплатно')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    {t('landing.hero.noCode', 'Без кода')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                    {t('landing.hero.aiHelps', 'AI помогает')}
                  </span>
                </p>
              </div>
            </div>

            {/* Right - Phone mockup */}
            <div 
              className={`relative flex justify-center opacity-0 ${heroSection.isVisible ? 'animate-slide-in-up' : ''}`}
              style={{ animationDelay: '400ms' }}
            >
              <div className="relative">
                {/* Floating badges */}
                <div className="absolute -top-4 -left-4 p-3 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-glass-lg animate-float z-30">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Wand2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-bold">{t('landing.hero.badges.aiReady', 'AI Ready')}</span>
                      <div className="text-xs text-muted-foreground">{t('landing.hero.badges.autoGenerate', 'Auto-generate')}</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute -bottom-4 -left-8 p-3 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-glass-lg animate-float z-30" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-emerald-500">+247%</span>
                      <div className="text-xs text-muted-foreground">{t('landing.hero.badges.clicks', 'Clicks')}</div>
                    </div>
                  </div>
                </div>

                <div className="absolute top-1/3 -right-4 p-3 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/50 shadow-glass-lg animate-float z-30" style={{ animationDelay: '2s' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                      <BadgeCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <span className="text-sm font-bold">{t('landing.hero.badges.verified', 'Verified')}</span>
                      <div className="text-xs text-muted-foreground">{t('landing.hero.badges.premium', 'Premium')}</div>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="relative w-[260px] sm:w-[300px] h-[520px] sm:h-[600px] bg-foreground/95 rounded-[2.5rem] p-2.5 shadow-2xl border border-foreground/10">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-foreground rounded-b-2xl z-10" />
                  
                  <div className="relative h-full w-full bg-background rounded-[2rem] overflow-hidden">
                    <div className="p-4 space-y-3">
                      <div className="pt-8 flex flex-col items-center space-y-3">
                        <div className="relative">
                          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary via-blue-500 to-primary p-0.5 shadow-xl">
                            <div className="h-full w-full rounded-full bg-card flex items-center justify-center">
                              <span className="text-2xl">👤</span>
                            </div>
                          </div>
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        </div>
                        <div className="text-center">
                          <h3 className="font-bold text-lg">{t('landing.hero.mockup.name', 'Alex Creator')}</h3>
                          <p className="text-xs text-muted-foreground">{t('landing.hero.mockup.role', 'Digital Artist')}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-blue-500 text-white text-center font-semibold text-sm shadow-lg">
                          🎨 {t('landing.hero.mockup.portfolio', 'Portfolio')}
                        </div>
                        <div className="p-3 rounded-xl bg-card border border-border/50 text-center font-medium text-sm">
                          📸 Instagram
                        </div>
                        <div className="p-3 rounded-xl bg-card border border-border/50 text-center font-medium text-sm">
                          🎥 YouTube
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="aspect-square rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white text-lg">📱</div>
                          <div className="aspect-square rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-lg">💬</div>
                          <div className="aspect-square rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg">✉️</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/30 via-blue-500/20 to-purple-500/30 rounded-[3rem] blur-[60px] opacity-60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section ref={statsSection.ref} className="py-10 sm:py-14 px-5 sm:px-6 border-y border-border/30 bg-muted/20 backdrop-blur-sm">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-3 gap-3 sm:gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`text-center opacity-0 ${statsSection.isVisible ? 'animate-stagger-in' : ''}`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gradient">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What makes LinkMAX unique */}
      <section ref={uniqueSection.ref} className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 sm:mb-14 lg:mb-20 space-y-4 sm:space-y-5">
            <h2 
              className={`text-2xl sm:text-4xl lg:text-[3.5rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${uniqueSection.isVisible ? 'animate-blur-in' : ''}`}
            >
              {t('landing.unique.title', 'Почему выбирают LinkMAX.')}
            </h2>
            <p 
              className={`text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl mx-auto opacity-0 font-normal ${uniqueSection.isVisible ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '200ms' }}
            >
              {t('landing.unique.subtitle', 'Не просто конструктор — умный помощник для вашего бизнеса')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {uniqueAdvantages.map((advantage, index) => (
              <div 
                key={index}
                className={`group relative p-5 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-card/60 backdrop-blur-2xl border border-border/40 hover:border-primary/50 transition-all duration-500 hover:shadow-glass-xl hover:-translate-y-1 sm:hover:-translate-y-2 opacity-0 ${uniqueSection.isVisible ? 'animate-slide-in-up' : ''}`}
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className={`absolute -inset-px rounded-2xl sm:rounded-3xl bg-gradient-to-br ${advantage.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
                
                <div className={`absolute top-2 sm:top-4 right-2 sm:right-4 text-lg sm:text-2xl font-bold text-muted-foreground/20 opacity-0 ${uniqueSection.isVisible ? 'animate-fade-in' : ''}`} style={{ animationDelay: `${300 + index * 120}ms` }}>
                  {advantage.stat}
                </div>
                
                <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${advantage.gradient} flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <advantage.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                
                <h3 className="text-base sm:text-lg font-bold mb-2">{advantage.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target audiences carousel */}
      <section ref={audiencesSection.ref} className="py-14 sm:py-20 lg:py-24 px-5 sm:px-6 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4">
            <h2 
              className={`text-xl sm:text-3xl lg:text-[2.75rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${audiencesSection.isVisible ? 'animate-blur-in' : ''}`}
            >
              {t('landing.audiences.title', 'Для кого LinkMAX?')}
            </h2>
            <p className={`text-xs sm:text-sm lg:text-base text-muted-foreground opacity-0 font-normal ${audiencesSection.isVisible ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '150ms' }}>
              {t('landing.audiences.subtitle', 'Идеально подходит для экспертов, фрилансеров и малого бизнеса')}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {targetAudiences.map((audience, index) => (
              <div 
                key={index}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/40 hover:border-primary/50 hover:shadow-glass transition-all duration-300 cursor-default group opacity-0 ${audiencesSection.isVisible ? 'animate-stagger-in' : ''}`}
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                <div className={`h-6 w-6 sm:h-8 sm:w-8 rounded-md sm:rounded-lg bg-gradient-to-br ${audience.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <audience.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium">{audience.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section ref={capabilitiesSection.ref} className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10 sm:mb-14 lg:mb-20 space-y-4 sm:space-y-5">
            <h2 
              className={`text-2xl sm:text-4xl lg:text-[3.5rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${capabilitiesSection.isVisible ? 'animate-blur-in' : ''}`}
            >
              {t('landing.capabilities.title', 'Всё для вашей страницы.')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {capabilities.map((cap, index) => (
              <div 
                key={index}
                className={`group p-5 sm:p-6 lg:p-8 rounded-2xl bg-card/50 backdrop-blur-xl border border-border/30 hover:border-primary/40 transition-all duration-300 hover:shadow-glass-lg hover:-translate-y-1 opacity-0 ${capabilitiesSection.isVisible ? 'animate-slide-in-up' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                  <cap.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-2">{cap.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo - Lazy loaded */}
      <Suspense fallback={<div className="py-16 sm:py-24 lg:py-32 flex justify-center"><div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
        <InteractiveDemo />
      </Suspense>

      {/* Use Cases Gallery - Lazy loaded */}
      <Suspense fallback={null}>
        <UseCasesGallery />
      </Suspense>

      {/* Featured Pages from Gallery - Lazy loaded */}
      <Suspense fallback={null}>
        <LandingGallerySection />
      </Suspense>

      {/* Pricing */}
      <section ref={pricingSection.ref} className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-gradient-to-r from-primary/8 via-transparent to-transparent rounded-full blur-[100px] sm:blur-[120px]" />
        </div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-10 sm:mb-14 lg:mb-20 space-y-4 sm:space-y-5">
            <div 
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium opacity-0 ${pricingSection.isVisible ? 'animate-fade-in' : ''}`}
            >
              <Crown className="h-4 w-4 text-primary" />
              <span className="text-primary">{t('landing.pricing.badge')}</span>
            </div>
            <h2 
              className={`text-2xl sm:text-4xl lg:text-[3.5rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${pricingSection.isVisible ? 'animate-blur-in' : ''}`}
              style={{ animationDelay: '150ms' }}
            >
              {t('landing.pricing.title')}
            </h2>

            {/* Billing Period Selector */}
            <div 
              className={`flex items-center justify-center gap-2 pt-3 sm:pt-4 opacity-0 ${pricingSection.isVisible ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '300ms' }}
            >
              <div className="inline-flex p-1 rounded-xl sm:rounded-2xl bg-muted/50 border border-border/30">
                {(['3', '6', '12'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setBillingPeriod(period)}
                    className={`relative px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                      billingPeriod === period 
                        ? 'bg-primary text-primary-foreground shadow-lg' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t(`landing.pricing.months${period}`)}
                    {period === '12' && (
                      <span className="absolute -top-2 -right-2 px-1 sm:px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] sm:text-[10px] font-bold">
                        -50%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <div 
              className={`relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/50 backdrop-blur-xl border border-border/30 opacity-0 ${pricingSection.isVisible ? 'animate-slide-in-left' : ''}`}
              style={{ animationDelay: '400ms' }}
            >
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">{t('landing.pricing.free.title')}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-1">{t('landing.pricing.free.description')}</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground text-xs sm:text-sm">/{t('landing.pricing.month')}</span>
                </div>

                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full rounded-xl sm:rounded-2xl py-4 sm:py-5"
                  onClick={() => navigate('/auth')}
                >
                  {t('landing.pricing.free.cta')}
                </Button>

                <div className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-3">
                  {freeFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-[10px] sm:text-xs text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pro */}
            <div 
              className={`relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/50 backdrop-blur-xl border-2 border-primary/30 opacity-0 order-first sm:order-none ${pricingSection.isVisible ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '450ms' }}
            >
              <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs font-medium">
                {t('landing.pricing.popular')}
              </div>

              <div className="space-y-4 sm:space-y-5">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    {t('landing.pricing.pro.title')}
                    <Crown className="h-4 w-4 text-primary" />
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-1">{t('landing.pricing.pro.description')}</p>
                </div>
                
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold">
                      ${pricingPlans.pro[billingPeriod].monthly.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-xs sm:text-sm">/{t('landing.pricing.month')}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {t('landing.pricing.total')}: ${pricingPlans.pro[billingPeriod].total}
                  </p>
                </div>

                <Button 
                  size="lg" 
                  className="w-full rounded-xl sm:rounded-2xl py-4 sm:py-5 shadow-lg shadow-primary/25"
                  onClick={openPremiumPurchase}
                >
                  {t('landing.pricing.pro.cta')}
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>

                <div className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-3">
                  {proFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-[10px] sm:text-xs text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Business */}
            <div 
              className={`relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/50 backdrop-blur-xl border border-border/30 opacity-0 ${pricingSection.isVisible ? 'animate-slide-in-right' : ''}`}
              style={{ animationDelay: '500ms' }}
            >
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                    {t('landing.pricing.business.title')}
                    <Briefcase className="h-4 w-4 text-emerald-500" />
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mt-1">{t('landing.pricing.business.description')}</p>
                </div>
                
                <div className="space-y-0.5 sm:space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-bold">
                      ${pricingPlans.business[billingPeriod].monthly.toFixed(2)}
                    </span>
                    <span className="text-muted-foreground text-xs sm:text-sm">/{t('landing.pricing.month')}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {t('landing.pricing.total')}: ${pricingPlans.business[billingPeriod].total}
                  </p>
                </div>

                <Button 
                  variant="outline"
                  size="lg" 
                  className="w-full rounded-xl sm:rounded-2xl py-4 sm:py-5 border-emerald-500/30 hover:bg-emerald-500/10"
                  onClick={openPremiumPurchase}
                >
                  {t('landing.pricing.business.cta')}
                  <Briefcase className="ml-2 h-4 w-4 text-emerald-500" />
                </Button>

                <div className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-3">
                  {businessFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[10px] sm:text-xs text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`text-center mt-8 opacity-0 ${pricingSection.isVisible ? 'animate-fade-in-up' : ''}`} style={{ animationDelay: '600ms' }}>
            <p className="text-muted-foreground text-sm">
              <span className="font-semibold text-foreground">{t('landing.pricing.commission', '0% комиссии')}</span>
              {' '}{t('landing.pricing.commissionDesc', 'за все транзакции на платформе')}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section - Lazy loaded */}
      <Suspense fallback={null}>
        <FAQSection />
      </Suspense>

      {/* CTA Section */}
      <section ref={ctaSection.ref} className="py-12 sm:py-20 lg:py-28 px-4">
        <div className="container mx-auto max-w-4xl">
          <div 
            className={`relative overflow-hidden rounded-2xl sm:rounded-[2.5rem] bg-gradient-to-br from-primary via-blue-500 to-violet-600 p-6 sm:p-10 lg:p-16 text-center opacity-0 ${ctaSection.isVisible ? 'animate-scale-in' : ''}`}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 20% 30%, white 1.5px, transparent 1.5px)',
                backgroundSize: '50px 50px'
              }} />
            </div>
            
            <div className="absolute top-0 left-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-white/10 rounded-full blur-[60px] sm:blur-[80px] animate-morph" />
            <div className="absolute bottom-0 right-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-blue-400/20 rounded-full blur-[60px] sm:blur-[100px] animate-morph" style={{ animationDelay: '-4s' }} />
            
            <div className="relative z-10 space-y-4 sm:space-y-6">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/20 text-xs sm:text-sm font-semibold text-white">
                <Rocket className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>{t('landing.cta.badge', 'Готовы начать?')}</span>
              </div>
              
              <h2 className="text-2xl sm:text-4xl lg:text-[3.5rem] font-extrabold text-white tracking-[-0.02em] leading-tight">
                {t('landing.cta.title', 'Создайте страницу прямо сейчас.')}
              </h2>
              
              <div className="max-w-md mx-auto pt-2 sm:pt-4">
                <div className="relative flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30">
                  <div className="flex-shrink-0 pl-2 sm:pl-4 text-white/80 font-medium text-xs sm:text-sm">
                    lnkmx.my/
                  </div>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="yourname"
                    className="flex-1 border-0 bg-transparent focus-visible:ring-0 text-white placeholder:text-white/50 font-medium text-sm sm:text-base"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
                  />
                  <Button 
                    onClick={handleCreatePage}
                    className="rounded-lg sm:rounded-xl font-bold bg-white text-primary hover:bg-white/95 shadow-lg px-4 sm:px-6 py-3 sm:py-5 text-sm sm:text-base"
                  >
                    {t('landing.hero.create', 'Создать')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 sm:py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <span className="text-lg sm:text-xl font-bold">
                Link<span className="text-gradient">MAX</span>
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <TermsLink className="hover:text-foreground transition-colors cursor-pointer">
                  {t('legal.termsOfService')}
                </TermsLink>
                <span>•</span>
                <PrivacyLink className="hover:text-foreground transition-colors cursor-pointer">
                  {t('legal.privacyPolicy')}
                </PrivacyLink>
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
            <Sparkles className="h-5 w-5 mr-2" />
            {t('landing.floatingCta', 'Создать страницу бесплатно')}
          </Button>
        </div>
      )}
      </div>
    </>
  );
}

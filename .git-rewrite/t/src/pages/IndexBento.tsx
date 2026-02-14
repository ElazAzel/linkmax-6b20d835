import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Users, 
  Zap, 
  Crown, 
  BarChart3, 
  Bell, 
  Palette, 
  Globe,
  ArrowRight,
  Play,
  Star,
  Shield
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SEOLandingHead } from '@/components/landing/SEOLandingHead';
import { TermsLink } from '@/components/legal/TermsOfServiceModal';
import { PrivacyLink } from '@/components/legal/PrivacyPolicyModal';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Alternative landing page in Metro/Bento grid style
 * Minimalistic blocks with bold typography
 */
export default function IndexBento() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  const features = [
    {
      id: 'ai',
      title: t('landing.bento.ai.title', 'AI за 2 минуты'),
      description: t('landing.bento.ai.desc', 'Умный генератор создаст страницу под вашу нишу'),
      icon: Sparkles,
      color: 'from-violet-500 to-purple-600',
      size: 'large',
    },
    {
      id: 'crm',
      title: t('landing.bento.crm.title', 'Mini-CRM'),
      description: t('landing.bento.crm.desc', 'Все заявки в одном месте'),
      icon: BarChart3,
      color: 'from-emerald-500 to-teal-600',
      size: 'medium',
    },
    {
      id: 'notifications',
      title: t('landing.bento.notifications.title', 'Telegram'),
      description: t('landing.bento.notifications.desc', 'Мгновенные уведомления'),
      icon: Bell,
      color: 'from-blue-500 to-cyan-600',
      size: 'medium',
    },
    {
      id: 'themes',
      title: t('landing.bento.themes.title', 'Темы'),
      description: t('landing.bento.themes.desc', '20+ готовых дизайнов'),
      icon: Palette,
      color: 'from-pink-500 to-rose-600',
      size: 'small',
    },
    {
      id: 'analytics',
      title: t('landing.bento.analytics.title', 'Аналитика'),
      description: t('landing.bento.analytics.desc', 'CTR, источники, устройства'),
      icon: BarChart3,
      color: 'from-amber-500 to-orange-600',
      size: 'small',
    },
    {
      id: 'global',
      title: t('landing.bento.global.title', 'Глобально'),
      description: t('landing.bento.global.desc', 'Работает везде'),
      icon: Globe,
      color: 'from-indigo-500 to-blue-600',
      size: 'small',
    },
  ];

  const audiences = [
    { emoji: '💇‍♀️', label: t('landing.audience.beauty', 'Бьюти-мастера') },
    { emoji: '🏋️', label: t('landing.audience.fitness', 'Фитнес-тренеры') },
    { emoji: '📸', label: t('landing.audience.photo', 'Фотографы') },
    { emoji: '🎓', label: t('landing.audience.experts', 'Эксперты') },
    { emoji: '🛍️', label: t('landing.audience.shops', 'Магазины') },
    { emoji: '🎨', label: t('landing.audience.creators', 'Креаторы') },
  ];

  return (
    <>
      <SEOLandingHead currentLanguage={i18n.language} />
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50">
          <div className="mx-3 sm:mx-6 mt-3 sm:mt-4">
            <div className="backdrop-blur-2xl bg-card/70 border border-border/40 rounded-2xl shadow-glass-lg">
              <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
                <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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
                    onClick={() => navigate('/auth')}
                    className="rounded-xl font-medium shadow-lg shadow-primary/30"
                    size="sm"
                  >
                    {t('landing.nav.getStarted', 'Начать')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero - Bento Style */}
        <section className="pt-28 sm:pt-36 pb-12 px-4 sm:px-6">
          <div className="container mx-auto max-w-6xl">
            {/* Main Hero Block */}
            <div className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-primary/10 via-violet-500/5 to-transparent border border-primary/20 mb-6 overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
              
              <div className="relative z-10 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium mb-6">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-primary">{t('landing.hero.badge', 'Бесплатно навсегда')}</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                  {t('landing.hero.title', 'Ваша визитка')}
                  <br />
                  <span className="text-gradient">{t('landing.hero.titleHighlight', 'за 2 минуты')}</span>
                </h1>
                
                <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-lg">
                  {t('landing.hero.subtitle', 'Создайте профессиональную страницу с AI и получайте клиентов')}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/auth')}
                    className="rounded-xl text-base font-semibold shadow-xl shadow-primary/30 hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    {t('landing.hero.cta', 'Создать бесплатно')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    onClick={() => navigate('/gallery')}
                    className="rounded-xl text-base font-medium"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {t('landing.hero.demo', 'Смотреть примеры')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Audience Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {audiences.map((audience, i) => (
                <div 
                  key={i}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50 text-sm font-medium hover:bg-card hover:border-primary/30 transition-all cursor-default"
                >
                  <span className="text-lg">{audience.emoji}</span>
                  <span>{audience.label}</span>
                </div>
              ))}
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                const isHovered = hoveredBlock === feature.id;
                
                return (
                  <div
                    key={feature.id}
                    className={cn(
                      'group relative p-6 rounded-2xl bg-card/50 border border-border/50 cursor-pointer transition-all duration-300',
                      'hover:bg-card hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1',
                      feature.size === 'large' && 'col-span-2 row-span-2',
                      feature.size === 'medium' && 'col-span-2 md:col-span-1 row-span-1',
                      feature.size === 'small' && 'col-span-1'
                    )}
                    onMouseEnter={() => setHoveredBlock(feature.id)}
                    onMouseLeave={() => setHoveredBlock(null)}
                  >
                    <div 
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300',
                        `bg-gradient-to-br ${feature.color}`,
                        isHovered && 'scale-110'
                      )}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <h3 className={cn(
                      'font-bold mb-2 transition-colors',
                      feature.size === 'large' ? 'text-2xl' : 'text-lg',
                      isHovered && 'text-primary'
                    )}>
                      {feature.title}
                    </h3>
                    
                    <p className={cn(
                      'text-muted-foreground',
                      feature.size === 'large' ? 'text-base' : 'text-sm'
                    )}>
                      {feature.description}
                    </p>
                    
                    {feature.size === 'large' && (
                      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pricing Block */}
        <section className="py-16 px-4 sm:px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Free */}
              <div className="p-8 rounded-2xl bg-card/50 border border-border/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{t('landing.pricing.free', 'Бесплатно')}</h3>
                    <p className="text-sm text-muted-foreground">{t('landing.pricing.freeDesc', 'Навсегда')}</p>
                  </div>
                </div>
                <div className="text-3xl font-bold mb-6">$0</div>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    {t('landing.pricing.freeF1', 'Базовые блоки')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    {t('landing.pricing.freeF2', '1 AI генерация в месяц')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    {t('landing.pricing.freeF3', 'QR-код страницы')}
                  </li>
                </ul>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate('/auth')}>
                  {t('landing.pricing.startFree', 'Начать бесплатно')}
                </Button>
              </div>

              {/* Pro */}
              <div className="relative p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/5 border-2 border-primary/30">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  {t('landing.pricing.popular', 'Популярный')}
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{t('landing.pricing.pro', 'PRO')}</h3>
                    <p className="text-sm text-muted-foreground">{t('landing.pricing.proDesc', 'Всё включено')}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-3xl font-bold">$5.10</span>
                  <span className="text-muted-foreground">/{t('pricing.month', 'мес')}</span>
                  <span className="text-xs text-emerald-500 font-medium">-40%</span>
                </div>
                <ul className="space-y-2 text-sm mb-6">
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium">{t('landing.pricing.proF1', 'Mini-CRM без лимитов')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium">{t('landing.pricing.proF2', 'Telegram-уведомления')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-medium">{t('landing.pricing.proF3', '5 AI генераций в месяц')}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    {t('landing.pricing.proF4', 'Все блоки и функции')}
                  </li>
                </ul>
                <Button className="w-full rounded-xl shadow-lg shadow-primary/30" onClick={() => navigate('/pricing')}>
                  <Crown className="h-4 w-4 mr-2" />
                  {t('landing.pricing.getPro', 'Получить PRO')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <span className="text-lg font-bold">
                    Link<span className="text-gradient">MAX</span>
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-muted-foreground">
                  <span onClick={() => navigate('/pricing')} className="hover:text-foreground transition-colors cursor-pointer">
                    {t('pricing.title', 'Тарифы')}
                  </span>
                  <span>•</span>
                  <TermsLink className="hover:text-foreground transition-colors cursor-pointer">
                    {t('legal.termsOfService', 'Условия')}
                  </TermsLink>
                  <span>•</span>
                  <PrivacyLink className="hover:text-foreground transition-colors cursor-pointer">
                    {t('legal.privacyPolicy', 'Конфиденциальность')}
                  </PrivacyLink>
                </div>
              </div>
              
              {/* Company Details for RoboKassa compliance */}
              <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
                <p className="mb-1">{t('pricing.companyDetails.nameLine', 'ИП BEEGIN • БИН: 971207300019')}</p>
                <p className="mb-2">{t('pricing.companyDetails.addressLine', 'г. Алматы, ул. Шолохова, д. 20/7')}</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <a href="mailto:admin@lnkmx.my" className="hover:text-foreground transition-colors">
                    admin@lnkmx.my
                  </a>
                  <span>•</span>
                  <a href="tel:+77051097664" className="hover:text-foreground transition-colors">
                    +7 705 109 7664
                  </a>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                {t('landing.footer.copyright', '© 2025 LinkMAX')}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

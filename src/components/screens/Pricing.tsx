'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Check from 'lucide-react/dist/esm/icons/check';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Star from 'lucide-react/dist/esm/icons/star';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Shield from 'lucide-react/dist/esm/icons/shield';
import { LanguageSwitcher } from '@/components/translation/LanguageSwitcher';
import { usePremiumStatus } from '@/hooks/user/usePremiumStatus';
import { toast } from 'sonner';
import { useRobokassa } from '@/hooks/useRobokassa';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { SEOMetaEnhancer } from '@/components/seo/SEOMetaEnhancer';
import { GEOTagging } from '@/components/seo/GEOTagging';
import { AISearchOptimizer } from '@/components/seo/AISearchOptimizer';
import { cn } from '@/lib/utils/utils';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { useCurrencyRate, BASE_PRICES_USD, convertUsdToKzt, FIXED_PRICES_KZT, getTotalPriceKzt } from '@/hooks/useCurrencyRate';

type BillingPeriod = 3 | 6 | 12;

export default function Pricing() {
  const navigate = useNavigate();
  const {
    t,
    i18n
  } = useTranslation();
  const {
    isPremium,
    tier,
    isLoading
  } = usePremiumStatus();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(12);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: currentRate = 497.33 } = useCurrencyRate();
  const isKztPrimary = i18n.language === 'ru' || i18n.language === 'kk';
  const canonical = `${getAppDomain()}/pricing`;
  const seoTitle = t('pricing.seo.title', 'LinkMAX Pricing — Plans for Link in Bio & Mini-Sites');
  const seoDescription = t('pricing.seo.description', 'Compare LinkMAX plans: free link in bio builder, Pro with AI, CRM, analytics, and custom domains. Transparent pricing in minutes.');

  // Pricing: fixed KZT prices, USD derived from rate
  const pricingPlans = {
    basic: {
      name: 'BASIC',
      icon: Zap,
      color: 'from-slate-500 to-slate-600',
      pricesKzt: { 3: 0, 6: 0, 12: 0 },
      pricesUsd: { 3: 0, 6: 0, 12: 0 },
      totalKzt: { 3: 0, 6: 0, 12: 0 },
      totalUsd: { 3: 0, 6: 0, 12: 0 },
      features: [t('pricing.features.basicThemes', 'Базовые темы оформления'), t('pricing.features.basicCustomization', 'Базовая настройка (цвета, шрифты)'), t('pricing.features.unlimitedLinks', 'Неограниченные ссылки'), t('pricing.features.basicBlocks', 'Базовые блоки (Профиль, Ссылка, Текст, Фото, Кнопка, Соцсети)'), t('pricing.features.messengers', 'Мессенджеры и соцсети'), t('pricing.features.maps', 'Карты (адрес + карта)'), t('pricing.features.basicViewStats', 'Базовая статистика просмотров'), t('pricing.features.qrCode', 'QR-код страницы'), t('pricing.features.aiMonthly', '1 AI-генерация в месяц')],
      limitations: [t('pricing.limitations.watermark', 'Водяной знак LinkMAX.my')]
    },
    pro: {
      name: 'PRO',
      icon: Crown,
      color: 'from-violet-500 to-purple-600',
      popular: true,
      pricesKzt: {
        3: FIXED_PRICES_KZT[3],
        6: FIXED_PRICES_KZT[6],
        12: FIXED_PRICES_KZT[12]
      },
      pricesUsd: BASE_PRICES_USD,
      totalKzt: {
        3: getTotalPriceKzt(3),
        6: getTotalPriceKzt(6),
        12: getTotalPriceKzt(12)
      },
      totalUsd: {
        3: +(BASE_PRICES_USD[3] * 3).toFixed(2),
        6: +(BASE_PRICES_USD[6] * 6).toFixed(2),
        12: +(BASE_PRICES_USD[12] * 12).toFixed(2)
      },
      features: [
        t('pricing.features.unlimitedInbound', 'Безлимитные обращения клиентов'),
        t('pricing.features.noWatermark', 'Без водяного знака — ваш бренд'),
        t('pricing.features.advancedAnalytics', 'Расширенная аналитика кликов'),
        t('pricing.features.exportAndAutomation', 'Экспорт + Telegram-уведомления'),
        t('pricing.features.allBlocks', 'Все 25+ типов блоков'),
        t('pricing.features.multiPage', 'До 6 страниц'),
        t('pricing.features.customDomain', 'Свой домен'),
        t('pricing.features.aiMonthlyPro', '10 AI-генераций в месяц'),
      ]
    },
  
  };
  const getSavingsPercent = (period: BillingPeriod): number => {
    if (period === 12) return 30;
    if (period === 6) return 15;
    return 0;
  };
  // Payment hook
  const { buySubscription, isLoading: isPaymentLoading } = useRobokassa();

  const handleSelectPlan = async (planKey: string) => {
    if (planKey === 'basic') {
      toast.info(t('pricing.alreadyFree', 'Бесплатный тариф уже активен'));
      return;
    }

    // Initiate RoboKassa payment
    if (planKey === 'pro') {
      await buySubscription('pro', billingPeriod);
    }
  };
  const getCurrentPlanBadge = (planKey: string) => {
    // Map identity to basic for display purposes
    const currentPlan = tier === 'identity' ? 'basic' : tier;
    if (currentPlan === planKey) {
      return <Badge variant="secondary" className="ml-2">
        {t('pricing.currentPlan', 'Текущий')}
      </Badge>;
    }
    return null;
  };
  return <>
    <StaticSEOHead title={seoTitle} description={seoDescription} canonical={canonical} currentLanguage={i18n.language} alternates={[{
      hreflang: 'ru',
      href: `${canonical}?lang=ru`
    }, {
      hreflang: 'en',
      href: `${canonical}?lang=en`
    }, {
      hreflang: 'kk',
      href: `${canonical}?lang=kk`
    }, {
      hreflang: 'x-default',
      href: canonical
    }]} />
    <SEOMetaEnhancer
      pageUrl={canonical}
      pageTitle={seoTitle}
      pageDescription={seoDescription}
      imageUrl={`${getAppDomain()}/og-pricing.png`}
      imageAlt={t('pricing.seo.imageAlt', 'LinkMAX Pricing Plans')}
      type="website"
    />
    <GEOTagging includeOrganization={false} />
    <AISearchOptimizer
      pageType="pricing"
      primaryQuestion={t('pricing.seo.opt.question', 'How much does LinkMAX cost?')}
      primaryAnswer={t('pricing.seo.opt.answer', 'LinkMAX offers a free Basic plan and a Pro plan starting from 3,045 KZT (approximately $6 USD) for 12 months. Pro features include unlimited pages, custom domains, analytics, and priority support.')}
      entityName="LinkMAX Pricing"
      entityCategory="SaaS Pricing, Subscription Plans, Link in Bio Pricing"
      useCases={[
        t('pricing.seo.opt.uses.1', 'Start free with Basic plan'),
        t('pricing.seo.opt.uses.2', 'Upgrade to Pro for advanced features'),
        t('pricing.seo.opt.uses.3', 'Pay for 3, 6, or 12 months'),
        t('pricing.seo.opt.uses.4', 'Use tokens for flexible premium access'),
      ]}
      targetAudience={[
        t('pricing.seo.opt.audience.1', 'Budget-conscious small businesses'),
        t('pricing.seo.opt.audience.2', 'Freelancers looking for affordable tools'),
        t('pricing.seo.opt.audience.3', 'Growing businesses needing more features'),
      ]}
      problemStatement={t('pricing.seo.opt.problem', 'Most link-in-bio and page builder tools are too expensive for micro-businesses and freelancers')}
      solutionStatement={t('pricing.seo.opt.solution', 'LinkMAX offers a free plan for basic needs and affordable Pro pricing starting at just $6 for 12 months')}
      keyFeatures={[
        t('pricing.seo.opt.features.1', 'Free Basic plan available'),
        t('pricing.seo.opt.features.2', 'Pro plan: 3,045 KZT/mo (Annual)'),
        t('pricing.seo.opt.features.3', 'Volume discounts: up to 30% off for 12 months'),
        t('pricing.seo.opt.features.4', 'Multi-currency support (KZT, USD)'),
        t('pricing.seo.opt.features.5', 'Flexible token system'),
        t('pricing.seo.opt.features.6', 'No credit card required for free plan'),
      ]}
    />
    <div className="min-h-screen bg-background relative overflow-x-hidden pb-safe">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-bl from-primary/20 via-violet-500/10 to-transparent rounded-full blur-[150px] animate-morph" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-[120px] animate-morph" style={{
          animationDelay: '-7s'
        }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50">
        <div className="mx-4 mt-3">
          <div className="backdrop-blur-2xl bg-card/50 border border-border/30 rounded-2xl shadow-glass-lg">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                  <img src="/favicon.png" alt="LinkMAX" className="h-8 w-8 rounded-xl object-contain" />
                  <h1 className="text-xl font-bold text-primary">
                    {t('pricing.title', 'Тарифы')}
                  </h1>
                </div>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl pb-24 md:pb-8">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h2 data-testid="pricing-title" className="text-3xl sm:text-4xl font-bold mb-4">
            {t('pricing.choosePlan', 'Выберите подходящий тариф')}
          </h2>
          <p data-testid="pricing-description" className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('pricing.description', 'Разблокируйте все возможности LinkMAX.my для вашего бизнеса')}
          </p>
        </div>

        {/* Billing Period Selector */}
        {/* Billing Period Selector - Mobile Optimized */}
        <div className="flex justify-center mb-8 px-4 w-full sm:w-auto">
          <div className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex bg-muted/50 backdrop-blur-xl rounded-2xl p-1.5 gap-1">
            {([3, 6, 12] as BillingPeriod[]).map(period => <button key={period} onClick={() => setBillingPeriod(period)} className={`relative px-2 sm:px-6 py-3 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 flex flex-col sm:flex-row items-center justify-center gap-1 ${billingPeriod === period ? 'bg-card text-foreground shadow-glass' : 'text-muted-foreground hover:text-foreground'}`}>
              <span className="text-base font-bold sm:font-medium sm:text-sm">{period}</span>
              <span>{t('pricing.months', 'мес')}</span>
              {period === 12 && <span className="absolute -top-3 -right-1 sm:-top-2 sm:-right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm z-10">
                -30%
              </span>}
              {period === 6 && <span className="absolute -top-3 -right-1 sm:-top-2 sm:-right-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm z-10">-15%</span>}
            </button>)}
          </div>
        </div>

        {/* Savings Banner */}
        {billingPeriod > 3 && <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium">
            <Star className="h-4 w-4" />
            {t('pricing.savingsText', 'Экономия')} {getSavingsPercent(billingPeriod)}%
          </div>
        </div>}

        {/* Why lnkmx — Phase B value block */}
        <Card className="max-w-2xl mx-auto mb-10 p-6 border-primary/20 bg-primary/5">
          <h3 className="font-bold text-lg mb-3 text-center">
            {t('pricing.whyLnkmx.title', 'Почему LinkMAX')}
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-center">
            <li className="flex flex-col items-center gap-1">
              <Zap className="h-5 w-5 text-primary" />
              <span>{t('pricing.whyLnkmx.noSetup', 'CRM за 15 минут — без внедрения')}</span>
            </li>
            <li className="flex flex-col items-center gap-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>{t('pricing.whyLnkmx.mobile', 'Вся работа со смартфона')}</span>
            </li>
            <li className="flex flex-col items-center gap-1">
              <Sparkles className="h-5 w-5 text-primary" />
              <span>{t('pricing.whyLnkmx.premium', 'Дизайн премиум из коробки')}</span>
            </li>
          </ul>
        </Card>

        {/* Pricing Cards — 2 main tiers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-8">
          {/* FREE Card */}
          <Card className={cn(
            "relative overflow-hidden transition-all duration-300",
            (tier === 'identity' || tier === 'starter') && "ring-2 ring-primary"
          )}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center">
                    {pricingPlans.basic.name}
                    {(tier === 'identity' || tier === 'starter') && (
                      <Badge variant="secondary" className="ml-2">{t('pricing.currentPlan', 'Текущий')}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{t('pricing.basicDesc', 'Страница + запись + CRM — получите первых клиентов')}</CardDescription>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">0₸</span>
                  <span className="text-muted-foreground">/{t('pricing.month', 'мес')}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">{t('pricing.freeForever', 'Бесплатно навсегда')}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="grid grid-cols-1 gap-2">
                {pricingPlans.basic.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {/* Highlight booking + CRM in free */}
                <li className="flex items-start gap-2 text-sm font-medium text-primary">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{t('pricing.features.freeBooking', 'Запись клиентов + предоплата')}</span>
                </li>
                <li className="flex items-start gap-2 text-sm font-medium text-primary">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span>{t('pricing.features.freeCRM', 'CRM до 50 заявок/мес')}</span>
                </li>
              </ul>
              {pricingPlans.basic.limitations && (
                <ul className="grid grid-cols-1 gap-1">
                  {pricingPlans.basic.limitations.map((lim, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <span className="mt-0.5">—</span>
                      <span>{lim}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Button
                variant="outline"
                className="w-full h-12 text-lg font-bold rounded-xl"
                disabled={tier === 'identity' || tier === 'starter'}
                onClick={() => handleSelectPlan('basic')}
              >
                {(tier === 'identity' || tier === 'starter') ? t('pricing.currentPlan', 'Текущий план') : t('pricing.startFree', 'Попробовать бесплатно')}
              </Button>
            </CardContent>
          </Card>

          {/* PRO Card */}
          {(() => {
            const plan = pricingPlans.pro;
            const isCurrentPlan = tier === 'pro';
            const monthlyKzt = plan.pricesKzt[billingPeriod];
            const monthlyUsd = plan.pricesUsd[billingPeriod];
            const totalKzt = plan.totalKzt[billingPeriod];
            const totalUsd = plan.totalUsd[billingPeriod];
            return (
              <Card className={cn(
                "relative overflow-hidden transition-all duration-300 hover:scale-[1.01] border-primary shadow-lg shadow-primary/20",
                isCurrentPlan && "ring-2 ring-primary"
              )}>
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-xl">
                  {t('pricing.popular', 'Популярный')}
                </div>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center">
                        {plan.name}
                        {isCurrentPlan && <Badge variant="secondary" className="ml-2">{t('pricing.currentPlan', 'Текущий')}</Badge>}
                      </CardTitle>
                      <CardDescription>{t('pricing.proDesc', 'Растите без ограничений')}</CardDescription>
                    </div>
                  </div>
                  <div className="mt-4">
                    {isKztPrimary ? (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">{monthlyKzt.toLocaleString()}₸</span>
                          <span className="text-muted-foreground">/{t('pricing.month', 'мес')}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {totalKzt.toLocaleString()}₸ {t('pricing.totalFor', 'за')} {billingPeriod} {t('pricing.months', 'мес')}
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-0.5">
                          ≈ ${monthlyUsd.toFixed(2)}/{t('pricing.month', 'мес')}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">${monthlyUsd.toFixed(2)}</span>
                          <span className="text-muted-foreground">/{t('pricing.month', 'мес')}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          ${totalUsd} {t('pricing.totalFor', 'за')} {billingPeriod} {t('pricing.months', 'мес')}
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-0.5">
                          ≈ {monthlyKzt.toLocaleString()}₸/{t('pricing.month', 'мес')}
                        </div>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="grid grid-cols-1 gap-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20 bg-gradient-to-r from-violet-500 to-purple-600"
                    disabled={isCurrentPlan || isLoading}
                    onClick={() => handleSelectPlan('pro')}
                  >
                    {isCurrentPlan ? t('pricing.currentPlan', 'Текущий план') : t('pricing.subscribe', 'Подписаться')}
                  </Button>
                </CardContent>
              </Card>
            );
          })()}
        </div>

        {/* Business tier — contact link */}
        <div className="text-center mb-12">
          <p className="text-sm text-muted-foreground">
            {t('pricing.businessNote', 'Нужна командная CRM, зоны и роли?')}{' '}
            <a
              href="https://wa.me/77051097664?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%98%D0%BD%D1%82%D0%B5%D1%80%D0%B5%D1%81%D1%83%D0%B5%D1%82%20%D1%82%D0%B0%D1%80%D0%B8%D1%84%20Business"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-bold hover:underline"
            >
              {t('pricing.businessLink', 'Напишите нам →')}
            </a>
          </p>
        </div>

        {/* Trust Section */}
        <div className="text-center py-8 border-t border-border/50">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>{t('pricing.securePayments', 'Безопасные платежи')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{t('pricing.cancelAnytime', 'Отмена в любое время')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>{t('pricing.moneyBack', 'Гарантия возврата 14 дней')}</span>
            </div>
          </div>

          {/* Company Details for RoboKassa compliance */}
          <div className="text-xs text-muted-foreground pt-4 border-t border-border/30">
            <p className="mb-1">{t('pricing.companyDetails.nameLine', 'ARchitecKZ • БИН: 190540008684')}</p>
            <p className="mb-2">{t('pricing.companyDetails.addressLine', 'г. Алматы, ул. Шолохова, д. 20')}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a href="mailto:admin@lnkmx.my" className="hover:text-foreground transition-colors">
                admin@lnkmx.my
              </a>
              <span>•</span>
              <a href="tel:+77051097664" className="hover:text-foreground transition-colors">
                +7 705 109 7664
              </a>
            </div>
            <p className="mt-3 text-muted-foreground/70">
              {t('pricing.paymentNote', 'Оплата через RoboKassa')}
            </p>
          </div>
        </div>
      </main>

      {/* Sticky Mobile CTA - PRO Plan Focus */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border/20 md:hidden z-50 pb-safe safe-area-bottom">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{pricingPlans.pro.name}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-primary">
                {isKztPrimary
                  ? `${pricingPlans.pro.pricesKzt[billingPeriod].toLocaleString()}₸`
                  : `$${pricingPlans.pro.pricesUsd[billingPeriod].toFixed(2)}`
                }
              </span>
              <span className="text-xs text-muted-foreground">/{t('pricing.month', 'мес')}</span>
            </div>
          </div>
          <Button
            size="lg"
            className="rounded-xl shadow-lg shadow-primary/20 bg-gradient-to-r from-violet-500 to-purple-600"
            onClick={() => handleSelectPlan('pro')}
          >
            {t('pricing.subscribe', 'Подписаться')}
          </Button>
        </div>
      </div>
    </div>
  </>;
}
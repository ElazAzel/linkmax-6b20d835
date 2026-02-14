import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Crown, Sparkles, Zap, Star, Clock, Shield, Coins, MessageCircle } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useTokens } from '@/hooks/useTokens';
import { redirectToTokenPurchase } from '@/lib/token-purchase-helper';
import { toast } from 'sonner';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { SEOMetaEnhancer } from '@/components/seo/SEOMetaEnhancer';
import { GEOTagging } from '@/components/seo/GEOTagging';
import { AISearchOptimizer } from '@/components/seo/AISearchOptimizer';
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
  const {
    balance,
    canAffordPremium,
    premiumCost,
    buyPremiumDay,
    converting
  } = useTokens();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(12);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const isKztPrimary = i18n.language === 'ru' || i18n.language === 'kk';
  const canonical = 'https://lnkmx.my/pricing';
  const seoTitle = t('pricing.seo.title', 'lnkmx Pricing — Plans for Link in Bio & Mini-Sites');
  const seoDescription = t('pricing.seo.description', 'Compare lnkmx plans: free link in bio builder, Pro with AI, CRM, analytics, and custom domains. Transparent pricing in minutes.');

  // Pricing in KZT: 3mo = 4350₸/mo, 6mo = 3698₸/mo (15% off), 12mo = 3045₸/mo (30% off)
  const pricingPlans = {
    basic: {
      name: 'BASIC',
      icon: Zap,
      color: 'from-slate-500 to-slate-600',
      pricesKzt: {
        3: 0,
        6: 0,
        12: 0
      },
      pricesUsd: {
        3: 0,
        6: 0,
        12: 0
      },
      totalKzt: {
        3: 0,
        6: 0,
        12: 0
      },
      totalUsd: {
        3: 0,
        6: 0,
        12: 0
      },
      features: [t('pricing.features.basicThemes', 'Базовые темы оформления'), t('pricing.features.basicCustomization', 'Базовая настройка (цвета, шрифты)'), t('pricing.features.unlimitedLinks', 'Неограниченные ссылки'), t('pricing.features.basicBlocks', 'Базовые блоки (Профиль, Ссылка, Текст, Фото, Кнопка, Соцсети)'), t('pricing.features.messengers', 'Мессенджеры и соцсети'), t('pricing.features.maps', 'Карты (адрес + карта)'), t('pricing.features.basicStats', 'Базовая статистика просмотров'), t('pricing.features.qrCode', 'QR-код страницы'), t('pricing.features.aiMonthly', '1 AI-генерация в месяц')],
      limitations: [t('pricing.limitations.watermark', 'Водяной знак LinkMAX'), t('pricing.limitations.limitedBlocks', '10 блоков максимум')]
    },
    pro: {
      name: 'PRO',
      icon: Crown,
      color: 'from-violet-500 to-purple-600',
      popular: true,
      pricesKzt: {
        3: 4350,
        6: 3698,
        12: 3045
      },
      pricesUsd: {
        3: 8.50,
        6: 7.20,
        12: 5.95
      },
      totalKzt: {
        3: 13050,
        6: 22185,
        12: 36540
      },
      totalUsd: {
        3: 25.50,
        6: 43.20,
        12: 71.40
      },
      features: [t('pricing.features.allBasic', 'Всё из BASIC, плюс:'), t('pricing.features.allBlocks', 'Все 25+ типов блоков без ограничений'), t('pricing.features.proThemes', 'Профессиональные темы и анимации'), t('pricing.features.media', 'Медиа: изображения, видео, карусели'), t('pricing.features.priceLists', 'Прайс-листы и каталоги товаров'), t('pricing.features.scheduler', 'Планировщик блоков'), t('pricing.features.advancedAnalytics', 'Расширенная аналитика кликов'), t('pricing.features.fullCRM', 'Полноценная CRM для лидов'), t('pricing.features.telegramNotifications', 'Telegram-уведомления о заявках'), t('pricing.features.forms', 'Формы сбора заявок'), t('pricing.features.faq', 'FAQ и отзывы блоки'), t('pricing.features.timers', 'Таймеры обратного отсчёта'), t('pricing.features.aiMonthlyPro', '5 AI-генераций в месяц')]
    }
  };
  const getSavingsPercent = (period: BillingPeriod): number => {
    if (period === 12) return 30;
    if (period === 6) return 15;
    return 0;
  };
  const handleSelectPlan = (planKey: string) => {
    if (planKey === 'basic') {
      toast.info(t('pricing.alreadyFree', 'Бесплатный тариф уже активен'));
      return;
    }
    setSelectedPlan(planKey);
    toast.info(t('pricing.comingSoon', 'Оплата скоро будет доступна! Следите за обновлениями.'));
  };
  const getCurrentPlanBadge = (planKey: string) => {
    if (tier === planKey || tier === 'free' && planKey === 'basic') {
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
      imageUrl="https://lnkmx.my/og-pricing.png"
      imageAlt={t('pricing.seo.imageAlt', 'lnkmx Pricing Plans')}
      type="website"
    />
    <GEOTagging includeOrganization={false} />
    <AISearchOptimizer
      pageType="pricing"
      primaryQuestion="How much does lnkmx cost?"
      primaryAnswer="lnkmx offers a free Basic plan and a Pro plan starting from 2,900 KZT (approximately $6 USD) for 3 months. Pro features include unlimited pages, custom domains, analytics, and priority support."
      entityName="lnkmx Pricing"
      entityCategory="SaaS Pricing, Subscription Plans, Link in Bio Pricing"
      useCases={[
        'Start free with Basic plan',
        'Upgrade to Pro for advanced features',
        'Pay for 3, 6, or 12 months',
        'Use tokens for flexible premium access',
      ]}
      targetAudience={[
        'Budget-conscious small businesses',
        'Freelancers looking for affordable tools',
        'Growing businesses needing more features',
      ]}
      problemStatement="Most link-in-bio and page builder tools are too expensive for micro-businesses and freelancers"
      solutionStatement="lnkmx offers a free plan for basic needs and affordable Pro pricing starting at just $6 for 3 months"
      keyFeatures={[
        'Free Basic plan available',
        'Pro plan: 2,900 KZT for 3 months',
        'Volume discounts: up to 30% off for 12 months',
        'Multi-currency support (KZT, USD)',
        'Flexible token system',
        'No credit card required for free plan',
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
                  <img src="/favicon.png" alt="lnkmx" className="h-8 w-8 rounded-xl object-contain" />
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
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Title Section */}
        <div className="text-center mb-8">
          <h2 data-testid="pricing-title" className="text-3xl sm:text-4xl font-bold mb-4">
            {t('pricing.choosePlan', 'Выберите подходящий тариф')}
          </h2>
          <p data-testid="pricing-description" className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('pricing.description', 'Разблокируйте все возможности LinkMAX для вашего бизнеса')}
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

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-12">
          {Object.entries(pricingPlans).map(([key, plan]) => {
            const Icon = plan.icon;
            const isCurrentPlan = tier === key || tier === 'free' && key === 'basic';
            const monthlyKzt = plan.pricesKzt[billingPeriod];
            const monthlyUsd = plan.pricesUsd[billingPeriod];
            const totalKzt = plan.totalKzt[billingPeriod];
            const totalUsd = plan.totalUsd[billingPeriod];
            return <Card key={key} className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${'popular' in plan && plan.popular ? 'border-primary shadow-lg shadow-primary/20' : 'border-border/50'} ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
              {'popular' in plan && plan.popular && <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-xl">
                {t('pricing.popular', 'Популярный')}
              </div>}

              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center">
                      {plan.name}
                      {getCurrentPlanBadge(key)}
                    </CardTitle>
                    <CardDescription>
                      {key === 'basic' && t('pricing.basicDesc', 'Начните бесплатно')}
                      {key === 'pro' && t('pricing.proDesc', 'Всё для профессионалов и бизнеса')}
                    </CardDescription>
                  </div>
                </div>

                {/* Price */}
                <div className="mt-4">
                  {key === 'basic' ? <div className="text-3xl font-bold">
                    {t('pricing.free.title', 'Бесплатно')}
                  </div> : isKztPrimary ? <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{monthlyKzt.toLocaleString()}₸</span>
                      <span className="text-muted-foreground">/{t('pricing.month', 'мес')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {totalKzt.toLocaleString()}₸ {t('pricing.totalFor', 'за')} {billingPeriod} {t('pricing.months', 'мес')}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5">
                      ≈ ${monthlyUsd.toFixed(2)}/{t('pricing.month', 'мес')}
                    </div>
                  </> : <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">${monthlyUsd.toFixed(2)}</span>
                      <span className="text-muted-foreground">/{t('pricing.month', 'мес')}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      ${totalUsd} {t('pricing.totalFor', 'за')} {billingPeriod} {t('pricing.months', 'мес')}
                    </div>
                    <div className="text-xs text-muted-foreground/70 mt-0.5">
                      ≈ {monthlyKzt.toLocaleString()}₸/{t('pricing.month', 'мес')}
                    </div>
                  </>}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>)}
                </ul>

                {/* Limitations for Basic */}
                {'limitations' in plan && plan.limitations && <ul className="space-y-2 pt-2 border-t border-border/50">
                  {plan.limitations.map((limitation, index) => <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{limitation}</span>
                  </li>)}
                </ul>}

                {/* CTA Button */}
                <Button data-testid={`pricing-plan-${key}-cta`} className="w-full mt-4" variant={isCurrentPlan ? 'outline' : 'popular' in plan && plan.popular ? 'default' : 'outline'} disabled={isCurrentPlan || isLoading} onClick={() => handleSelectPlan(key)}>
                  {isCurrentPlan ? t('pricing.currentPlan', 'Текущий план') : key === 'basic' ? t('pricing.startFree', 'Начать бесплатно') : t('pricing.subscribe', 'Подписаться')}
                </Button>
              </CardContent>
            </Card>;
          })}
        </div>

        {/* Token Purchase Section */}
        <Card className="max-w-lg mx-auto mb-12 p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Coins className="h-6 w-6 text-amber-500" />
              <h3 className="text-xl font-bold">{t('pricing.tokens.title', 'Или платите Linkkon токенами')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('pricing.tokens.balanceDescription', '100 Linkkon = 1 день Premium. Ваш баланс: {{balance}} токенов', {
                balance: balance?.balance?.toFixed(0) || 0
              })}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={buyPremiumDay} disabled={!canAffordPremium || converting} className="bg-gradient-to-r from-violet-500 to-purple-600">
                <Crown className="h-4 w-4 mr-2" />
                {converting ? t('pricing.tokens.converting', 'Конвертация...') : t('pricing.tokens.buyDay', 'Купить 1 день за {{cost}} Linkkon', {
                  cost: premiumCost
                })}
              </Button>
              <Button variant="outline" onClick={() => redirectToTokenPurchase(100, 'Premium')}>
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('pricing.tokens.buyTokens', 'Купить токены')}
              </Button>
            </div>
          </div>
        </Card>

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
'use client';

import { useState, useCallback, memo } from 'react';
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
import { useCurrencyRate, BASE_PRICES_USD, FIXED_PRICES_KZT, getTotalPriceKzt } from '@/hooks/useCurrencyRate';
import { useAuth } from '@/hooks/user/useAuth';
import { activateStarterTier } from '@/services/user';

type BillingPeriod = 3 | 6 | 12;

export const Pricing = memo(function Pricing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { tier, isLoading, refresh: refreshPremiumStatus } = usePremiumStatus();
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(12);

  const { data: currentRate = 497.33 } = useCurrencyRate();
  const isKztPrimary = i18n.language === 'ru' || i18n.language === 'kk';
  const canonical = `${getAppDomain()}/pricing`;
  const seoTitle = t('pricing.seo.title', 'LinkMAX Pricing — Plans for Link in Bio & Mini-Sites');
  const seoDescription = t('pricing.seo.description', 'Compare LinkMAX plans: free link in bio builder, Pro with AI, CRM, analytics, and custom domains. Transparent pricing in minutes.');

  const pricingPlans = {
    basic: {
      name: t('pricing.tiers.basic', 'IDENTITY'),
      icon: Zap,
      color: 'from-slate-500 to-slate-600',
      pricesKzt: { 3: 0, 6: 0, 12: 0 },
      pricesUsd: { 3: 0, 6: 0, 12: 0 },
      features: [
        t('pricing.features.basicThemes', 'Базовые темы оформления'),
        t('pricing.features.unlimitedLinks', 'Неограниченные ссылки'),
        t('pricing.features.basicBlocks', 'Базовые блоки')
      ],
      limitations: [
        t('pricing.limitations.watermark', 'Водяной знак LinkMAX'),
        t('pricing.limitations.noCRM', 'Без CRM и платежей')
      ]
    },
    starter: {
      name: t('pricing.tiers.starter', 'STARTER'),
      icon: Sparkles,
      color: 'from-emerald-500 to-teal-600',
      pricesKzt: { 3: 0, 6: 0, 12: 0 },
      pricesUsd: { 3: 0, 6: 0, 12: 0 },
      features: [
        t('pricing.features.fullCRM', 'Полная CRM система'),
        t('pricing.features.payments', 'Прием платежей и инвойсы'),
        t('pricing.features.noWatermark', 'Без водяного знака'),
        t('pricing.features.allBlocks', 'Все типы блоков'),
      ],
      note: t('pricing.starterNote', '7% комиссия с продаж')
    },
    pro: {
      name: 'PRO',
      icon: Crown,
      color: 'from-violet-500 to-purple-600',
      pricesKzt: FIXED_PRICES_KZT,
      pricesUsd: BASE_PRICES_USD,
      features: [
        t('pricing.features.lowFee', 'Комиссия всего 1%'),
        t('pricing.features.customDomain', 'Свой домен'),
        t('pricing.features.advancedAnalytics', 'Расширенная аналитика'),
        t('pricing.features.aiMonthlyPro', '10 AI-генераций в месяц'),
      ]
    },
  };

  const { buySubscription, isLoading: isPaymentLoading } = useRobokassa();

  const handleSelectPlan = async (planKey: string) => {
    if (planKey === 'basic') {
      toast.info(t('pricing.identityAlreadyActive', 'Тариф Identity уже активен'));
      return;
    }

    if (planKey === 'starter') {
      try {
        if (!user) {
          navigate('/auth');
          return;
        }
        const { error } = await activateStarterTier(user.id);
        if (error) throw error;
        await refreshPremiumStatus();
        toast.success(t('pricing.starterActivated', 'Тариф Starter активирован!'));
        setTimeout(() => navigate('/dashboard/activity'), 1500);
      } catch (err) {
        toast.error(t('pricing.activationError', 'Ошибка активации'));
      }
      return;
    }

    if (planKey === 'pro') {
      await buySubscription('pro', billingPeriod);
    }
  };

  const getSavingsPercent = (period: BillingPeriod): number => {
    if (period === 12) return 30;
    if (period === 6) return 15;
    return 0;
  };

  return (
    <>
      <StaticSEOHead title={seoTitle} description={seoDescription} canonical={canonical} currentLanguage={i18n.language} alternates={[]} />
      <SEOMetaEnhancer pageUrl={canonical} pageTitle={seoTitle} pageDescription={seoDescription} imageUrl="" imageAlt="" type="website" />
      <div className="min-h-screen bg-background relative overflow-x-hidden pb-safe">
        <header className="sticky top-0 z-50">
          <div className="mx-4 mt-3">
            <div className="backdrop-blur-2xl bg-card/50 border border-border/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} aria-label={t('common.back', 'Назад')}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold text-primary">{t('pricing.title', 'Тарифы')}</h1>
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('pricing.choosePlan', 'Выберите тариф')}</h2>
            <div className="flex justify-center mb-8">
              <div className="bg-muted rounded-xl p-1 flex gap-1">
                {([3, 6, 12] as BillingPeriod[]).map(p => (
                  <Button 
                    key={p} 
                    variant={billingPeriod === p ? 'default' : 'ghost'} 
                    onClick={() => setBillingPeriod(p)}
                    className="rounded-lg"
                  >
                    {p} {t('pricing.months', 'мес')}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tiers rendered here */}
            {Object.entries(pricingPlans).map(([key, plan]) => {
              const isCurrent = tier === key || (key === 'basic' && tier === 'identity');
              const Icon = plan.icon;
              return (
                <Card key={key} className={cn("relative flex flex-col", isCurrent && "ring-2 ring-primary")}>
                  {key === 'pro' && (
                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                      {t('pricing.popular', 'Pop')}
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                       <Icon className="h-6 w-6 text-primary" />
                       <CardTitle>{plan.name}</CardTitle>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {key === 'pro' ? (isKztPrimary ? `${plan.pricesKzt[billingPeriod].toLocaleString()}₸` : `$${plan.pricesUsd[billingPeriod]}`) : '0₸'}
                      </span>
                      <span className="text-muted-foreground text-sm">/{t('pricing.month', 'мес')}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4">
                    {'note' in plan && <p className="text-emerald-500 font-bold text-sm">{plan.note}</p>}
                    <ul className="space-y-2">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <div className="p-6 pt-0">
                    <Button 
                      className="w-full rounded-xl h-12 font-bold" 
                      variant={isCurrent ? 'secondary' : (key === 'starter' ? 'default' : 'outline')}
                      disabled={isCurrent || isLoading}
                      onClick={() => handleSelectPlan(key)}
                    >
                      {isCurrent ? t('pricing.currentPlan', 'Текущий') : t('pricing.select', 'Выбрать')}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </main>
      </div>
    </>
  );
});
export default Pricing;

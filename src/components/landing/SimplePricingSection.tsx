'use client';
import { useNavigate } from 'react-router-dom';

import { useState } from 'react';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Check, Crown, Sparkles, X } from 'lucide-react';

interface SimplePricingSectionProps {
  isVisible: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export function SimplePricingSection({ isVisible, sectionRef }: SimplePricingSectionProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [billingPeriod, setBillingPeriod] = useState<'3' | '6' | '12'>('12');

  const isKztPrimary = i18n.language === 'ru' || i18n.language === 'kk';

  // Pricing in KZT: 3mo = 4350в‚ё/mo, 6mo = 3698в‚ё/mo (15% off), 12mo = 3045в‚ё/mo (30% off)
  // USD equivalent (approximate): 3mo = $8.50, 6mo = $7.20, 12mo = $5.95
  const pricingPlans = {
    '3': { monthlyKzt: 4350, totalKzt: 13050, monthlyUsd: 8.50, totalUsd: 25.50 },
    '6': { monthlyKzt: 3698, totalKzt: 22185, monthlyUsd: 7.20, totalUsd: 43.20 },
    '12': { monthlyKzt: 3045, totalKzt: 36540, monthlyUsd: 5.95, totalUsd: 71.40 },
  };

  const freeFeatures = [
    { text: t('landing.simplePricing.free.f1_v2', 'Р‘Р°Р·РѕРІС‹Рµ Р±Р»РѕРєРё (СЃСЃС‹Р»РєРё, С‚РµРєСЃС‚, С„РѕС‚Рѕ)'), included: true },
    { text: t('landing.simplePricing.free.f2_v2', 'AI-РіРµРЅРµСЂР°С†РёСЏ (1 СЂР°Р·/РјРµСЃСЏС†)'), included: true },
    { text: t('landing.simplePricing.free.f3_v2', 'Р‘Р°Р·РѕРІР°СЏ СЃС‚Р°С‚РёСЃС‚РёРєР° РїСЂРѕСЃРјРѕС‚СЂРѕРІ'), included: true },
    { text: t('landing.simplePricing.free.f4_v2', 'QR-РєРѕРґ СЃС‚СЂР°РЅРёС†С‹'), included: true },
    { text: t('landing.simplePricing.free.f5_booking', 'Р—Р°РїРёСЃСЊ + С„РѕСЂРјР° + CRM (50/РјРµСЃ)'), included: true },
    { text: t('landing.simplePricing.free.f6_v2', 'Р Р°СЃС€РёСЂРµРЅРЅР°СЏ Р°РЅР°Р»РёС‚РёРєР°'), included: false },
    { text: t('landing.simplePricing.free.f7_v2', 'Р‘РµР·Р»РёРјРёС‚РЅС‹Рµ РѕР±СЂР°С‰РµРЅРёСЏ'), included: false },
  ];

  const premiumFeatures = [
    { text: t('landing.simplePricing.premium.f1_v3', 'Р‘РµР·Р»РёРјРёС‚РЅС‹Рµ РѕР±СЂР°С‰РµРЅРёСЏ РєР»РёРµРЅС‚РѕРІ'), included: true, highlight: true },
    { text: t('landing.simplePricing.premium.f2_v3', 'Р‘РµР· РІРѕРґСЏРЅРѕРіРѕ Р·РЅР°РєР° вЂ” РІР°С€ Р±СЂРµРЅРґ'), included: true, highlight: true },
    { text: t('landing.simplePricing.premium.f3_v3', 'Р Р°СЃС€РёСЂРµРЅРЅР°СЏ Р°РЅР°Р»РёС‚РёРєР° РєР»РёРєРѕРІ'), included: true, highlight: true },
    { text: t('landing.simplePricing.premium.f4_v3', 'Р­РєСЃРїРѕСЂС‚ + Telegram-СѓРІРµРґРѕРјР»РµРЅРёСЏ'), included: true, highlight: true },
    { text: t('landing.simplePricing.premium.f5_v3', 'Р’СЃРµ 25+ С‚РёРїРѕРІ Р±Р»РѕРєРѕРІ'), included: true },
    { text: t('landing.simplePricing.premium.f6_v3', 'Р”Рѕ 6 СЃС‚СЂР°РЅРёС† + СЃРІРѕР№ РґРѕРјРµРЅ'), included: true },
    { text: t('landing.simplePricing.premium.f7_v3', '10 AI-РіРµРЅРµСЂР°С†РёР№ РІ РјРµСЃСЏС†'), included: true },
  ];

  return (
    <section ref={sectionRef} className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10 sm:mb-14 space-y-4">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium opacity-0 ${isVisible ? 'animate-fade-in' : ''}`}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-primary">{t('landing.simplePricing.badge', 'РџСЂРѕСЃС‚С‹Рµ С‚Р°СЂРёС„С‹')}</span>
          </div>
          <h2
            className={`text-2xl sm:text-3xl lg:text-[2.75rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${isVisible ? 'animate-blur-in' : ''}`}
            style={{ animationDelay: '100ms' }}
          >
            {t('landing.simplePricing.title', 'Р‘РµСЃРїР»Р°С‚РЅРѕ РёР»Рё Premium')}
          </h2>

          {/* Billing Period Selector */}
          <div
            className={`flex items-center justify-center gap-2 pt-4 opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '200ms' }}
          >
            <div className="inline-flex p-1 rounded-xl bg-muted/50 border border-border/30">
              {(['3', '6', '12'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setBillingPeriod(period)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${billingPeriod === period
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {t(`landing.pricing.months${period}`, `${period} РјРµСЃ`)}
                  {period === '12' && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-xs font-bold">
                      -30%
                    </span>
                  )}
                  {period === '6' && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-xs font-bold">
                      -15%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free */}
          <div
            className={`relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-card/50 backdrop-blur-xl border border-border/30 opacity-0 ${isVisible ? 'animate-slide-in-left' : ''}`}
            style={{ animationDelay: '300ms' }}
          >
            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold">{t('landing.simplePricing.free.title', 'Р‘РµСЃРїР»Р°С‚РЅРѕ')}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t('landing.simplePricing.free.subtitle', 'РќР°РІСЃРµРіРґР°, Р±РµР· СЃРєСЂС‹С‚С‹С… РїР»Р°С‚РµР¶РµР№')}</p>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground text-sm">/{t('landing.pricing.month', 'РјРµСЃ')}</span>
              </div>

              <Button
                variant="outline"
                size="lg"
                className="w-full rounded-xl py-5"
                onClick={() => navigate('/auth')}
              >
                {t('landing.simplePricing.free.cta', 'РќР°С‡Р°С‚СЊ Р±РµСЃРїР»Р°С‚РЅРѕ')}
              </Button>

              <div className="space-y-2 pt-2">
                {freeFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Premium */}
          <div
            className={`relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-card/50 backdrop-blur-xl border-2 border-primary/30 opacity-0 ${isVisible ? 'animate-slide-in-right' : ''}`}
            style={{ animationDelay: '400ms' }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              {t('landing.simplePricing.premium.badge', 'Р РµРєРѕРјРµРЅРґСѓРµРј')}
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {t('landing.simplePricing.premium.title', 'Premium')}
                  <Crown className="h-5 w-5 text-primary" />
                </h3>
                <p className="text-muted-foreground text-sm mt-1">{t('landing.simplePricing.premium.subtitle', 'Р’СЃС‘ РґР»СЏ СЂРѕСЃС‚Р° Р±РёР·РЅРµСЃР°')}</p>
              </div>

              <div className="space-y-1">
                {isKztPrimary ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        {pricingPlans[billingPeriod].monthlyKzt.toLocaleString()}в‚ё
                      </span>
                      <span className="text-muted-foreground text-sm">/{t('landing.pricing.month', 'РјРµСЃ')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('landing.pricing.total', 'РС‚РѕРіРѕ')}: {pricingPlans[billingPeriod].totalKzt.toLocaleString()}в‚ё {t('landing.pricing.billedOnce', 'РµРґРёРЅРѕСЂР°Р·РѕРІРѕ')}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      в‰€ ${pricingPlans[billingPeriod].monthlyUsd.toFixed(2)}/{t('landing.pricing.month', 'РјРµСЃ')}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        ${pricingPlans[billingPeriod].monthlyUsd.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground text-sm">/{t('landing.pricing.month', 'РјРµСЃ')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('landing.pricing.total', 'РС‚РѕРіРѕ')}: ${pricingPlans[billingPeriod].totalUsd} {t('landing.pricing.billedOnce', 'РµРґРёРЅРѕСЂР°Р·РѕРІРѕ')}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      в‰€ {pricingPlans[billingPeriod].monthlyKzt.toLocaleString()}в‚ё/{t('landing.pricing.month', 'РјРµСЃ')}
                    </p>
                  </>
                )}
              </div>

              <Button
                size="lg"
                className="w-full rounded-xl py-5 shadow-lg shadow-primary/25"
                onClick={() => navigate('/pricing')}
              >
                <Crown className="mr-2 h-4 w-4" />
                {t('landing.simplePricing.premium.cta', 'РџРѕР»СѓС‡РёС‚СЊ Premium')}
              </Button>

              <div className="space-y-2 pt-2">
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className={`flex items-start gap-2 ${feature.highlight ? 'bg-primary/5 -mx-2 px-2 py-1 rounded-lg' : ''}`}>
                    <Check className={`h-4 w-4 flex-shrink-0 mt-0.5 ${feature.highlight ? 'text-primary' : 'text-primary'}`} />
                    <span className={`text-sm ${feature.highlight ? 'font-medium' : ''}`}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trust message */}
        <div
          className={`text-center mt-8 opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
          style={{ animationDelay: '500ms' }}
        >
          <p className="text-muted-foreground text-sm">
            <span className="font-semibold text-foreground">0% РєРѕРјРёСЃСЃРёРё</span>
            {' '}- РІСЃРµ РґРµРЅСЊРіРё РѕС‚ РІР°С€РёС… РїСЂРѕРґР°Р¶ РѕСЃС‚Р°СЋС‚СЃСЏ РІР°Рј
          </p>
        </div>
      </div>
    </section>
  );
}


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  Check, 
  Crown,
  Sparkles,
  X
} from 'lucide-react';
import { openPremiumPurchase } from '@/lib/upgrade-utils';

interface SimplePricingSectionProps {
  isVisible: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export function SimplePricingSection({ isVisible, sectionRef }: SimplePricingSectionProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [billingPeriod, setBillingPeriod] = useState<'3' | '6' | '12'>('12');
  
  const isKztPrimary = i18n.language === 'ru' || i18n.language === 'kk';

  // Pricing in KZT: 3mo = 4350₸/mo, 6mo = 3500₸/mo, 12mo = 2610₸/mo
  // USD equivalent (approximate): 3mo = $8.50, 6mo = $6.80, 12mo = $5.10
  const pricingPlans = {
    '3': { monthlyKzt: 4350, totalKzt: 13050, monthlyUsd: 8.50, totalUsd: 25.50 },
    '6': { monthlyKzt: 3500, totalKzt: 21000, monthlyUsd: 6.80, totalUsd: 40.80 },
    '12': { monthlyKzt: 2610, totalKzt: 31320, monthlyUsd: 5.10, totalUsd: 61.20 },
  };

  const freeFeatures = [
    { text: t('landing.simplePricing.free.f1', 'Базовые блоки (ссылки, текст, фото)'), included: true },
    { text: t('landing.simplePricing.free.f2', 'AI-генерация (3 раза в день)'), included: true },
    { text: t('landing.simplePricing.free.f3', 'Базовая статистика'), included: true },
    { text: t('landing.simplePricing.free.f4', 'QR-код страницы'), included: true },
    { text: t('landing.simplePricing.free.f5', 'Mini-CRM и лиды'), included: false },
    { text: t('landing.simplePricing.free.f6', 'Telegram-уведомления'), included: false },
    { text: t('landing.simplePricing.free.f7', 'Безлимитный AI'), included: false },
  ];

  const premiumFeatures = [
    { text: t('landing.simplePricing.premium.f1', 'Все блоки без ограничений'), included: true },
    { text: t('landing.simplePricing.premium.f2', 'Mini-CRM - все заявки в одном месте'), included: true, highlight: true },
    { text: t('landing.simplePricing.premium.f3', 'Telegram-уведомления о лидах'), included: true, highlight: true },
    { text: t('landing.simplePricing.premium.f4', 'Безлимитный AI-копирайтер'), included: true, highlight: true },
    { text: t('landing.simplePricing.premium.f5', 'Расширенная аналитика кликов'), included: true, highlight: true },
    { text: t('landing.simplePricing.premium.f6', 'Премиум-темы и анимации'), included: true },
    { text: t('landing.simplePricing.premium.f7', 'Без водяного знака'), included: true },
  ];

  return (
    <section ref={sectionRef} className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10 sm:mb-14 space-y-4">
          <div 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium opacity-0 ${isVisible ? 'animate-fade-in' : ''}`}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-primary">{t('landing.simplePricing.badge', 'Простые тарифы')}</span>
          </div>
          <h2 
            className={`text-2xl sm:text-3xl lg:text-[2.75rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${isVisible ? 'animate-blur-in' : ''}`}
            style={{ animationDelay: '100ms' }}
          >
            {t('landing.simplePricing.title', 'Бесплатно или Premium')}
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
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    billingPeriod === period 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t(`landing.pricing.months${period}`, `${period} мес`)}
                  {period === '12' && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                      -40%
                    </span>
                  )}
                  {period === '6' && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                      -20%
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
                <h3 className="text-xl font-bold">{t('landing.simplePricing.free.title', 'Бесплатно')}</h3>
                <p className="text-muted-foreground text-sm mt-1">{t('landing.simplePricing.free.subtitle', 'Навсегда, без скрытых платежей')}</p>
              </div>
              
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground text-sm">/{t('landing.pricing.month', 'мес')}</span>
              </div>

              <Button 
                variant="outline" 
                size="lg" 
                className="w-full rounded-xl py-5"
                onClick={() => navigate('/auth')}
              >
                {t('landing.simplePricing.free.cta', 'Начать бесплатно')}
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
              {t('landing.simplePricing.premium.badge', 'Рекомендуем')}
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2">
                  {t('landing.simplePricing.premium.title', 'Premium')}
                  <Crown className="h-5 w-5 text-primary" />
                </h3>
                <p className="text-muted-foreground text-sm mt-1">{t('landing.simplePricing.premium.subtitle', 'Всё для роста бизнеса')}</p>
              </div>
              
              <div className="space-y-1">
                {isKztPrimary ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        {pricingPlans[billingPeriod].monthlyKzt.toLocaleString()}₸
                      </span>
                      <span className="text-muted-foreground text-sm">/{t('landing.pricing.month', 'мес')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('landing.pricing.total', 'Итого')}: {pricingPlans[billingPeriod].totalKzt.toLocaleString()}₸ {t('landing.pricing.billedOnce', 'единоразово')}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      ≈ ${pricingPlans[billingPeriod].monthlyUsd.toFixed(2)}/{t('landing.pricing.month', 'мес')}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        ${pricingPlans[billingPeriod].monthlyUsd.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground text-sm">/{t('landing.pricing.month', 'мес')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('landing.pricing.total', 'Итого')}: ${pricingPlans[billingPeriod].totalUsd} {t('landing.pricing.billedOnce', 'единоразово')}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      ≈ {pricingPlans[billingPeriod].monthlyKzt.toLocaleString()}₸/{t('landing.pricing.month', 'мес')}
                    </p>
                  </>
                )}
              </div>

              <Button 
                size="lg" 
                className="w-full rounded-xl py-5 shadow-lg shadow-primary/25"
                onClick={openPremiumPurchase}
              >
                <Crown className="mr-2 h-4 w-4" />
                {t('landing.simplePricing.premium.cta', 'Получить Premium')}
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
            <span className="font-semibold text-foreground">0% комиссии</span>
            {' '}- все деньги от ваших продаж остаются вам
          </p>
        </div>
      </div>
    </section>
  );
}

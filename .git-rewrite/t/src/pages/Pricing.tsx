import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Check, 
  Crown, 
  Sparkles, 
  Zap,
  Star,
  Clock,
  Shield
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { toast } from 'sonner';

type BillingPeriod = 3 | 6 | 12;

export default function Pricing() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isPremium, tier, isLoading } = usePremiumStatus();
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(12);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const pricingPlans = {
    basic: {
      name: 'BASIC',
      icon: Zap,
      color: 'from-slate-500 to-slate-600',
      prices: { 3: 0, 6: 0, 12: 0 },
      features: [
        t('pricing.features.basicThemes', 'Базовые темы оформления'),
        t('pricing.features.basicCustomization', 'Базовая настройка (цвета, шрифты)'),
        t('pricing.features.unlimitedLinks', 'Неограниченные ссылки'),
        t('pricing.features.textBlocks', 'Текстовые блоки'),
        t('pricing.features.basicBlocks', 'Базовые блоки (Profile, Link, Text, Image, Button, Socials)'),
        t('pricing.features.messengers', 'Мессенджеры и соцсети'),
        t('pricing.features.maps', 'Карты (адрес + карта)'),
        t('pricing.features.basicStats', 'Базовая статистика просмотров'),
        t('pricing.features.qrCode', 'QR-код страницы'),
        t('pricing.features.aiRequestsWeek', '3 AI-запроса в неделю'),
      ],
      limitations: [
        t('pricing.limitations.watermark', 'Водяной знак LinkMAX'),
        t('pricing.limitations.limitedBlocks', 'Ограниченные блоки'),
      ],
    },
    pro: {
      name: 'PRO',
      icon: Crown,
      color: 'from-violet-500 to-purple-600',
      popular: true,
      prices: { 3: 5.00, 6: 3.50, 12: 2.50 },
      totalPrices: { 3: 15, 6: 21, 12: 30 },
      features: [
        t('pricing.features.allBasic', 'Всё из BASIC'),
        t('pricing.features.proThemes', 'Профессиональные темы и анимации'),
        t('pricing.features.media', 'Медиа: изображения, видео, музыка'),
        t('pricing.features.priceLists', 'Прайс-листы, Product / Catalog блоки'),
        t('pricing.features.customCode', 'Custom HTML/CSS блок'),
        t('pricing.features.socialPixel', 'Social Media pixel (Meta, TikTok, Google)'),
        t('pricing.features.scheduler', 'Планировщик блоков'),
        t('pricing.features.advancedAnalytics', 'Расширенная аналитика кликов'),
        t('pricing.features.noWatermark', 'Без водяного знака'),
        t('pricing.features.miniCRM', 'Mini-CRM до 100 лидов/мес'),
        t('pricing.features.telegramNotifications', 'Telegram-уведомления о лидах'),
        t('pricing.features.unlimitedAI', 'Безлимитный AI'),
      ],
    },
    business: {
      name: 'BUSINESS',
      icon: Sparkles,
      color: 'from-amber-500 to-orange-600',
      prices: { 3: 9.50, 6: 7.00, 12: 5.00 },
      totalPrices: { 3: 28.50, 6: 42, 12: 60 },
      features: [
        t('pricing.features.allPro', 'Всё из PRO'),
        t('pricing.features.multiPage', 'Внутренние страницы (мульти-страничный сайт)'),
        t('pricing.features.digitalProducts', 'Цифровые продукты (лендинги под курсы)'),
        t('pricing.features.applicationForms', 'Заявки через расширенные формы'),
        t('pricing.features.payments', 'Приём оплат (Stripe/Kaspi)'),
        t('pricing.features.whiteLabel', 'Полное удаление брендинга (white-label)'),
        t('pricing.features.fullCRM', 'Полноценная CRM (без лимита лидов)'),
        t('pricing.features.autoNotifications', 'Автоматические email/Telegram-уведомления'),
        t('pricing.features.timers', 'Таймеры (запуски, акции)'),
        t('pricing.features.customDomain', 'Подключение кастомного домена'),
        t('pricing.features.sslCertificate', 'SSL-сертификат'),
        t('pricing.features.marketing', 'Маркетинговые аддоны (рефералы, промокоды)'),
      ],
    },
  };

  const getSavingsPercent = (period: BillingPeriod): number => {
    if (period === 12) return 50;
    if (period === 6) return 30;
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
    if (tier === planKey || (tier === 'free' && planKey === 'basic')) {
      return (
        <Badge variant="secondary" className="ml-2">
          {t('pricing.currentPlan', 'Текущий')}
        </Badge>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-bl from-primary/20 via-violet-500/10 to-transparent rounded-full blur-[150px] animate-morph" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-[120px] animate-morph" style={{ animationDelay: '-7s' }} />
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
                  <img
                    src="/pwa-maskable-512x512.png"
                    alt="LinkMAX"
                    className="h-8 w-8 rounded-xl"
                  />
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
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('pricing.choosePlan', 'Выберите подходящий тариф')}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t('pricing.description', 'Разблокируйте все возможности LinkMAX для вашего бизнеса')}
          </p>
        </div>

        {/* Billing Period Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-muted/50 backdrop-blur-xl rounded-2xl p-1.5 gap-1">
            {([3, 6, 12] as BillingPeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setBillingPeriod(period)}
                className={`relative px-4 sm:px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  billingPeriod === period
                    ? 'bg-card text-foreground shadow-glass'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {period} {t('pricing.months', 'мес')}
                {period === 12 && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    -50%
                  </span>
                )}
                {period === 6 && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    -30%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Savings Banner */}
        {billingPeriod > 3 && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium">
              <Star className="h-4 w-4" />
              {t('pricing.savingsText', 'Экономия')} {getSavingsPercent(billingPeriod)}%
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {Object.entries(pricingPlans).map(([key, plan]) => {
            const Icon = plan.icon;
            const isCurrentPlan = tier === key || (tier === 'free' && key === 'basic');
            const monthlyPrice = plan.prices[billingPeriod];
            const totalPrice = 'totalPrices' in plan ? plan.totalPrices[billingPeriod] : 0;

            return (
              <Card
                key={key}
                className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] ${
                  'popular' in plan && plan.popular
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-border/50'
                } ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}
              >
                {'popular' in plan && plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold rounded-bl-xl">
                    {t('pricing.popular', 'Популярный')}
                  </div>
                )}

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
                        {key === 'pro' && t('pricing.proDesc', 'Для профессионалов')}
                        {key === 'business' && t('pricing.businessDesc', 'Для бизнеса')}
                      </CardDescription>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mt-4">
                    {key === 'basic' ? (
                      <div className="text-3xl font-bold">
                        {t('pricing.free', 'Бесплатно')}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">${monthlyPrice.toFixed(2)}</span>
                          <span className="text-muted-foreground">/{t('pricing.month', 'мес')}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          ${totalPrice} {t('pricing.totalFor', 'за')} {billingPeriod} {t('pricing.months', 'мес')}
                        </div>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features */}
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Limitations for Basic */}
                  {'limitations' in plan && plan.limitations && (
                    <ul className="space-y-2 pt-2 border-t border-border/50">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* CTA Button */}
                  <Button
                    className="w-full mt-4"
                    variant={isCurrentPlan ? 'outline' : 'popular' in plan && plan.popular ? 'default' : 'outline'}
                    disabled={isCurrentPlan || isLoading}
                    onClick={() => handleSelectPlan(key)}
                  >
                    {isCurrentPlan
                      ? t('pricing.currentPlan', 'Текущий план')
                      : key === 'basic'
                      ? t('pricing.startFree', 'Начать бесплатно')
                      : t('pricing.subscribe', 'Подписаться')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust Section */}
        <div className="text-center py-8 border-t border-border/50">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
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
              <span>{t('pricing.moneyBack', 'Гарантия возврата 7 дней')}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

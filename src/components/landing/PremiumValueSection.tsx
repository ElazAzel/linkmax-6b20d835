'use client';
import { useNavigate } from 'react-router-dom';


import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { MessageSquare, Bell, Bot, BarChart3, Crown, Check, ArrowRight, Palette, Sparkles } from 'lucide-react';
import { openPremiumPurchase } from '@/lib/utils/upgrade-utils';

interface PremiumValueSectionProps {
  isVisible: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export function PremiumValueSection({ isVisible, sectionRef }: PremiumValueSectionProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const coreFeatures = [
    {
      icon: MessageSquare,
      title: t('landing.premiumValue.crm.title', 'Mini-CRM'),
      description: t('landing.premiumValue.crm.description', 'Р’СЃРµ Р·Р°СЏРІРєРё СЃ С„РѕСЂРјС‹ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РїРѕРїР°РґР°СЋС‚ РІ CRM. РЎС‚Р°С‚СѓСЃС‹: РЅРѕРІС‹Р№ в†’ РІ СЂР°Р±РѕС‚Рµ в†’ Р·Р°РІРµСЂС€С‘РЅ. Р‘РѕР»СЊС€Рµ РЅРёРєР°РєРѕРіРѕ Excel.'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Bell,
      title: t('landing.premiumValue.telegram.title', 'Telegram-СѓРІРµРґРѕРјР»РµРЅРёСЏ'),
      description: t('landing.premiumValue.telegram.description', 'РњРіРЅРѕРІРµРЅРЅРѕРµ СЃРѕРѕР±С‰РµРЅРёРµ РІ Telegram, РєРѕРіРґР° РєР»РёРµРЅС‚ РѕСЃС‚Р°РІР»СЏРµС‚ Р·Р°СЏРІРєСѓ. РќРµ РїСЂРѕРїСѓСЃС‚РёС‚Рµ РЅРё РѕРґРЅРѕРіРѕ Р»РёРґР°.'),
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: Bot,
      title: t('landing.premiumValue.ai.title', 'Р‘РµР·Р»РёРјРёС‚РЅС‹Р№ AI'),
      description: t('landing.premiumValue.ai.description', 'Р“РµРЅРµСЂР°С†РёСЏ С‚РµРєСЃС‚РѕРІ, Р·Р°РіРѕР»РѕРІРєРѕРІ, РѕРїРёСЃР°РЅРёР№ С‚РѕРІР°СЂРѕРІ - Р±РµР· РѕРіСЂР°РЅРёС‡РµРЅРёР№. AI РєРѕРїРёСЂР°Р№С‚РµСЂ СЂР°Р±РѕС‚Р°РµС‚ РЅР° РІР°СЃ.'),
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: BarChart3,
      title: t('landing.premiumValue.analytics.title', 'Р Р°СЃС€РёСЂРµРЅРЅР°СЏ Р°РЅР°Р»РёС‚РёРєР°'),
      description: t('landing.premiumValue.analytics.description', 'РљР°РєРёРµ СЃСЃС‹Р»РєРё РєР»РёРєР°СЋС‚ С‡Р°С‰Рµ, РѕС‚РєСѓРґР° РїСЂРёС…РѕРґСЏС‚ РєР»РёРµРЅС‚С‹, РІ РєР°РєРѕРµ РІСЂРµРјСЏ Р°РєС‚РёРІРЅРѕСЃС‚СЊ РІС‹С€Рµ.'),
      color: 'from-amber-500 to-orange-500',
    },
  ];

  const bonusFeatures = [
    t('landing.premiumValue.bonus.themes', 'РџСЂРµРјРёСѓРј-С‚РµРјС‹ Рё Р°РЅРёРјР°С†РёРё'),
    t('landing.premiumValue.bonus.scheduler', 'РџР»Р°РЅРёСЂРѕРІС‰РёРє Р±Р»РѕРєРѕРІ'),
    t('landing.premiumValue.bonus.video', 'Р’РёРґРµРѕ Рё РјРµРґРёР°-Р±Р»РѕРєРё'),
  ];

  return (
    <section ref={sectionRef} className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16 space-y-4">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium opacity-0 ${isVisible ? 'animate-fade-in' : ''}`}
          >
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-primary">{t('landing.premiumValue.badge', 'Premium - Р±РѕР»СЊС€Рµ РґРµРЅРµРі')}</span>
          </div>
          <h2
            className={`text-2xl sm:text-3xl lg:text-[2.75rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${isVisible ? 'animate-blur-in' : ''}`}
            style={{ animationDelay: '100ms' }}
          >
            {t('landing.premiumValue.title', 'Р—Р°С‡РµРј РїР»Р°С‚РёС‚СЊ Р·Р° Premium')}
          </h2>
          <p
            className={`text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '200ms' }}
          >
            {t('landing.premiumValue.subtitle', 'РќРµ РІРёР·СѓР°Р»СЊРЅС‹Рµ СѓРєСЂР°С€РµРЅРёСЏ, Р° РёРЅСЃС‚СЂСѓРјРµРЅС‚С‹ РґР»СЏ Р·Р°СЂР°Р±РѕС‚РєР°')}
          </p>
        </div>

        {/* Core money-making features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-10">
          {coreFeatures.map((feature, index) => (
            <div
              key={index}
              className={`group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-card/60 backdrop-blur-xl border border-border/40 hover:border-primary/40 transition-all duration-500 hover:shadow-glass-xl hover:-translate-y-2 cursor-default overflow-hidden opacity-0 ${isVisible ? 'animate-slide-in-up' : ''}`}
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              {/* Background glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

              <div className="flex items-start gap-4 relative">
                <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-xl flex-shrink-0 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-400`}>
                  <feature.icon className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bonus features - visual perks */}
        <div
          className={`p-5 sm:p-6 rounded-2xl bg-card/40 border border-border/30 opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
          style={{ animationDelay: '700ms' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{t('landing.premiumValue.bonusTitle', 'Рђ С‚Р°РєР¶Рµ РїСЂРёСЏС‚РЅС‹Рµ Р±РѕРЅСѓСЃС‹:')}</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {bonusFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 hover:bg-muted/80 hover:scale-105 transition-all duration-300 cursor-default"
              >
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          className={`text-center mt-12 sm:mt-16 space-y-4 opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
          style={{ animationDelay: '800ms' }}
        >
          <Button
            onClick={openPremiumPurchase}
            variant="premium"
            size="lg"
            className="rounded-2xl font-bold px-6 sm:px-8"
          >
            <Crown className="mr-2 h-5 w-5 flex-shrink-0" />
            <span className="truncate">{t('landing.premiumValue.cta', 'РџРѕРїСЂРѕР±РѕРІР°С‚СЊ Premium')}</span>
          </Button>
          <p className="text-sm text-muted-foreground font-medium">
            {t('landing.premiumValue.price', 'РћС‚ 3 045 в‚ё/РјРµСЃСЏС† РїСЂРё РѕРїР»Р°С‚Рµ Р·Р° РіРѕРґ (~$6)')}
          </p>
        </div>
      </div>
    </section>
  );
}


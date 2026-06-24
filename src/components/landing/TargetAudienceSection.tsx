'use client';
import { useNavigate } from 'react-router-dom';


import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Scissors, Heart, Brain, ArrowRight, Bell, MessageSquare, BarChart3 } from 'lucide-react';

interface TargetAudienceSectionProps {
  isVisible: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export function TargetAudienceSection({ isVisible, sectionRef }: TargetAudienceSectionProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const audiences = [
    {
      icon: Heart,
      title: t('landing.targetAudience.beauty.title', 'Р‘СЊСЋС‚Рё-РјР°СЃС‚РµСЂР°'),
      subtitle: t('landing.targetAudience.beauty.subtitle', 'РњР°РЅРёРєСЋСЂ, Р±СЂРѕРІРё, СЂРµСЃРЅРёС†С‹, РІРѕР»РѕСЃС‹'),
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10',
      results: [
        t('landing.targetAudience.beauty.result1', 'Р’СЃРµ СѓСЃР»СѓРіРё Рё С†РµРЅС‹ - РІ РѕРґРЅРѕР№ СЃСЃС‹Р»РєРµ'),
        t('landing.targetAudience.beauty.result2', 'РљР»РёРµРЅС‚С‹ Р·Р°РїРёСЃС‹РІР°СЋС‚СЃСЏ С‡РµСЂРµР· С„РѕСЂРјСѓ'),
        t('landing.targetAudience.beauty.result3', 'РЈРІРµРґРѕРјР»РµРЅРёРµ РІ Telegram Рѕ Р·Р°РїРёСЃРё'),
      ]
    },
    {
      icon: Brain,
      title: t('landing.targetAudience.expert.title', 'Р­РєСЃРїРµСЂС‚С‹ Рё РєРѕСѓС‡Рё'),
      subtitle: t('landing.targetAudience.expert.subtitle', 'РџСЃРёС…РѕР»РѕРіРё, СЂРµРїРµС‚РёС‚РѕСЂС‹, РєРѕРЅСЃСѓР»СЊС‚Р°РЅС‚С‹'),
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-500/10',
      results: [
        t('landing.targetAudience.expert.result1', 'РџРѕСЂС‚С„РѕР»РёРѕ Рё РѕС‚Р·С‹РІС‹ РІ РєСЂР°СЃРёРІРѕРј РІРёРґРµ'),
        t('landing.targetAudience.expert.result2', 'Р›РёРґС‹ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РІ Mini-CRM'),
        t('landing.targetAudience.expert.result3', 'РЎС‚Р°С‚СѓСЃС‹ РєР»РёРµРЅС‚РѕРІ: РЅРѕРІС‹Р№ в†’ РІ СЂР°Р±РѕС‚Рµ в†’ РіРѕС‚РѕРІРѕ'),
      ]
    },
    {
      icon: Scissors,
      title: t('landing.targetAudience.business.title', 'РњР°Р»С‹Р№ Р±РёР·РЅРµСЃ'),
      subtitle: t('landing.targetAudience.business.subtitle', 'Р‘Р°СЂР±РµСЂС‹, С„РѕС‚РѕРіСЂР°С„С‹, РєРѕС„РµР№РЅРё'),
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      results: [
        t('landing.targetAudience.business.result1', 'РљР°С‚Р°Р»РѕРі С‚РѕРІР°СЂРѕРІ Рё СѓСЃР»СѓРі'),
        t('landing.targetAudience.business.result2', 'РђРЅР°Р»РёС‚РёРєР°: РѕС‚РєСѓРґР° РїСЂРёС€Р»Рё РєР»РёРµРЅС‚С‹'),
        t('landing.targetAudience.business.result3', 'РљРѕРЅС‚СЂРѕР»СЊ Р·Р°СЏРІРѕРє Р±РµР· Excel'),
      ]
    },
  ];

  return (
    <section ref={sectionRef} className="py-14 sm:py-20 lg:py-28 px-5 sm:px-6 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-14 space-y-4">
          <h2
            className={`text-2xl sm:text-3xl lg:text-[2.75rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${isVisible ? 'animate-blur-in' : ''}`}
          >
            {t('landing.targetAudience.title', 'Р”Р»СЏ РєРѕРіРѕ СЃРѕР·РґР°РЅ lnkmx.my')}
          </h2>
          <p
            className={`text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl mx-auto opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '150ms' }}
          >
            {t('landing.targetAudience.subtitle', 'РљРѕРЅРєСЂРµС‚РЅС‹Рµ СЂРµР·СѓР»СЊС‚Р°С‚С‹ РґР»СЏ РІР°С€РµР№ РЅРёС€Рё')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {audiences.map((audience, index) => (
            <div
              key={index}
              className={`group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-card/60 backdrop-blur-xl border border-border/40 hover:border-primary/40 transition-all duration-500 hover:shadow-glass-xl hover:-translate-y-2 cursor-default opacity-0 ${isVisible ? 'animate-slide-in-up' : ''}`}
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              {/* Hover glow effect */}
              <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${audience.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`} />

              {/* Header */}
              <div className="flex items-start gap-4 mb-5 relative">
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${audience.color} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                  <audience.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{audience.title}</h3>
                  <p className="text-sm text-muted-foreground">{audience.subtitle}</p>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-3 relative">
                {audience.results.map((result, resultIndex) => (
                  <div
                    key={resultIndex}
                    className="flex items-start gap-3 group/item"
                  >
                    <div className={`h-6 w-6 rounded-lg ${audience.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform`}>
                      {resultIndex === 0 && <BarChart3 className="h-3.5 w-3.5 text-foreground/70" />}
                      {resultIndex === 1 && <MessageSquare className="h-3.5 w-3.5 text-foreground/70" />}
                      {resultIndex === 2 && <Bell className="h-3.5 w-3.5 text-foreground/70" />}
                    </div>
                    <span className="text-sm text-foreground/80 leading-relaxed">{result}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className={`text-center mt-10 sm:mt-14 opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
          style={{ animationDelay: '600ms' }}
        >
          <Button
            onClick={() => navigate('/auth')}
            variant="premium"
            size="lg"
            className="rounded-2xl font-bold px-6 sm:px-8"
          >
            <span className="truncate">{t('landing.targetAudience.cta', 'РЎРѕР·РґР°С‚СЊ СЃС‚СЂР°РЅРёС†Сѓ')}</span>
            <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0" />
          </Button>
        </div>
      </div>
    </section>
  );
}


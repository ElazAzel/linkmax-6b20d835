'use client';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

import { Camera, Scissors, Dumbbell, Brain, Music, ShoppingBag, Star, ArrowRight, Heart, Building2 } from 'lucide-react';
import { useScrollAnimation } from './hooks/useScrollAnimation';

interface UseCase {
  id: string;
  icon: React.ElementType;
  gradient: string;
  avatar: string;
  name: string;
  role: string;
  description: string;
  links: string[];
}

export function UseCasesGallery() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sectionAnimation = useScrollAnimation();

  const useCases: UseCase[] = [
    {
      id: 'photographer',
      icon: Camera,
      gradient: 'from-violet-500 to-purple-600',
      avatar: 'рџ“·',
      name: t('landing.useCases.photographer.name', 'РђР»РµРєСЃРµР№ Р¤РѕС‚Рѕ'),
      role: t('landing.useCases.photographer.role', 'Р¤РѕС‚РѕРіСЂР°С„'),
      description: t('landing.useCases.photographer.desc', 'РџРѕСЂС‚С„РѕР»РёРѕ, С†РµРЅС‹ РЅР° СЃСЉС‘РјРєРё, Р±СЂРѕРЅРёСЂРѕРІР°РЅРёРµ'),
      links: [
        t('landing.useCases.photographer.link1', 'рџЋЁ РџРѕСЂС‚С„РѕР»РёРѕ'),
        t('landing.useCases.photographer.link2', 'рџ’° РџСЂР°Р№СЃ-Р»РёСЃС‚'),
        t('landing.useCases.photographer.link3', 'рџ“… Р—Р°РїРёСЃР°С‚СЊСЃСЏ')
      ]
    },
    {
      id: 'barber',
      icon: Scissors,
      gradient: 'from-amber-500 to-orange-600',
      avatar: 'рџ’€',
      name: t('landing.useCases.barber.name', 'BarberShop MAX'),
      role: t('landing.useCases.barber.role', 'Р‘Р°СЂР±РµСЂС€РѕРї'),
      description: t('landing.useCases.barber.desc', 'РЈСЃР»СѓРіРё, С†РµРЅС‹, РѕРЅР»Р°Р№РЅ-Р·Р°РїРёСЃСЊ'),
      links: [
        t('landing.useCases.barber.link1', 'вњ‚пёЏ РЈСЃР»СѓРіРё'),
        t('landing.useCases.barber.link2', 'рџ“Ќ РђРґСЂРµСЃ'),
        t('landing.useCases.barber.link3', 'рџ“± WhatsApp')
      ]
    },
    {
      id: 'fitness',
      icon: Dumbbell,
      gradient: 'from-emerald-500 to-teal-600',
      avatar: 'рџ’Є',
      name: t('landing.useCases.fitness.name', 'РњР°СЂРёСЏ Р¤РёС‚РЅРµСЃ'),
      role: t('landing.useCases.fitness.role', 'Р¤РёС‚РЅРµСЃ-С‚СЂРµРЅРµСЂ'),
      description: t('landing.useCases.fitness.desc', 'РџСЂРѕРіСЂР°РјРјС‹ С‚СЂРµРЅРёСЂРѕРІРѕРє, РѕРЅР»Р°Р№РЅ-РєСѓСЂСЃС‹'),
      links: [
        t('landing.useCases.fitness.link1', 'рџЏ‹пёЏ РџСЂРѕРіСЂР°РјРјС‹'),
        t('landing.useCases.fitness.link2', 'рџ“№ РћРЅР»Р°Р№РЅ-РєСѓСЂСЃ'),
        t('landing.useCases.fitness.link3', 'вњ‰пёЏ Telegram')
      ]
    },
    {
      id: 'psychologist',
      icon: Brain,
      gradient: 'from-pink-500 to-rose-600',
      avatar: 'рџ§ ',
      name: t('landing.useCases.psychologist.name', 'РђРЅРЅР° РџСЃРёС…РѕР»РѕРі'),
      role: t('landing.useCases.psychologist.role', 'РџСЃРёС…РѕР»РѕРі'),
      description: t('landing.useCases.psychologist.desc', 'РљРѕРЅСЃСѓР»СЊС‚Р°С†РёРё, РЅР°РїСЂР°РІР»РµРЅРёСЏ СЂР°Р±РѕС‚С‹'),
      links: [
        t('landing.useCases.psychologist.link1', 'рџ’¬ Рћ С‚РµСЂР°РїРёРё'),
        t('landing.useCases.psychologist.link2', 'рџ“‹ Р—Р°РїРёСЃР°С‚СЊСЃСЏ'),
        t('landing.useCases.psychologist.link3', 'рџ“љ Р‘Р»РѕРі')
      ]
    },
    {
      id: 'musician',
      icon: Music,
      gradient: 'from-blue-500 to-cyan-600',
      avatar: 'рџЋµ',
      name: t('landing.useCases.musician.name', 'DJ Max'),
      role: t('landing.useCases.musician.role', 'РњСѓР·С‹РєР°РЅС‚'),
      description: t('landing.useCases.musician.desc', 'РњСѓР·С‹РєР°, РјРµСЂРѕРїСЂРёСЏС‚РёСЏ, Р±СѓРєРёРЅРі'),
      links: [
        t('landing.useCases.musician.link1', 'рџЋ§ Spotify'),
        t('landing.useCases.musician.link2', 'рџЋџпёЏ РњРµСЂРѕРїСЂРёСЏС‚РёСЏ'),
        t('landing.useCases.musician.link3', 'рџ“ћ Р‘СѓРєРёРЅРі')
      ]
    },
    {
      id: 'shop',
      icon: ShoppingBag,
      gradient: 'from-indigo-500 to-blue-600',
      avatar: 'рџ›ЌпёЏ',
      name: t('landing.useCases.shop.name', 'Р‘СѓС‚РёРє РњРѕРґР°'),
      role: t('landing.useCases.shop.role', 'РњР°РіР°Р·РёРЅ РѕРґРµР¶РґС‹'),
      description: t('landing.useCases.shop.desc', 'РљР°С‚Р°Р»РѕРі, РґРѕСЃС‚Р°РІРєР°, Р°РєС†РёРё'),
      links: [
        t('landing.useCases.shop.link1', 'рџ‘— РљР°С‚Р°Р»РѕРі'),
        t('landing.useCases.shop.link2', 'рџЏ·пёЏ РђРєС†РёРё'),
        t('landing.useCases.shop.link3', 'рџљљ Р”РѕСЃС‚Р°РІРєР°')
      ]
    }
  ];

  return (
    <section ref={sectionAnimation.ref} className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-gradient-radial from-primary/5 via-transparent to-transparent rounded-full" />
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="text-center mb-10 sm:mb-14 lg:mb-20 space-y-4 sm:space-y-5">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in' : ''}`}
          >
            <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-primary">{t('landing.useCases.badge', 'РџСЂРёРјРµСЂС‹ РёСЃРїРѕР»СЊР·РѕРІР°РЅРёСЏ')}</span>
          </div>
          <h2
            className={`text-2xl sm:text-4xl lg:text-[3.5rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${sectionAnimation.isVisible ? 'animate-blur-in' : ''}`}
            style={{ animationDelay: '150ms' }}
          >
            {t('landing.useCases.title', 'РљС‚Рѕ РёСЃРїРѕР»СЊР·СѓРµС‚ lnkmx.my.')}
          </h2>
          <p
            className={`text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl mx-auto opacity-0 font-normal ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '300ms' }}
          >
            {t('landing.useCases.subtitle', 'Р РµР°Р»СЊРЅС‹Рµ РїСЂРёРјРµСЂС‹ СЃС‚СЂР°РЅРёС† РґР»СЏ СЂР°Р·РЅС‹С… РїСЂРѕС„РµСЃСЃРёР№ Рё Р±РёР·РЅРµСЃРѕРІ')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {useCases.map((useCase, index) => (
            <div
              key={useCase.id}
              className={`group relative rounded-2xl sm:rounded-3xl bg-card/50 backdrop-blur-xl border border-border/40 overflow-hidden hover:border-primary/40 transition-all duration-500 hover:shadow-glass-lg hover:-translate-y-1 sm:hover:-translate-y-2 opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: `${400 + index * 100}ms` }}
            >
              {/* Header with gradient */}
              <div className={`h-20 sm:h-24 lg:h-28 bg-gradient-to-br ${useCase.gradient} relative`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 lg:h-18 lg:w-18 rounded-full bg-card border-4 border-card flex items-center justify-center text-2xl sm:text-3xl shadow-lg group-hover:scale-110 transition-transform">
                    {useCase.avatar}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="pt-10 sm:pt-12 lg:pt-14 pb-5 sm:pb-6 px-4 sm:px-5 lg:px-6 text-center">
                <h3 className="font-bold text-base sm:text-lg mb-1 truncate">{useCase.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-3">{useCase.role}</p>
                <p className="text-sm text-muted-foreground/80 mb-4 line-clamp-2">{useCase.description}</p>

                {/* Mock links */}
                <div className="space-y-1.5 sm:space-y-2">
                  {useCase.links.slice(0, 2).map((link, linkIndex) => (
                    <div
                      key={linkIndex}
                      className="py-2 sm:py-2.5 px-2 sm:px-4 rounded-lg sm:rounded-xl bg-muted/50 hover:bg-muted text-xs sm:text-xs lg:text-sm font-medium transition-colors cursor-default truncate"
                    >
                      {link}
                    </div>
                  ))}
                  {useCase.links.length > 2 && (
                    <div className="hidden sm:block py-2.5 px-4 rounded-xl bg-muted/50 hover:bg-muted text-xs lg:text-sm font-medium transition-colors cursor-default">
                      {useCase.links[2]}
                    </div>
                  )}
                </div>
              </div>

              {/* Icon badge */}
              <div className={`absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 rounded-md sm:rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center`}>
                <useCase.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          className={`text-center mt-8 sm:mt-12 opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
          style={{ animationDelay: '1000ms' }}
        >
          <Button
            size="lg"
            onClick={() => navigate('/gallery')}
            className="rounded-xl sm:rounded-2xl px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all group active:scale-[0.98]"
          >
            {t('landing.useCases.cta', 'РЎРјРѕС‚СЂРµС‚СЊ РІСЃРµ СЃС‚СЂР°РЅРёС†С‹ РІ РіР°Р»РµСЂРµРµ')}
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}


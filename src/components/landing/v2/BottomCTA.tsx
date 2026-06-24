import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Shield, Zap, Heart } from 'lucide-react';
import { MagneticButton } from './MagneticButton';
import { SectionWrapper } from '@/components/shared/SectionWrapper';

export const BottomCTA = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const guarantees = [
    {
      icon: Zap,
      title: t('landing.bottomCta.g1Title', '15 РјРёРЅСѓС‚ РґРѕ Р·Р°РїСѓСЃРєР°'),
      desc: t('landing.bottomCta.g1Desc', 'AI СЃРѕР·РґР°СЃС‚ РІСЃС‘ Р·Р° РІР°СЃ'),
    },
    {
      icon: Shield,
      title: t('landing.bottomCta.g2Title', 'Р‘РµР· РєР°СЂС‚С‹'),
      desc: t('landing.bottomCta.g2Desc', 'РЎС‚Р°СЂС‚ Р°Р±СЃРѕР»СЋС‚РЅРѕ Р±РµСЃРїР»Р°С‚РЅС‹Р№'),
    },
    {
      icon: Heart,
      title: t('landing.bottomCta.g3Title', 'РџРѕРґРґРµСЂР¶РєР° 24/7'),
      desc: t('landing.bottomCta.g3Desc', 'Telegram-С‡Р°С‚ СЃ РєРѕРјР°РЅРґРѕР№'),
    },
  ];

  return (
    <SectionWrapper className="overflow-hidden z-10 bg-transparent">
      <div className="container px-4 mx-auto text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          {/* Live activity badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/15 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">
              {t('landing.bottomCta.live', 'РЎРµРіРѕРґРЅСЏ Р·Р°РїСѓСЃС‚РёР»Рё: 47 СЃС‚СЂР°РЅРёС†')}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-[-0.03em] leading-[1.05]">
            {t('landing.bottomCta.title', 'Р“РѕС‚РѕРІС‹ РїРѕР»СѓС‡Р°С‚СЊ РєР»РёРµРЅС‚РѕРІ?')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground/80 max-w-md mx-auto font-semibold">
            {t(
              'landing.bottomCta.subtitle',
              'AI-СЃС‚СЂР°РЅРёС†Р° Р·Р° 15 РјРёРЅСѓС‚. Р—Р°СЏРІРєРё РІ Telegram. РџРµСЂРІС‹Рµ РєР»РёРµРЅС‚С‹ вЂ” СѓР¶Рµ СЃРµРіРѕРґРЅСЏ.'
            )}
          </p>

          <MagneticButton
            onClick={() => navigate('/auth')}
            size="lg"
            className="h-14 sm:h-16 px-10 sm:px-14 rounded-2xl text-base sm:text-lg font-black bg-primary text-white shadow-glass-hover hover:scale-[1.05] active:scale-95 transition-all group overflow-hidden relative border-none"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
            <span className="relative z-10 flex items-center gap-3 uppercase tracking-[0.1em]">
              {t('landing.bottomCta.cta', 'РЎРѕР·РґР°С‚СЊ СЃС‚СЂР°РЅРёС†Сѓ Р±РµСЃРїР»Р°С‚РЅРѕ')}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-500" />
            </span>
          </MagneticButton>

          <p className="text-xs text-muted-foreground/60 font-semibold">
            {t('landing.bottomCta.note', 'Р‘РµСЃРїР»Р°С‚РЅРѕ В· Р‘РµР· РєРѕРґР° В· Р‘РµР· Р±Р°РЅРєРѕРІСЃРєРѕР№ РєР°СЂС‚С‹')}
          </p>

          {/* Guarantees grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 max-w-2xl mx-auto">
            {guarantees.map((g, i) => {
              const Icon = g.icon;
              return (
                <div
                  key={i}
                  className="glass rounded-2xl p-5 border border-border/20 hover:border-primary/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/15 flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-black mb-1">{g.title}</h3>
                  <p className="text-xs text-muted-foreground">{g.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
};


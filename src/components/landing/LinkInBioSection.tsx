import { useTranslation } from 'react-i18next';
import { Link2, Sparkles, TrendingUp, Shield, Globe, Smartphone } from 'lucide-react';
import { useScrollAnimation } from './hooks/useScrollAnimation';

export function LinkInBioSection() {
  const { t } = useTranslation();
  const sectionAnimation = useScrollAnimation();

  const benefits = [
    { icon: Link2, text: t('landing.linkInBio.benefit1', 'Р’СЃРµ СЃСЃС‹Р»РєРё РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ') },
    { icon: Sparkles, text: t('landing.linkInBio.benefit2', 'AI СЃРѕР·РґР°С‘С‚ РєРѕРЅС‚РµРЅС‚') },
    { icon: TrendingUp, text: t('landing.linkInBio.benefit3', 'РђРЅР°Р»РёС‚РёРєР° РєР»РёРєРѕРІ') },
    { icon: Shield, text: t('landing.linkInBio.benefit4', 'Р‘РµР· РєРѕРјРёСЃСЃРёР№') },
    { icon: Globe, text: t('landing.linkInBio.benefit5', 'РЎРІРѕР№ РґРѕРјРµРЅ') },
    { icon: Smartphone, text: t('landing.linkInBio.benefit6', 'РњРѕР±РёР»СЊРЅС‹Р№ СЂРµРґР°РєС‚РѕСЂ') },
  ];

  return (
    <section 
      id="link-in-bio"
      ref={sectionAnimation.ref}
      className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 bg-muted/20"
    >
      <div className="container mx-auto max-w-5xl">
        <article className="space-y-8 sm:space-y-12">
          {/* Header */}
          <header className="text-center space-y-4">
            <h2 
              className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${sectionAnimation.isVisible ? 'animate-blur-in' : ''}`}
            >
              {t('landing.linkInBio.title', 'Р§С‚Рѕ С‚Р°РєРѕРµ Link-in-Bio Рё Р·Р°С‡РµРј РѕРЅ РЅСѓР¶РµРЅ?')}
            </h2>
            <p 
              className={`text-sm sm:text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '150ms' }}
            >
              {t('landing.linkInBio.subtitle', 'РЎС‚СЂР°РЅРёС†Р° СЃСЃС‹Р»РѕРє вЂ” СЌС‚Рѕ РјРёРЅРё-СЃР°Р№С‚, РєРѕС‚РѕСЂС‹Р№ РѕР±СЉРµРґРёРЅСЏРµС‚ РІСЃРµ РІР°С€Рё СЂРµСЃСѓСЂСЃС‹: СЃРѕС†СЃРµС‚Рё, РјРµСЃСЃРµРЅРґР¶РµСЂС‹, РїРѕСЂС‚С„РѕР»РёРѕ, С‚РѕРІР°СЂС‹ Рё СѓСЃР»СѓРіРё')}
            </p>
          </header>

          {/* Main content */}
          <div 
            className={`prose prose-lg dark:prose-invert max-w-none opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '300ms' }}
          >
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
                <p>
                  {t('landing.linkInBio.p1', 'Link-in-Bio (Р»РёРЅРє РІ Р±РёРѕ, РјСѓР»СЊС‚РёСЃСЃС‹Р»РєР°) вЂ” СЌС‚Рѕ СЃС‚СЂР°РЅРёС†Р°, РєРѕС‚РѕСЂСѓСЋ РІС‹ СЂР°Р·РјРµС‰Р°РµС‚Рµ РІ РѕРїРёСЃР°РЅРёРё РїСЂРѕС„РёР»СЏ Instagram, TikTok, YouTube РёР»Рё Telegram. Р’РјРµСЃС‚Рѕ РѕРґРЅРѕР№ СЃСЃС‹Р»РєРё РІС‹ РїРѕР»СѓС‡Р°РµС‚Рµ РїРѕР»РЅРѕС†РµРЅРЅС‹Р№ РјРёРЅРё-Р»РµРЅРґРёРЅРі СЃ РєРЅРѕРїРєР°РјРё, РєРѕРЅС‚Р°РєС‚Р°РјРё Рё РґР°Р¶Рµ РєР°С‚Р°Р»РѕРіРѕРј С‚РѕРІР°СЂРѕРІ.')}
                </p>
                <p>
                  {t('landing.linkInBio.p2', 'lnkmx.my вЂ” СЃРѕРІСЂРµРјРµРЅРЅР°СЏ Р°Р»СЊС‚РµСЂРЅР°С‚РёРІР° Linktree Рё Taplink СЃ AI-РіРµРЅРµСЂР°С†РёРµР№ РєРѕРЅС‚РµРЅС‚Р°. Р’С‹ РІС‹Р±РёСЂР°РµС‚Рµ РЅРёС€Сѓ (Р±Р°СЂР±РµСЂ, С„РѕС‚РѕРіСЂР°С„, С‚СЂРµРЅРµСЂ, РїСЃРёС…РѕР»РѕРі), Рё РёСЃРєСѓСЃСЃС‚РІРµРЅРЅС‹Р№ РёРЅС‚РµР»Р»РµРєС‚ СЃРѕР·РґР°С‘С‚ РіРѕС‚РѕРІСѓСЋ СЃС‚СЂР°РЅРёС†Сѓ Р·Р° 2 РјРёРЅСѓС‚С‹: СЃ РїСЂРѕС„РёР»РµРј, РЅСѓР¶РЅС‹РјРё Р±Р»РѕРєР°РјРё Рё С‚РµРєСЃС‚Р°РјРё.')}
                </p>
                <p>
                  {t('landing.linkInBio.p3', 'Р’ РѕС‚Р»РёС‡РёРµ РѕС‚ РєРѕРЅРєСѓСЂРµРЅС‚РѕРІ, РјС‹ РЅРµ Р±РµСЂС‘Рј РєРѕРјРёСЃСЃРёСЋ СЃ РІР°С€РёС… РїСЂРѕРґР°Р¶. Р’СЃРµ РґРµРЅСЊРіРё РѕС‚ С‚РѕРІР°СЂРѕРІ Рё СѓСЃР»СѓРі вЂ” РІР°С€Рё. Рђ РІСЃС‚СЂРѕРµРЅРЅР°СЏ Р°РЅР°Р»РёС‚РёРєР° Рё CRM РїРѕРјРѕРіР°СЋС‚ РїРѕРЅСЏС‚СЊ, РєР°РєРёРµ СЃСЃС‹Р»РєРё СЂР°Р±РѕС‚Р°СЋС‚ Р»СѓС‡С€Рµ РІСЃРµРіРѕ.')}
                </p>
              </div>

              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card/60 border border-border/40 opacity-0 ${sectionAnimation.isVisible ? 'animate-stagger-in' : ''}`}
                    style={{ animationDelay: `${400 + index * 80}ms` }}
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Keywords for SEO - visually subtle but present */}
          <footer 
            className={`pt-6 border-t border-border/30 opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: '600ms' }}
          >
            <p className="text-xs text-muted-foreground/60 text-center">
              {t('landing.linkInBio.keywords', 'РљР»СЋС‡РµРІС‹Рµ СЃР»РѕРІР°: СЃС‚СЂР°РЅРёС†Р° СЃСЃС‹Р»РѕРє, Р»РёРЅРє РІ Р±РёРѕ, link in bio, РјСѓР»СЊС‚РёСЃСЃС‹Р»РєР°, linktree Р°Р»СЊС‚РµСЂРЅР°С‚РёРІР°, taplink Р°РЅР°Р»РѕРі, РјРёРЅРё-Р»РµРЅРґРёРЅРі')}
            </p>
          </footer>
        </article>
      </div>
    </section>
  );
}


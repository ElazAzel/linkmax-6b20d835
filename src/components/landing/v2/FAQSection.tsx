import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { cn } from '@/lib/utils/utils';

interface FAQItem {
  q: string;
  a: string;
}

export const FAQSection = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      q: t('landing.faq.q1', 'РЎРєРѕР»СЊРєРѕ СЃС‚РѕРёС‚ СЂРµР°Р»СЊРЅРѕ, Р±РµР· СЃРєСЂС‹С‚С‹С… РїР»Р°С‚РµР¶РµР№?'),
      a: t(
        'landing.faq.a1',
        'Starter вЂ” 0 в‚ё/РјРµСЃ + 5% СЃ РїСЂРѕРґР°Р¶ С‚РѕР»СЊРєРѕ РєРѕРіРґР° РІС‹ Р·Р°СЂР°Р±Р°С‚С‹РІР°РµС‚Рµ. Pro вЂ” 2 900 в‚ё/РјРµСЃ + 1% РєРѕРјРёСЃСЃРёСЏ. РќРёРєР°РєРёС… РїРѕРґРєР»СЋС‡РµРЅРёР№, Р°Р±РѕРЅРµРЅС‚СЃРєРёС… РїР»Р°С‚ Рё СЃСЋСЂРїСЂРёР·РѕРІ РІ СЃС‡С‘С‚Рµ.'
      ),
    },
    {
      q: t('landing.faq.q2', 'Р§РµРј РІС‹ РѕС‚Р»РёС‡Р°РµС‚РµСЃСЊ РѕС‚ Linktree РёР»Рё amoCRM?'),
      a: t(
        'landing.faq.a2',
        'Linktree вЂ” СЌС‚Рѕ РїСЂРѕСЃС‚Рѕ СЃРїРёСЃРѕРє СЃСЃС‹Р»РѕРє Р±РµР· CRM, РѕРїР»Р°С‚ Рё Р·Р°РїРёСЃРё. amoCRM/Bitrix вЂ” С‚СЏР¶С‘Р»С‹Рµ СЃРёСЃС‚РµРјС‹ Р·Р° 15 000+ в‚ё/РјРµСЃ, С‚СЂРµР±СѓСЋС‰РёРµ РјРµСЃСЏС†РµРІ РЅР°СЃС‚СЂРѕР№РєРё. LinkMAX РґР°С‘С‚ РІР°Рј СЃС‚СЂР°РЅРёС†Сѓ + РїСЂРёС‘Рј Р·Р°СЏРІРѕРє + РјРёРЅРё-CRM + РѕРЅР»Р°Р№РЅ-Р·Р°РїРёСЃСЊ Р·Р° 15 РјРёРЅСѓС‚.'
      ),
    },
    {
      q: t('landing.faq.q3', 'РЎРєРѕР»СЊРєРѕ РІСЂРµРјРµРЅРё Р·Р°РЅРёРјР°РµС‚ Р·Р°РїСѓСЃРє?'),
      a: t(
        'landing.faq.a3',
        '15 РјРёРЅСѓС‚ СЃ AI-РєРѕРЅСЃС‚СЂСѓРєС‚РѕСЂРѕРј. РћС‚РІРµС‚СЊС‚Рµ РЅР° 3 РІРѕРїСЂРѕСЃР° Рѕ РІР°С€РµРј Р±РёР·РЅРµСЃРµ вЂ” Gemini AI СЃР°Рј СЃРіРµРЅРµСЂРёСЂСѓРµС‚ С‚РµРєСЃС‚С‹, СѓСЃР»СѓРіРё, С†РµРЅС‹ Рё Р±Р»РѕРєРё. Р”Р°Р»СЊС€Рµ РѕСЃС‚Р°С‘С‚СЃСЏ С‚РѕР»СЊРєРѕ РїРѕРґРєР»СЋС‡РёС‚СЊ Telegram-Р±РѕС‚Р° РґР»СЏ Р·Р°СЏРІРѕРє.'
      ),
    },
    {
      q: t('landing.faq.q4', 'Р—Р°СЏРІРєРё РїСЂРёС…РѕРґСЏС‚ СЃСЂР°Р·Сѓ РёР»Рё СЃ Р·Р°РґРµСЂР¶РєРѕР№?'),
      a: t(
        'landing.faq.a4',
        'Р—Р°СЏРІРєР° СЃ РІР°С€РµР№ СЃС‚СЂР°РЅРёС†С‹ РїРѕРїР°РґР°РµС‚ РІ Telegram-Р±РѕС‚ РІ С‚РµС‡РµРЅРёРµ 3-5 СЃРµРєСѓРЅРґ. Р‘РµР· email-Р·Р°РґРµСЂР¶РµРє, Р±РµР· spam-С„РёР»СЊС‚СЂРѕРІ. РЎСЂРµРґРЅРµРµ РІСЂРµРјСЏ РѕС‚РІРµС‚Р° РєР»РёРµРЅС‚Сѓ Сѓ РЅР°С€РёС… СЌРєСЃРїРµСЂС‚РѕРІ вЂ” 4 РјРёРЅСѓС‚С‹.'
      ),
    },
    {
      q: t('landing.faq.q5', 'РњРѕР¶РЅРѕ Р»Рё РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ СЃРІРѕР№ РґРѕРјРµРЅ?'),
      a: t(
        'landing.faq.a5',
        'Р”Р°, РЅР° Pro-С‚Р°СЂРёС„Рµ РІС‹ РїРѕРґРєР»СЋС‡Р°РµС‚Рµ СЃРІРѕР№ РґРѕРјРµРЅ (РЅР°РїСЂРёРјРµСЂ, masterolga.kz) РѕРґРЅРёРј РєР»РёРєРѕРј. РўР°РєР¶Рµ СѓР±РёСЂР°РµС‚СЃСЏ Р±СЂРµРЅРґРёРЅРі LinkMAX. SSL-СЃРµСЂС‚РёС„РёРєР°С‚ РЅР°СЃС‚СЂР°РёРІР°РµС‚СЃСЏ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё.'
      ),
    },
    {
      q: t('landing.faq.q6', 'РџРѕРґС…РѕРґРёС‚ Р»Рё РґР»СЏ СЃР°Р»РѕРЅР° РєСЂР°СЃРѕС‚С‹ / РєРѕСѓС‡Р° / СЂРµРїРµС‚РёС‚РѕСЂР°?'),
      a: t(
        'landing.faq.a6',
        'Р”Р°. РЈ РЅР°СЃ СЂР°Р±РѕС‚Р°СЋС‚ РїР°СЂРёРєРјР°С…РµСЂС‹, Р±Р°СЂР±РµСЂС€РѕРїС‹, РєРѕСЃРјРµС‚РѕР»РѕРіРё, РЅСѓС‚СЂРёС†РёРѕР»РѕРіРё, СЂРµРїРµС‚РёС‚РѕСЂС‹, С„РёС‚РЅРµСЃ-С‚СЂРµРЅРµСЂС‹, С„РѕС‚РѕРіСЂР°С„С‹ Рё РґРµСЃСЏС‚РєРё РґСЂСѓРіРёС… РЅРёС€. Р”Р»СЏ РєР°Р¶РґРѕР№ РµСЃС‚СЊ РіРѕС‚РѕРІС‹Рµ AI-РїСЂРµСЃРµС‚С‹ СЃС‚СЂР°РЅРёС†.'
      ),
    },
    {
      q: t('landing.faq.q7', 'Р§С‚Рѕ Р±СѓРґРµС‚ СЃ РјРѕРёРјРё РґР°РЅРЅС‹РјРё РµСЃР»Рё СЏ Р·Р°РєСЂРѕСЋ Р°РєРєР°СѓРЅС‚?'),
      a: t(
        'landing.faq.a7',
        'Р’СЃРµ РІР°С€Рё РєРѕРЅС‚Р°РєС‚С‹, Р·Р°СЏРІРєРё Рё СЃС‚СЂР°РЅРёС†С‹ РјРѕР¶РЅРѕ РІС‹РіСЂСѓР·РёС‚СЊ РІ CSV РІ РѕРґРёРЅ РєР»РёРє. Р”Р°РЅРЅС‹Рµ С…СЂР°РЅСЏС‚СЃСЏ РІ Р·Р°С‰РёС‰С‘РЅРЅРѕР№ Р±Р°Р·Рµ СЃ С€РёС„СЂРѕРІР°РЅРёРµРј Рё Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёРјРё Р±СЌРєР°РїР°РјРё.'
      ),
    },
  ];

  return (
    <SectionWrapper id="faq" className="overflow-hidden z-10 bg-transparent">
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-section-title mb-4">
            {t('landing.faq.title', 'Р§Р°СЃС‚С‹Рµ')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              {t('landing.faq.titleHighlight', 'РІРѕРїСЂРѕСЃС‹')}
            </span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            {t('landing.faq.subtitle', 'Р’СЃС‘ С‡С‚Рѕ РЅСѓР¶РЅРѕ Р·РЅР°С‚СЊ РїРµСЂРµРґ СЃС‚Р°СЂС‚РѕРј')}
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={cn(
                  'glass rounded-2xl border border-border/30 overflow-hidden transition-all duration-300',
                  isOpen && 'border-primary/30 shadow-glass'
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 text-left hover:bg-primary/5 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-foreground pr-2">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-primary shrink-0 transition-transform duration-300',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 sm:px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SEO: JSON-LD FAQPage schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />
      </div>
    </SectionWrapper>
  );
};


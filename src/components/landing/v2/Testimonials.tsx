import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils/utils";
import { SectionWrapper } from '@/components/shared/SectionWrapper';

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)', transition: `all 0.5s ease ${delay}ms` }}>
            {children}
        </div>
    );
}

export const Testimonials = () => {
    const { t } = useTranslation();

    const testimonials = [
        {
            name: t('landing.testimonials.name1_v2', 'РђР№РіРµСЂРёРј, СЃС‚СѓРґРёСЏ РјР°РЅРёРєСЋСЂР°'),
            role: t('landing.testimonials.role1_v2', 'РђР»РјР°С‚С‹ В· 2 РјР°СЃС‚РµСЂР° В· Pro'),
            metric: '+186%',
            metricLabel: t('landing.testimonials.metric1_v2', 'Рє РІС‹СЂСѓС‡РєРµ Р·Р° 3 РјРµСЃСЏС†Р°'),
            content: t('landing.testimonials.review1_v2', 'РџРµСЂРµРЅРµСЃР»Рё Р·Р°РїРёСЃСЊ РёР· РґРёСЂРµРєС‚Р° РЅР° РІРёС‚СЂРёРЅСѓ. РўРµРїРµСЂСЊ РєР»РёРµРЅС‚С‹ Р±СЂРѕРЅРёСЂСѓСЋС‚ СЃР°РјРё Рё РѕРїР»Р°С‡РёРІР°СЋС‚ РїСЂРµРґРѕРїР»Р°С‚Сѓ вЂ” РїСЂРѕСЃС‚РѕРµРІ РїРѕС‡С‚Рё РЅРµС‚.'),
            avatar: 'рџ’…',
        },
        {
            name: t('landing.testimonials.name2_v2', 'Р”РјРёС‚СЂРёР№, СЂРµРїРµС‚РёС‚РѕСЂ РїРѕ РјР°С‚РµРјР°С‚РёРєРµ'),
            role: t('landing.testimonials.role2_v2', 'РђСЃС‚Р°РЅР° В· СЃРѕР»Рѕ В· Starter'),
            metric: '4 РјРёРЅ',
            metricLabel: t('landing.testimonials.metric2_v2', 'СЃСЂРµРґРЅРµРµ РІСЂРµРјСЏ РѕС‚РІРµС‚Р°'),
            content: t('landing.testimonials.review2_v2', 'Р—Р°СЏРІРєРё СЃ Р»РµРЅРґРёРЅРіР°, Instagram Рё WhatsApp РїР°РґР°СЋС‚ РІ РѕРґРЅСѓ Р»РµРЅС‚Сѓ. РџРµСЂРµСЃС‚Р°Р» С‚РµСЂСЏС‚СЊ СЂРѕРґРёС‚РµР»РµР№, РєРѕС‚РѕСЂС‹Рµ РїРёСЃР°Р»Рё РЅРѕС‡СЊСЋ.'),
            avatar: 'рџ“ђ',
        },
        {
            name: t('landing.testimonials.name3_v2', 'РЎС‚СѓРґРёСЏ Elazart'),
            role: t('landing.testimonials.role3_v2', 'РљР°СЂР°РіР°РЅРґР° В· 4 С‡РµР»РѕРІРµРєР° В· Team'),
            metric: '+312',
            metricLabel: t('landing.testimonials.metric3_v2', 'РѕРїР»Р°С‡РµРЅРЅС‹С… Р·Р°СЏРІРѕРє Р·Р° 90 РґРЅРµР№'),
            content: t('landing.testimonials.review3_v2', 'РљРѕРјР°РЅРґР° СЂР°Р±РѕС‚Р°РµС‚ РїСЂСЏРјРѕ СЃ С‚РµР»РµС„РѕРЅР°. Р’РёРґРЅРѕ, РєС‚Рѕ РІР·СЏР» Р·Р°СЏРІРєСѓ, РєРѕРіРґР° РѕС‚РІРµС‚РёР», РєР°РєРѕР№ СЃС‚Р°С‚СѓСЃ вЂ” Bitrix Р±РѕР»СЊС€Рµ РЅРµ РЅСѓР¶РµРЅ.'),
            avatar: 'рџЋЁ',
        },
        {
            name: t('landing.testimonials.name4_v2', 'Coach Arman'),
            role: t('landing.testimonials.role4_v2', 'Online В· СЃРѕР»Рѕ В· Pro'),
            metric: 'Г—3',
            metricLabel: t('landing.testimonials.metric4_v2', 'СЂРѕСЃС‚ РїР»Р°С‚РЅС‹С… РїРѕРґРїРёСЃС‡РёРєРѕРІ'),
            content: t('landing.testimonials.review4_v2', 'Р’РёС‚СЂРёРЅР°, СЂР°СЃРїРёСЃР°РЅРёРµ Рё РѕРїР»Р°С‚Р° вЂ” РЅР° РѕРґРЅРѕР№ СЃС‚СЂР°РЅРёС†Рµ. РЎ Linktree С‚Р°РєРѕРіРѕ Р±С‹Р»Рѕ РЅРµ СЃРѕР±СЂР°С‚СЊ РЅРёРєРѕРіРґР°.'),
            avatar: 'рџ’Є',
        },
        {
            name: t('landing.testimonials.name5_v2', 'Asel, РґРѕРјР°С€РЅСЏСЏ РєРѕРЅРґРёС‚РµСЂСЃРєР°СЏ'),
            role: t('landing.testimonials.role5_v2', 'РђР»РјР°С‚С‹ В· СЃРѕР»Рѕ В· Starter'),
            metric: '0 в‚ё',
            metricLabel: t('landing.testimonials.metric5_v2', 'Р°Р±РѕРЅРїР»Р°С‚С‹ вЂ” С‚РѕР»СЊРєРѕ 5% СЃ Р·Р°РєР°Р·Р°'),
            content: t('landing.testimonials.review5_v2', 'РџР»Р°С‚РёР»Р° С‚РѕР»СЊРєРѕ РєРѕРіРґР° СЃР°РјР° Р·Р°СЂР°Р±Р°С‚С‹РІР°Р»Р°. Р§РµСЂРµР· 4 РјРµСЃСЏС†Р° РѕР±РѕСЂРѕС‚ РІС‹СЂРѕСЃ вЂ” РїРµСЂРµРєР»СЋС‡РёР»Р°СЃСЊ РЅР° Pro Рё С‚РµРїРµСЂСЊ СЌРєРѕРЅРѕРјР»СЋ РЅР° РєРѕРјРёСЃСЃРёРё.'),
            avatar: 'рџ§Ѓ',
        },
        {
            name: t('landing.testimonials.name6_v2', 'РђРіРµРЅС‚СЃС‚РІРѕ BrightDigital'),
            role: t('landing.testimonials.role6_v2', 'РЁС‹РјРєРµРЅС‚ В· 7 С‡РµР»РѕРІРµРє В· Team'),
            metric: 'в€’40%',
            metricLabel: t('landing.testimonials.metric6_v2', 'Р·Р°С‚СЂР°С‚ РЅР° РёРЅСЃС‚СЂСѓРјРµРЅС‚С‹'),
            content: t('landing.testimonials.review6_v2', 'Р—Р°РєСЂС‹Р»Рё РїРѕРґРїРёСЃРєРё РЅР° amoCRM, Calendly Рё Tilda. РўРµРїРµСЂСЊ Сѓ РєР°Р¶РґРѕРіРѕ РєР»РёРµРЅС‚Р° вЂ” СЃРІРѕСЏ РєРѕРјР°РЅРґРЅР°СЏ inbox СЃ SLA.'),
            avatar: 'рџЏў',
        },
    ];

    return (
        <SectionWrapper className="overflow-hidden z-10 bg-transparent">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="container px-4 mx-auto relative">
                <Reveal>
                    <h2 className="text-section-title text-center mb-4">
                        {t('landing.testimonials.title_v2', 'Р¦РёС„СЂС‹ РѕС‚ СЂРµР°Р»СЊРЅС‹С…')}{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">{t('landing.testimonials.highlight_v2', 'РєРѕРјР°РЅРґ Рё РјР°СЃС‚РµСЂРѕРІ')}</span>
                    </h2>
                </Reveal>
                <Reveal delay={100}>
                    <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
                        {t('landing.testimonials.subtitle_v2', 'РњРёРєСЂРѕ-РєРѕРјР°РЅРґС‹, Р°РіРµРЅС‚СЃС‚РІР° Рё СЌРєСЃРїРµСЂС‚С‹ РёСЃРїРѕР»СЊР·СѓСЋС‚ LinkMAX, С‡С‚РѕР±С‹ РїСЂРµРІСЂР°С‰Р°С‚СЊ Р·Р°СЏРІРєРё РІ РІС‹СЂСѓС‡РєСѓ.')}
                    </p>
                </Reveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 relative z-10">
                    {testimonials.map((testimonial, i) => (
                        <Reveal key={i} delay={i * 80}>
                            <div className="glass border-white/10 rounded-2xl sm:rounded-[2rem] p-6 sm:p-7 flex flex-col gap-4 transition-all duration-700 hover:-translate-y-2 hover:bg-white/10 shadow-glass-lg group h-full relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                                <div className="flex items-start justify-between gap-3 relative">
                                    <div className="flex gap-1 text-primary">
                                        {[...Array(5)].map((_, j) => (
                                            <Star key={j} className="w-3.5 h-3.5 fill-current" />
                                        ))}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
                                            {testimonial.metric}
                                        </span>
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 text-right max-w-[140px] leading-tight">
                                            {testimonial.metricLabel}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm md:text-base leading-relaxed text-foreground/85 font-medium relative">
                                    В«{testimonial.content}В»
                                </p>

                                <div className="flex items-center gap-3 mt-auto relative pt-4 border-t border-white/5">
                                    <div className="h-10 w-10 border-2 border-white/20 rounded-2xl shadow-glass flex items-center justify-center bg-primary/10 text-lg">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold tracking-tight text-foreground">{testimonial.name}</div>
                                        <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary/70">{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </SectionWrapper>
    );
};


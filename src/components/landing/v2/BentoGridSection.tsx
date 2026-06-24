import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/utils";
import { useTranslation } from "react-i18next";
import { BentoGrid, BentoGridItem } from "./BentoGrid";
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { Sparkles, BarChart3, Smartphone, Send, Kanban, Calendar } from 'lucide-react';

/** Reveal on scroll wrapper */
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
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms` }}>
      {children}
    </div>
  );
}

const AIBuilderVisual = () => {
  const { t } = useTranslation();
  const [typing, setTyping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setTyping(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 items-center justify-center relative overflow-hidden group-hover/bento:scale-105 transition-transform duration-500">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_25%,hsl(var(--primary)/0.08)_50%,transparent_75%)] bg-[length:200%_200%] animate-[gradient-shift_3s_ease_infinite]" />
      <div className="flex flex-col items-center gap-2 z-10">
        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        <div className={cn("text-xl font-bold text-primary transition-opacity duration-700", typing ? "opacity-100" : "opacity-0")}>
          {t('landing.bento.aiPowered', 'AI-Р“РµРЅРµСЂР°С†РёСЏ')}
        </div>
        <div className={cn("text-xs text-muted-foreground transition-opacity duration-700 delay-300", typing ? "opacity-100" : "opacity-0")}>
          {t('landing.bento.aiSub', 'РЎС‚СЂСѓРєС‚СѓСЂР° вЂў РўРµРєСЃС‚С‹ вЂў Р”РёР·Р°Р№РЅ')}
        </div>
      </div>
    </div>
  );
};

const AnalyticsVisual = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const bars = [40, 60, 50, 80, 65, 90, 70];
  return (
    <div ref={ref} className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 items-end justify-center pb-4 gap-2 group-hover/bento:scale-105 transition-transform duration-500">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-4 bg-primary/60 rounded-t-sm transition-all duration-1000 hover:bg-primary"
          style={{ height: visible ? `${h}%` : '10px', transitionDelay: `${i * 100}ms` }}
        />
      ))}
    </div>
  );
};

const CRMVisual = () => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const stages = [
    { label: t('landing.bento.crmNew', 'РќРѕРІС‹Рµ'), count: 5, color: 'bg-blue-500' },
    { label: t('landing.bento.crmInProgress', 'Р’ СЂР°Р±РѕС‚Рµ'), count: 3, color: 'bg-yellow-500' },
    { label: t('landing.bento.crmDone', 'Р“РѕС‚РѕРІРѕ'), count: 8, color: 'bg-green-500' },
  ];
  return (
    <div ref={ref} className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 items-center justify-center gap-3 p-4 group-hover/bento:scale-105 transition-transform duration-500">
      {stages.map((s, i) => (
        <div
          key={i}
          className={cn("flex flex-col items-center gap-1 rounded-lg bg-background/60 backdrop-blur-sm border border-border/40 p-2 flex-1 transition-all duration-500", visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}
          style={{ transitionDelay: `${i * 150}ms` }}
        >
          <div className={cn("w-2 h-2 rounded-full", s.color)} />
          <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
          <span className="text-lg font-bold text-foreground">{s.count}</span>
        </div>
      ))}
    </div>
  );
};

const MobileVisual = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 items-center justify-center relative group-hover/bento:scale-105 transition-transform duration-500">
    <div className="w-24 h-40 border-4 border-primary/30 rounded-[1.5rem] bg-foreground/80 flex flex-col items-center pt-2 shadow-lg shadow-primary/10">
      <div className="w-8 h-1 bg-primary/30 rounded-full mb-2" />
      <div className="w-16 h-2 bg-muted-foreground/30 rounded-sm mb-1" />
      <div className="w-16 h-2 bg-muted-foreground/20 rounded-sm mb-1" />
      <div className="w-12 h-8 bg-primary/60 rounded-lg mt-4 animate-pulse" />
    </div>
  </div>
);

const LeadsVisual = () => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const items = [
    { text: t('landing.bento.lead1', 'РќРѕРІР°СЏ Р·Р°СЏРІРєР°: РђР№РіРµСЂРёРј Рљ.'), delay: '200ms' },
    { text: t('landing.bento.lead2', 'РќРѕРІР°СЏ Р·Р°СЏРІРєР°: Р”РјРёС‚СЂРёР№ Рњ.'), delay: '500ms' },
    { text: t('landing.bento.leadCount', '+12 СЃРµРіРѕРґРЅСЏ'), delay: '800ms', highlight: true },
  ];
  return (
    <div ref={ref} className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-sky-500/15 to-primary/5 items-center justify-center relative overflow-hidden group-hover/bento:scale-105 transition-transform duration-500">
      <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 shrink-0">
        <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-sky-500/20 flex items-center justify-center shadow-lg">
          <Send className="w-5 h-5 md:w-7 md:h-7 text-sky-500" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5 md:gap-2 ml-16 md:ml-24 overflow-hidden pr-2">
        {items.map((item, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm transition-all duration-500",
              item.highlight ? "bg-primary/10 border border-primary/20" : "bg-background/80 backdrop-blur-sm border border-border/40",
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5"
            )}
            style={{ transitionDelay: item.delay }}
          >
            {!item.highlight && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            <span className={cn("text-xs", item.highlight ? "font-bold text-primary" : "font-medium")}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BookingVisual = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-violet-500/15 to-primary/5 items-center justify-center relative overflow-hidden group-hover/bento:scale-105 transition-transform duration-500">
      <div className="flex flex-col gap-1.5 p-3">
        {['10:00', '11:30', '14:00'].map((time, i) => (
          <div key={i} className={cn("flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors", i === 1 ? "bg-primary/15 text-primary border border-primary/20" : "bg-muted/50 text-muted-foreground")}>
            <Calendar className="w-3 h-3" />
            {time} вЂ” {t('landing.bento.bookingSlot', 'РЎРІРѕР±РѕРґРЅРѕ')}
          </div>
        ))}
      </div>
    </div>
  );
};

export function BentoGridSection() {
  const { t } = useTranslation();

  const items = [
    {
      title: t('landing.bento.leadsTitle_v2', 'Inbox Р·Р°СЏРІРѕРє: РЅРёС‡РµРіРѕ РЅРµ С‚РµСЂСЏРµС‚СЃСЏ'),
      description: t('landing.bento.leadsDesc_v2', 'Р—Р°СЏРІРєРё РёР· С„РѕСЂРјС‹, РјРµСЃСЃРµРЅРґР¶РµСЂРѕРІ Рё Р±СЂРѕРЅРёСЂРѕРІР°РЅРёСЏ вЂ” РІ РѕРґРЅРѕР№ Р»РµРЅС‚Рµ СЃ SLA-С‚Р°Р№РјРµСЂРѕРј. РЎСЂРµРґРЅРµРµ РІСЂРµРјСЏ РїРµСЂРІРѕР№ СЂРµР°РєС†РёРё Сѓ РєР»РёРµРЅС‚РѕРІ вЂ” 4 РјРёРЅСѓС‚С‹.'),
      header: <LeadsVisual />,
      icon: <Send className="h-5 w-5" />,
      className: "md:col-span-2 md:row-span-2"
    },
    {
      title: t('landing.bento.crmTitle_v2', 'РњРёРЅРё-CRM РґР»СЏ РєРѕРјР°РЅРґС‹'),
      description: t('landing.bento.crmDesc_v2', 'РљР°РЅР±Р°РЅ СЃРѕ СЃРґРµР»РєР°РјРё, РѕС‚РІРµС‚СЃС‚РІРµРЅРЅС‹Р№ Р·Р° РєР°Р¶РґСѓСЋ Р·Р°СЏРІРєСѓ, РёСЃС‚РѕСЂРёСЏ РїРµСЂРµРїРёСЃРєРё. Р’РјРµСЃС‚Рѕ amoCRM Рё Bitrix.'),
      header: <CRMVisual />,
      icon: <Kanban className="h-5 w-5" />,
      className: "md:col-span-1 md:row-span-1"
    },
    {
      title: t('landing.bento.bookingTitle_v2', 'РћРЅР»Р°Р№РЅ-Р·Р°РїРёСЃСЊ Рё РѕРїР»Р°С‚Р°'),
      description: t('landing.bento.bookingDesc_v2', 'РљР»РёРµРЅС‚ Р±СЂРѕРЅРёСЂСѓРµС‚ СЃР»РѕС‚ Рё РїР»Р°С‚РёС‚ СЃСЂР°Р·Сѓ. Robokassa Рё Kaspi QR РїРѕРґРєР»СЋС‡РµРЅС‹ РёР· РєРѕСЂРѕР±РєРё.'),
      header: <BookingVisual />,
      icon: <Calendar className="h-5 w-5" />,
      className: "md:col-span-1 md:row-span-2"
    },
    {
      title: t('landing.bento.aiTitle_v2', 'AI СЃРѕР±РёСЂР°РµС‚ РІРёС‚СЂРёРЅСѓ Р·Р° 2 РјРёРЅСѓС‚С‹'),
      description: t('landing.bento.aiDesc_v2', 'РћРїРёС€РёС‚Рµ СѓСЃР»СѓРіСѓ вЂ” Gemini СЃРґРµР»Р°РµС‚ СЃС‚СЂСѓРєС‚СѓСЂСѓ, РѕРїРёСЃР°РЅРёСЏ Рё С†РµРЅС‹ РїРѕРґ РІР°С€Сѓ РЅРёС€Сѓ.'),
      header: <AIBuilderVisual />,
      icon: <Sparkles className="h-5 w-5" />,
      className: "md:col-span-1 md:row-span-1"
    },
    {
      title: t('landing.bento.analyticsTitle_v2', 'РђРЅР°Р»РёС‚РёРєР° Р±РµР· GA4'),
      description: t('landing.bento.analyticsDesc_v2', 'РћС‚РєСѓРґР° РїСЂРёС€С‘Р» РєР»РёРµРЅС‚, РЅР° РєР°РєРѕР№ Р±Р»РѕРє РєР»РёРєРЅСѓР», С‡С‚Рѕ РєСѓРїРёР» вЂ” Р±РµР· cookie Рё СЃС‚РѕСЂРѕРЅРЅРёС… СЃРµСЂРІРёСЃРѕРІ.'),
      header: <AnalyticsVisual />,
      icon: <BarChart3 className="h-5 w-5" />,
      className: "md:col-span-1 md:row-span-1"
    },
    {
      title: t('landing.bento.mobileTitle_v2', 'Р‘РёР·РЅРµСЃ РІ РєР°СЂРјР°РЅРµ'),
      description: t('landing.bento.mobileDesc_v2', 'РџРѕР»РЅРѕС†РµРЅРЅС‹Р№ СЂРµРґР°РєС‚РѕСЂ Рё CRM СЂР°Р±РѕС‚Р°СЋС‚ СЃ С‚РµР»РµС„РѕРЅР°. PWA, iOS Рё Android.'),
      header: <MobileVisual />,
      icon: <Smartphone className="h-5 w-5" />,
      className: "md:col-span-1 md:row-span-1"
    },
  ];

  return (
    <SectionWrapper id="features" className="py-24 bg-transparent border-none">
      {/* Dynamic background glow that follows the canvas */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px] pointer-events-none" />

      <Reveal>
        <SectionHeading
          title={t('landing.bento.sectionTitle_v2', 'РЁРµСЃС‚СЊ РёРЅСЃС‚СЂСѓРјРµРЅС‚РѕРІ РІРјРµСЃС‚Рѕ РґРµСЃСЏС‚Рё РїРѕРґРїРёСЃРѕРє')}
          subtitle={t('landing.bento.sectionDesc_v2', 'Р’РёС‚СЂРёРЅР°, РјРµСЃСЃРµРЅРґР¶РµСЂС‹, inbox, Р±СЂРѕРЅРёСЂРѕРІР°РЅРёРµ, РѕРїР»Р°С‚Р° Рё Р°РЅР°Р»РёС‚РёРєР° вЂ” Р±РµР· РёРЅС‚РµРіСЂР°С†РёР№ Рё Zapier.')}
          className="mb-16"
        />
      </Reveal>

      <BentoGrid className="max-w-6xl mx-auto md:auto-rows-[20rem] gap-[var(--space-block-gap)]">
        {items.map((item, i) => (
          <Reveal key={i} delay={i * 100}>
            <BentoGridItem
              title={item.title}
              description={item.description}
              header={item.header}
              icon={item.icon}
              className={item.className}
            />
          </Reveal>
        ))}
      </BentoGrid>
    </SectionWrapper>
  );
}


import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/utils";
import { useTranslation } from "react-i18next";
import { BentoGrid, BentoGridItem } from "./BentoGrid";
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Send from 'lucide-react/dist/esm/icons/send';
import Kanban from 'lucide-react/dist/esm/icons/kanban-square';
import Calendar from 'lucide-react/dist/esm/icons/calendar';

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
          {t('landing.bento.aiPowered', 'AI-Powered')}
        </div>
        <div className={cn("text-xs text-muted-foreground transition-opacity duration-700 delay-300", typing ? "opacity-100" : "opacity-0")}>
          {t('landing.bento.aiSub', 'Structure • Copy • Design')}
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
    { label: t('landing.bento.crmNew', 'New'), count: 5, color: 'bg-blue-500' },
    { label: t('landing.bento.crmInProgress', 'In Progress'), count: 3, color: 'bg-yellow-500' },
    { label: t('landing.bento.crmDone', 'Done'), count: 8, color: 'bg-green-500' },
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
    { text: t('landing.bento.lead1', 'New lead: Sarah K.'), delay: '200ms' },
    { text: t('landing.bento.lead2', 'New lead: Alex M.'), delay: '500ms' },
    { text: t('landing.bento.leadCount', '+12 today'), delay: '800ms', highlight: true },
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
            {time} — {t('landing.bento.bookingSlot', 'Available')}
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
      title: t('landing.bento.aiTitle', 'AI Page Builder'),
      description: t('landing.bento.aiDesc', 'Describe your business and AI creates the perfect structure, copy, and layout in seconds.'),
      header: <AIBuilderVisual />,
      icon: <Sparkles className="h-5 w-5" />,
      className: "md:col-span-2 md:row-span-2"
    },
    {
      title: t('landing.bento.analyticsTitle', 'Live Analytics'),
      description: t('landing.bento.analyticsDesc', 'Track every click, view, and conversion with real-time, privacy-first analytics.'),
      header: <AnalyticsVisual />,
      icon: <BarChart3 className="h-5 w-5" />,
      className: "md:col-span-1 md:row-span-1"
    },
    {
      title: t('landing.bento.leadsTitle', 'Instant Leads'),
      description: t('landing.bento.leadsDesc', 'Get leads delivered straight to Telegram. Never miss a customer.'),
      header: <LeadsVisual />,
      icon: <Send className="h-5 w-5" />,
      className: "md:col-span-1 md:row-span-2"
    },
    {
      title: t('landing.bento.mobileTitle', 'Mobile First'),
      description: t('landing.bento.mobileDesc', 'Full editing power from your phone. Build and publish on the go.'),
      header: <MobileVisual />,
      icon: <Smartphone className="h-5 w-5" />,
      className: "md:col-span-1 md:row-span-1"
    },
    {
      title: t('landing.bento.crmTitle', 'Built-in CRM'),
      description: t('landing.bento.crmDesc', 'Manage leads, deals, and clients from a Kanban pipeline. No extra tools needed.'),
      header: <CRMVisual />,
      icon: <Kanban className="h-5 w-5" />,
      className: "md:col-span-1 md:row-span-1"
    },
    {
      title: t('landing.bento.bookingTitle', 'Online Booking'),
      description: t('landing.bento.bookingDesc', 'Let clients book slots directly. Automated calendar, zero phone calls.'),
      header: <BookingVisual />,
      icon: <Calendar className="h-5 w-5" />,
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
          title={t('landing.bento.sectionTitle', 'Everything you need to grow')}
          subtitle={t('landing.bento.sectionDesc', 'Website builder + CRM + analytics. One platform instead of ten tools.')}
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
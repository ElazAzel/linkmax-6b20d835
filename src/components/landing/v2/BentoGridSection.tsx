import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/utils";
import { useTranslation } from "react-i18next";
import { BentoGrid, BentoGridItem } from "./BentoGrid";
import Copy from 'lucide-react/dist/esm/icons/copy';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Users from 'lucide-react/dist/esm/icons/users';
import Send from 'lucide-react/dist/esm/icons/send';

const AIBuilderVisual = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center relative overflow-hidden group-hover/bento:scale-105 transition-transform duration-500">
      <div className="text-3xl font-bold text-primary animate-pulse mx-[10px]">{t('landing.aiPowered', 'AI Powered')}</div>
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
          className="w-4 bg-primary/60 rounded-t-sm transition-all duration-1000"
          style={{
            height: visible ? `${h}%` : '10px',
            transitionDelay: `${i * 100}ms`,
          }}
        />
      ))}
    </div>
  );
};

const MobileVisual = () => (
  <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 items-center justify-center relative group-hover/bento:scale-105 transition-transform duration-500">
    <div className="w-24 h-40 border-4 border-primary/30 rounded-[1.5rem] bg-foreground/80 flex flex-col items-center pt-2">
      <div className="w-8 h-1 bg-primary/30 rounded-full mb-2" />
      <div className="w-16 h-2 bg-muted-foreground/30 rounded-sm mb-1" />
      <div className="w-16 h-2 bg-muted-foreground/20 rounded-sm mb-1" />
      <div className="w-12 h-8 bg-primary/60 rounded-lg mt-4" />
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
    { text: t('landing.newLead1', 'New lead: Sarah K.'), delay: '200ms' },
    { text: t('landing.newLead2', 'New lead: Alex M.'), delay: '500ms' },
    { text: t('landing.newLeadsToday', '+12 today'), delay: '800ms', highlight: true },
  ];

  return (
    <div ref={ref} className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-sky-500/15 to-primary/5 items-center justify-center relative overflow-hidden group-hover/bento:scale-105 transition-transform duration-500">
      <div className="absolute left-6 top-1/2 -translate-y-1/2">
        <div className="w-14 h-14 rounded-2xl bg-sky-500/20 flex items-center justify-center shadow-lg">
          <Send className="w-7 h-7 text-sky-500" />
        </div>
      </div>
      <div className="flex flex-col gap-2 ml-24">
        {items.map((item, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 rounded-full px-3 py-1.5 shadow-sm transition-all duration-500",
              item.highlight
                ? "bg-primary/10 border border-primary/20"
                : "bg-background/80 backdrop-blur-sm border border-border/40",
              visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5"
            )}
            style={{ transitionDelay: item.delay }}
          >
            {!item.highlight && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            <span className={cn("text-xs", item.highlight ? "font-bold text-primary" : "font-medium")}>
              {item.text}
            </span>
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
      title: t('landing.aiBuilderTitle', 'AI Page Builder'),
      description: t('landing.aiBuilderDesc', 'Describe your business, and our AI builds the perfect structure, copy, and layout in seconds.'),
      header: <AIBuilderVisual />,
      icon: <Copy className="h-4 w-4 text-muted-foreground" />,
      className: "md:col-span-2"
    },
    {
      title: t('landing.deepAnalyticsTitle', 'Deep Analytics'),
      description: t('landing.deepAnalyticsDesc', 'Track every click, view, and conversion with privacy-focused, real-time analytics.'),
      header: <AnalyticsVisual />,
      icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
      className: "md:col-span-1"
    },
    {
      title: t('landing.mobileEditorTitle', 'Mobile First Editor'),
      description: t('landing.mobileEditorDesc', 'Edit your page from your phone. Full power in your pocket.'),
      header: <MobileVisual />,
      icon: <Smartphone className="h-4 w-4 text-muted-foreground" />,
      className: "md:col-span-1"
    },
    {
      title: t('landing.instantLeadsTitle', 'Instant Leads'),
      description: t('landing.instantLeadsDesc', 'Get leads delivered straight to Telegram. No more missing customers.'),
      header: <LeadsVisual />,
      icon: <Users className="h-4 w-4 text-muted-foreground" />,
      className: "md:col-span-2"
    }
  ];

  return (
    <div className="py-20 relative px-4">
      <div className="max-w-7xl mx-auto mb-10 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-4">{t('landing.growTitle', 'Everything you need to grow')}</h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          {t('landing.growDesc', 'Powerful features wrapped in a beautiful, easy-to-use interface.')}
        </p>
      </div>
      <BentoGrid className="max-w-4xl mx-auto">
        {items.map((item, i) => (
          <BentoGridItem
            key={i}
            title={item.title}
            description={item.description}
            header={item.header}
            icon={item.icon}
            className={item.className}
          />
        ))}
      </BentoGrid>
    </div>
  );
}

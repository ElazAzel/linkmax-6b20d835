import React from "react";
import { cn } from "@/lib/utils/utils";
import { useTranslation } from "react-i18next";
import { BentoGrid, BentoGridItem } from "./BentoGrid";
import { Copy, BarChart3, Smartphone, Users, Send } from "lucide-react";
import { motion } from "framer-motion";

const AIBuilderVisual = () => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center relative overflow-hidden group-hover/bento:scale-105 transition-transform duration-500">
            <div className="text-3xl font-bold text-primary animate-pulse">{t('landing.aiPowered', 'AI Powered')}</div>
        </div>
    );
};

const AnalyticsVisual = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 items-end justify-center pb-4 gap-2 group-hover/bento:scale-105 transition-transform duration-500">
        {[40, 60, 50, 80, 65, 90, 70].map((h, i) => (
            <motion.div
                key={i}
                initial={{ height: 10 }}
                whileInView={{ height: `${h}%` }}
                transition={{ duration: 1, delay: i * 0.1 }}
                className="w-4 bg-primary/60 rounded-t-sm"
            />
        ))}
    </div>
);

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
    return (
        <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-sky-500/15 to-primary/5 items-center justify-center relative overflow-hidden group-hover/bento:scale-105 transition-transform duration-500">
            {/* Telegram-style icon */}
            <div className="absolute left-6 top-1/2 -translate-y-1/2">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/20 flex items-center justify-center shadow-lg">
                    <Send className="w-7 h-7 text-sky-500" />
                </div>
            </div>
            {/* Notification bubbles */}
            <div className="flex flex-col gap-2 ml-24">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-border/40"
                >
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium">{t('landing.newLead1', 'New lead: Sarah K.')}</span>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-border/40"
                >
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium">{t('landing.newLead2', 'New lead: Alex M.')}</span>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1.5 border border-primary/20"
                >
                    <span className="text-xs font-bold text-primary">{t('landing.newLeadsToday', '+12 today')}</span>
                </motion.div>
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
            className: "md:col-span-2",
        },
        {
            title: t('landing.deepAnalyticsTitle', 'Deep Analytics'),
            description: t('landing.deepAnalyticsDesc', 'Track every click, view, and conversion with privacy-focused, real-time analytics.'),
            header: <AnalyticsVisual />,
            icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
            className: "md:col-span-1",
        },
        {
            title: t('landing.mobileEditorTitle', 'Mobile First Editor'),
            description: t('landing.mobileEditorDesc', 'Edit your page from your phone. Full power in your pocket.'),
            header: <MobileVisual />,
            icon: <Smartphone className="h-4 w-4 text-muted-foreground" />,
            className: "md:col-span-1",
        },
        {
            title: t('landing.instantLeadsTitle', 'Instant Leads'),
            description: t('landing.instantLeadsDesc', 'Get leads delivered straight to Telegram. No more missing customers.'),
            header: <LeadsVisual />,
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
            className: "md:col-span-2",
        },
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

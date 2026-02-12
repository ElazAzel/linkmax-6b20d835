import React from "react";
import { cn } from "@/lib/utils";
import { BentoGrid, BentoGridItem } from "./BentoGrid";
import { Copy, BarChart3, Smartphone, Users } from "lucide-react";
import { motion } from "framer-motion";

// Skeleton components for the graphics
const Skeleton = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100 animate-pulse"></div>
);

const AIBuilderVisual = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 items-center justify-center relative overflow-hidden group-hover/bento:scale-105 transition-transform duration-500">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="text-3xl font-bold text-violet-500 animate-pulse">AI Powered</div>
    </div>
);

const AnalyticsVisual = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 items-end justify-center pb-4 gap-2 group-hover/bento:scale-105 transition-transform duration-500">
        {[40, 60, 50, 80, 65, 90, 70].map((h, i) => (
            <motion.div
                key={i}
                initial={{ height: 10 }}
                whileInView={{ height: `${h}%` }}
                transition={{ duration: 1, delay: i * 0.1 }}
                className="w-4 bg-amber-500/80 rounded-t-sm"
            />
        ))}
    </div>
);

const MobileVisual = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 items-center justify-center relative group-hover/bento:scale-105 transition-transform duration-500">
        <div className="w-24 h-40 border-4 border-emerald-500/50 rounded-[1.5rem] bg-black/80 flex flex-col items-center pt-2">
            <div className="w-8 h-1 bg-emerald-500/30 rounded-full mb-2" />
            <div className="w-16 h-2 bg-neutral-700 rounded-sm mb-1" />
            <div className="w-16 h-2 bg-neutral-700/50 rounded-sm mb-1" />
            <div className="w-12 h-8 bg-emerald-500/80 rounded-lg mt-4" />
        </div>
    </div>
);

const items = [
    {
        title: "AI Page Builder",
        description: "Describe your business, and our AI builds the perfect structure, copy, and layout in seconds.",
        header: <AIBuilderVisual />,
        icon: <Copy className="h-4 w-4 text-muted-foreground" />,
        className: "md:col-span-2",
    },
    {
        title: "Deep Analytics",
        description: "Track every click, view, and conversion with privacy-focused, real-time analytics.",
        header: <AnalyticsVisual />,
        icon: <BarChart3 className="h-4 w-4 text-muted-foreground" />,
        className: "md:col-span-1",
    },
    {
        title: "Mobile First Editor",
        description: "Edit your page from your phone. Full power in your pocket.",
        header: <MobileVisual />,
        icon: <Smartphone className="h-4 w-4 text-muted-foreground" />,
        className: "md:col-span-1",
    },
    {
        title: "Instant Leads",
        description:
            "Get leads delivered straight to Telegram. No more missing customers.",
        header: <Skeleton />,
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        className: "md:col-span-2",
    },
];

export function BentoGridSection() {
    return (
        <div className="py-20 relative px-4">
            <div className="absolute inset-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
            <div className="max-w-7xl mx-auto mb-10 text-center">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to grow</h2>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                    Powerful features wrapped in a beautiful, easy-to-use interface.
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

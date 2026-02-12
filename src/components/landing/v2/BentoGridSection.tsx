import React from "react";
import { cn } from "@/lib/utils";
import { BentoGrid, BentoGridItem } from "./BentoGrid";
import { Copy, BarChart3, Smartphone, Users } from "lucide-react";
import { motion } from "framer-motion";

const Skeleton = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-muted to-muted/50 animate-pulse"></div>
);

const AIBuilderVisual = () => (
    <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center relative overflow-hidden group-hover/bento:scale-105 transition-transform duration-500">
        <div className="text-3xl font-bold text-primary animate-pulse">AI Powered</div>
    </div>
);

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
        description: "Get leads delivered straight to Telegram. No more missing customers.",
        header: <Skeleton />,
        icon: <Users className="h-4 w-4 text-muted-foreground" />,
        className: "md:col-span-2",
    },
];

export function BentoGridSection() {
    return (
        <div className="py-20 relative px-4">
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

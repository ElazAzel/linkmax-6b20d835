import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Check, User, MessageSquare, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const steps = [
    {
        title: "Choose your niche",
        description: "Tell AI what you do. Beauty, Crypto, Coaching - we speak your language.",
        icon: <User className="w-5 h-5" />,
        mockContent: (
            <div className="flex flex-col gap-2 p-4 max-h-[260px] overflow-y-auto scrollbar-hide">
                <div className="text-sm font-bold opacity-50 mb-2">I am a...</div>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-medium">Digital Creator</div>
                <div className="p-3 rounded-lg bg-muted border border-transparent opacity-50">Fitness Coach</div>
                <div className="p-3 rounded-lg bg-muted border border-transparent opacity-50">Crypto Expert</div>
                <div className="p-3 rounded-lg bg-muted border border-transparent opacity-50">Beauty Blogger</div>
                <div className="p-3 rounded-lg bg-muted border border-transparent opacity-50">Music Producer</div>
                <div className="p-3 rounded-lg bg-muted border border-transparent opacity-50">Online Tutor</div>
            </div>
        )
    },
    {
        title: "AI builds everything",
        description: "Structure, copy, and design generated in seconds. No drag-and-drop hell.",
        icon: <Zap className="w-5 h-5" />,
        mockContent: (
            <div className="flex flex-col gap-2 p-4">
                <div className="flex gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <div className="text-xs opacity-50">AI Generating...</div>
                </div>
                <div className="h-20 rounded-lg bg-muted animate-pulse" />
                <div className="h-8 rounded-lg bg-muted animate-pulse w-2/3" />
                <div className="h-24 rounded-lg bg-muted animate-pulse" />
            </div>
        )
    },
    {
        title: "Get leads in Telegram",
        description: "Your page is live. Leads come straight to your DM. Close them instantly.",
        icon: <MessageSquare className="w-5 h-5" />,
        mockContent: (
            <div className="flex flex-col gap-2 p-4">
                <div className="p-3 rounded-xl bg-primary text-primary-foreground rounded-br-none self-end max-w-[80%] text-sm">
                    Hey, I want to book a consultation!
                </div>
                <div className="p-3 rounded-xl bg-muted rounded-bl-none self-start max-w-[80%] text-sm">
                    Awesome! Let's schedule it.
                </div>
                <div className="mt-4 flex items-center gap-2 p-2 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="text-xs font-semibold text-primary">New Lead Captured</div>
                </div>
            </div>
        )
    }
];

/** Mobile: simple vertical layout. Desktop: sticky scroll with phone mockup. */
export const InteractiveDemo = () => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return <MobileDemo />;
    }

    return <DesktopDemo />;
};

function MobileDemo() {
    return (
        <section className="py-16 bg-background">
            <div className="container px-4">
                <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
                <div className="space-y-8">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.4, delay: i * 0.1 }}
                            className="flex flex-col gap-4"
                        >
                            {/* Step number + header */}
                            <div className="flex items-start gap-4">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-lg font-bold">
                                        {i + 1}
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-border" />
                                    )}
                                </div>
                                <div className="pt-1">
                                    <h3 className="text-lg font-bold">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                            {/* Mockup preview */}
                            <div className="bg-card border border-border/60 rounded-2xl overflow-hidden ml-16 shadow-sm">
                                {step.mockContent}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function DesktopDemo() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Map scroll to a 0-2 range for 3 steps (0, 1, 2)
    const progress = useTransform(scrollYProgress, [0, 1], [0, 2]);

    // Each phone screen fades in and out based on active step
    const step1Opacity = useTransform(progress, [0, 0.4, 0.8], [1, 1, 0]);
    const step2Opacity = useTransform(progress, [0.6, 1.0, 1.4], [0, 1, 0]);
    const step3Opacity = useTransform(progress, [1.2, 1.6, 2.0], [0, 1, 1]);

    return (
        <section ref={containerRef} className="relative bg-background" style={{ height: '200vh' }}>
            <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
                <div className="container relative grid grid-cols-2 gap-16 items-center px-8 max-w-6xl">
                    {/* Left: Phone mockup */}
                    <div className="flex items-center justify-end">
                        <div className="relative w-[300px] h-[600px] bg-foreground/90 rounded-[3rem] border-8 border-muted shadow-2xl overflow-hidden">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground/90 rounded-b-xl z-20" />
                            {/* Step screens */}
                            <motion.div style={{ opacity: step1Opacity }} className="absolute inset-0 pt-12 bg-background flex flex-col text-foreground">
                                {steps[0].mockContent}
                            </motion.div>
                            <motion.div style={{ opacity: step2Opacity }} className="absolute inset-0 pt-12 bg-background flex flex-col text-foreground">
                                {steps[1].mockContent}
                            </motion.div>
                            <motion.div style={{ opacity: step3Opacity }} className="absolute inset-0 pt-12 bg-background flex flex-col text-foreground">
                                {steps[2].mockContent}
                            </motion.div>
                            {/* Home indicator */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-muted-foreground/30 rounded-full" />
                        </div>
                    </div>

                    {/* Right: Steps list */}
                    <div className="flex flex-col gap-12 pl-4">
                        {steps.map((step, i) => (
                            <StepCard key={i} step={step} index={i} progress={progress} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function StepCard({ step, index, progress }: { step: typeof steps[0]; index: number; progress: any }) {
    // Active when progress is near this step's index
    const opacity = useTransform(progress, [index - 0.6, index - 0.1, index, index + 0.5, index + 1.0], [0.25, 0.6, 1, 0.6, 0.25]);
    const scale = useTransform(progress, [index - 0.5, index, index + 0.5], [0.95, 1, 0.95]);
    const y = useTransform(progress, [index - 0.5, index, index + 0.5], [8, 0, -8]);

    return (
        <motion.div style={{ opacity, scale, y }} className="flex gap-5 items-start">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg bg-primary text-primary-foreground text-xl font-bold">
                {index + 1}
            </div>
            <div className="flex flex-col gap-2 pt-2">
                <h3 className="text-2xl font-bold leading-tight">{step.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed max-w-sm">{step.description}</p>
            </div>
        </motion.div>
    );
}

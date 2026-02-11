import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, User, MessageSquare, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const steps = [
    {
        title: "Choose your niche",
        description: "Tell AI what you do. Beauty, Crypto, Coaching - we speak your language.",
        icon: <User className="w-5 h-5" />,
        color: "bg-blue-500",
        mockContent: (
            <div className="flex flex-col gap-2 p-4">
                <div className="text-sm font-bold opacity-50 mb-2">I am a...</div>
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 font-medium">Digital Creator</div>
                <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-transparent opacity-50">Fitness Coach</div>
                <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-transparent opacity-50">Crypto Expert</div>
            </div>
        )
    },
    {
        title: "AI builds everything",
        description: "Structure, copy, and design generated in seconds. No drag-and-drop hell.",
        icon: <Zap className="w-5 h-5" />,
        color: "bg-amber-500",
        mockContent: (
            <div className="flex flex-col gap-2 p-4">
                <div className="flex gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                    <div className="text-xs opacity-50">AI Generating...</div>
                </div>
                <div className="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                <div className="h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse w-2/3" />
                <div className="h-24 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            </div>
        )
    },
    {
        title: "Get leads in Telegram",
        description: "Your page is live. Leads come straight to your DM. Close them instantly.",
        icon: <MessageSquare className="w-5 h-5" />,
        color: "bg-emerald-500",
        mockContent: (
            <div className="flex flex-col gap-2 p-4">
                <div className="p-3 rounded-xl bg-blue-500 text-white rounded-br-none self-end max-w-[80%] text-sm">
                    Hey, I want to book a consultation!
                </div>
                <div className="p-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 rounded-bl-none self-start max-w-[80%] text-sm">
                    Awesome! Let's schedule it.
                </div>
                <div className="mt-4 flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-xs font-semibold text-emerald-500">New Lead Captured</div>
                </div>
            </div>
        )
    }
];

export const InteractiveDemo = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Spring physics for smoother transitions
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 20 });

    // Transform progress to step index (0, 1, 2)
    const activeStep = useTransform(smoothProgress, [0, 0.45, 0.9], [0, 1, 2]);
    const step1Opacity = useTransform(activeStep, [0, 0.5], [1, 0]);
    const step2Opacity = useTransform(activeStep, [0.5, 1, 1.5], [0, 1, 0]);
    const step3Opacity = useTransform(activeStep, [1.5, 2], [0, 1]);

    return (
        <section ref={containerRef} className="relative h-[300vh] bg-background">
            <div className="sticky top-0 h-screen flex flex-col items-center justify-center py-20 overflow-hidden">
                <div className="absolute inset-0 bg-liquid-mesh opacity-20 pointer-events-none" />

                <div className="container relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center h-full">

                    {/* Left Side: Mockup */}
                    <div className="flex items-center justify-center md:justify-end order-1 md:order-1">
                        <div className="relative w-[300px] h-[600px] bg-black rounded-[3rem] border-8 border-neutral-800 shadow-2xl overflow-hidden glass-card">
                            {/* Phone Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-20" />

                            {/* Step 1 Content */}
                            <motion.div style={{ opacity: step1Opacity }} className="absolute inset-0 pt-12 bg-background flex flex-col text-foreground">
                                {steps[0].mockContent}
                            </motion.div>

                            {/* Step 2 Content */}
                            <motion.div style={{ opacity: step2Opacity }} className="absolute inset-0 pt-12 bg-background flex flex-col text-foreground">
                                {steps[1].mockContent}
                            </motion.div>

                            {/* Step 3 Content */}
                            <motion.div style={{ opacity: step3Opacity }} className="absolute inset-0 pt-12 bg-background flex flex-col text-foreground">
                                {steps[2].mockContent}
                            </motion.div>

                            {/* Bottom Indicator */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-neutral-700/50 rounded-full" />
                        </div>
                    </div>

                    {/* Right Side: Text Steps */}
                    <div className="flex flex-col gap-16 md:pl-10 order-2 md:order-2">
                        {steps.map((step, i) => (
                            <StepCard
                                key={i}
                                step={step}
                                index={i}
                                currentStepProgress={activeStep}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

const StepCard = ({ step, index, currentStepProgress }: { step: any, index: number, currentStepProgress: any }) => {
    // Determine opacity based on active step
    // Roughly: if currentStepProgress is close to index, opacity 1, else 0.3
    const opacity = useTransform(currentStepProgress,
        [index - 0.5, index, index + 0.5],
        [0.3, 1, 0.3]
    );
    const scale = useTransform(currentStepProgress,
        [index - 0.5, index, index + 0.5],
        [0.9, 1, 0.9]
    );

    return (
        <motion.div style={{ opacity, scale }} className="flex gap-6 items-start">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg", step.color)}>
                <div className="text-white">{step.icon}</div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
                <h3 className="text-3xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">{step.description}</p>
            </div>
        </motion.div>
    );
}

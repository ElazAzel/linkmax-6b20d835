import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils/utils';
import Check from 'lucide-react/dist/esm/icons/check';
import User from 'lucide-react/dist/esm/icons/user';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Zap from 'lucide-react/dist/esm/icons/zap';
import { useIsMobile } from '@/hooks/ui/use-mobile';
import { useTranslation } from 'react-i18next';

export const InteractiveDemo = () => {
    const isMobile = useIsMobile();
    const { t } = useTranslation();

    const steps = [
        {
            title: t('landing.demo.step1Title', 'Choose your niche'),
            description: t('landing.demo.step1Desc', 'Tell AI what you do. Beauty, Crypto, Coaching - we speak your language.'),
            icon: <User className="w-5 h-5" />,
            mockContent: (
                <div className="flex flex-col gap-2 p-4 max-h-[260px] overflow-y-auto scrollbar-hide">
                    <div className="text-sm font-bold opacity-50 mb-2">{t('landing.demo.iAmA', 'I am a...')}</div>
                    <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-primary font-medium">{t('landing.demo.nicheCreator', 'Digital Creator')}</div>
                    <div className="p-3 rounded-lg bg-muted border border-transparent opacity-50">{t('landing.demo.nicheFitness', 'Fitness Coach')}</div>
                    <div className="p-3 rounded-lg bg-muted border border-transparent opacity-50">{t('landing.demo.nicheCrypto', 'Crypto Expert')}</div>
                    <div className="p-3 rounded-lg bg-muted border border-transparent opacity-50">{t('landing.demo.nicheBeauty', 'Beauty Blogger')}</div>
                    <div className="p-3 rounded-lg bg-muted border border-transparent opacity-50">{t('landing.demo.nicheMusic', 'Music Producer')}</div>
                    <div className="p-3 rounded-lg bg-muted border border-transparent opacity-50">{t('landing.demo.nicheTutor', 'Online Tutor')}</div>
                </div>
            )
        },
        {
            title: t('landing.demo.step2Title', 'AI builds everything'),
            description: t('landing.demo.step2Desc', 'Structure, copy, and design generated in seconds. No drag-and-drop hell.'),
            icon: <Zap className="w-5 h-5" />,
            mockContent: (
                <div className="flex flex-col gap-2 p-4">
                    <div className="flex gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <div className="text-xs opacity-50">{t('landing.demo.aiGenerating', 'AI Generating...')}</div>
                    </div>
                    <div className="h-20 rounded-lg bg-muted animate-pulse" />
                    <div className="h-8 rounded-lg bg-muted animate-pulse w-2/3" />
                    <div className="h-24 rounded-lg bg-muted animate-pulse" />
                </div>
            )
        },
        {
            title: t('landing.demo.step3Title', 'Get leads in Telegram'),
            description: t('landing.demo.step3Desc', 'Your page is live. Leads come straight to your DM. Close them instantly.'),
            icon: <MessageSquare className="w-5 h-5" />,
            mockContent: (
                <div className="flex flex-col gap-2 p-4">
                    <div className="p-3 rounded-xl bg-primary text-primary-foreground rounded-br-none self-end max-w-[80%] text-sm">
                        {t('landing.demo.chatMsg1', 'Hey, I want to book a consultation!')}
                    </div>
                    <div className="p-3 rounded-xl bg-muted rounded-bl-none self-start max-w-[80%] text-sm">
                        {t('landing.demo.chatMsg2', "Awesome! Let's schedule it.")}
                    </div>
                    <div className="mt-4 flex items-center gap-2 p-2 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <div className="text-xs font-semibold text-primary">{t('landing.demo.leadCaptured', 'New Lead Captured')}</div>
                    </div>
                </div>
            )
        }
    ];

    if (isMobile) {
        return <MobileDemo steps={steps} />;
    }
    return <DesktopDemo steps={steps} />;
};

function RevealOnScroll({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.2 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.4s ease ${delay}ms, transform 0.4s ease ${delay}ms` }}>
            {children}
        </div>
    );
}

function MobileDemo({ steps }: { steps: any[] }) {
    const { t } = useTranslation();
    return (
        <section className="py-16 bg-transparent">
            <div className="container px-4">
                <h2 className="text-2xl font-bold text-center mb-10">{t('landing.demo.title', 'How it works')}</h2>
                <div className="space-y-8">
                    {steps.map((step: any, i: number) => (
                        <RevealOnScroll key={i} delay={i * 100}>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 text-lg font-bold shadow-lg shadow-primary/20">
                                            {i + 1}
                                        </div>
                                        {i < steps.length - 1 && (
                                            <div className="absolute top-14 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-primary/30 to-transparent" />
                                        )}
                                    </div>
                                    <div className="pt-1">
                                        <h3 className="text-lg font-bold">{step.title}</h3>
                                        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                                    </div>
                                </div>
                                <div className="bg-card border border-border/60 rounded-2xl overflow-hidden ml-16 shadow-sm">
                                    {step.mockContent}
                                </div>
                            </div>
                        </RevealOnScroll>
                    ))}
                </div>
            </div>
        </section>
    );
}

function DesktopDemo({ steps }: { steps: any[] }) {
    const { t } = useTranslation();
    const [activeStep, setActiveStep] = useState(0);
    const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const observers: IntersectionObserver[] = [];
        stepRefs.current.forEach((ref, index) => {
            if (!ref) return;
            const observer = new IntersectionObserver(
                (entries) => { entries.forEach((entry) => { if (entry.isIntersecting) setActiveStep(index); }); },
                { threshold: 0.3, rootMargin: "-30% 0px -30% 0px" }
            );
            observer.observe(ref);
            observers.push(observer);
        });
        return () => observers.forEach((o) => o.disconnect());
    }, []);

    return (
        <section className="py-24 bg-transparent">
            <div className="container max-w-6xl px-8">
                <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">{t('landing.demo.title', 'How it works')}</h2>
                <div className="relative flex">
                    {/* Left: Sticky phone mockup */}
                    <div className="w-1/2 shrink-0">
                        <div className="sticky top-24 flex items-center justify-center py-8">
                            <div className="relative w-[300px] h-[580px] bg-foreground/90 rounded-[3rem] border-8 border-muted shadow-2xl overflow-hidden">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground/90 rounded-b-xl z-20" />
                                {steps.map((step: any, i: number) => (
                                    <div
                                        key={i}
                                        className="absolute inset-0 pt-12 bg-background flex flex-col text-foreground"
                                        style={{
                                            opacity: activeStep === i ? 1 : 0,
                                            transform: activeStep === i ? 'scale(1)' : 'scale(0.95)',
                                            transition: 'opacity 0.35s ease-out, transform 0.35s ease-out',
                                            pointerEvents: activeStep === i ? 'auto' : 'none',
                                            zIndex: activeStep === i ? 1 : 0,
                                        }}
                                    >
                                        {step.mockContent}
                                    </div>
                                ))}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-muted-foreground/30 rounded-full z-10" />
                            </div>
                        </div>
                    </div>

                    {/* Right: Steps */}
                    <div className="w-1/2 flex flex-col pl-10">
                        {steps.map((step: any, i: number) => (
                            <div
                                key={i}
                                ref={(el) => { stepRefs.current[i] = el; }}
                                className="min-h-[70vh] flex items-center"
                            >
                                <div className={cn(
                                    "flex gap-5 items-start transition-all duration-500",
                                    activeStep === i ? "opacity-100 scale-100" : "opacity-25 scale-95"
                                )}>
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-xl font-bold transition-colors duration-300",
                                        activeStep === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        {i + 1}
                                    </div>
                                    <div className="flex flex-col gap-2 pt-2">
                                        <h3 className="text-2xl font-bold leading-tight">{step.title}</h3>
                                        <p className="text-muted-foreground text-base leading-relaxed max-w-sm">{step.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
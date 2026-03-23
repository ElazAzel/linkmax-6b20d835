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
        <section className="py-16 bg-transparent border-none">
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

    return (
        <section className="py-20 md:py-28 bg-transparent border-none">
            <div className="container max-w-5xl px-6">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-14">{t('landing.demo.title', 'How it works')}</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
                    {steps.map((step: any, i: number) => (
                        <div
                            key={i}
                            className="group cursor-pointer"
                            onMouseEnter={() => setActiveStep(i)}
                        >
                            <RevealOnScroll delay={i * 120}>
                                {/* Phone mockup */}
                                <div className="relative mx-auto w-[220px] h-[400px] bg-foreground/90 rounded-[2rem] border-[6px] border-muted shadow-xl overflow-hidden mb-6 group-hover:shadow-2xl group-hover:scale-[1.03] transition-all duration-300">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-foreground/90 rounded-b-xl z-20" />
                                    <div className="absolute inset-0 pt-10 bg-background flex flex-col text-foreground">
                                        {step.mockContent}
                                    </div>
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-muted-foreground/30 rounded-full z-10" />
                                </div>

                                {/* Step info */}
                                <div className="text-center">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 text-base font-bold transition-colors duration-300 shadow",
                                        activeStep === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        {i + 1}
                                    </div>
                                    <h3 className="text-lg font-bold mb-1.5">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{step.description}</p>
                                </div>
                            </RevealOnScroll>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

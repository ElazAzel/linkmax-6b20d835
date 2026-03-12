import { useState, useRef, useEffect } from "react";
import Check from 'lucide-react/dist/esm/icons/check';
import { cn } from "@/lib/utils/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { MagneticButton } from "./MagneticButton";
import { SectionWrapper } from '@/components/shared/SectionWrapper';

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
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `all 0.5s ease ${delay}ms` }}>
            {children}
        </div>
    );
}

export const PricingAurora = ({ onPlanSelect }: { onPlanSelect: (plan: string) => void }) => {
    const { t, i18n } = useTranslation();
    const [isYearly, setIsYearly] = useState(true);
    const isKZ = i18n.language === 'ru' || i18n.language === 'kk';

    const prices = {
        free: isKZ ? '0 ₸' : '$0',
        pro: {
            monthly: isKZ ? '4 350 ₸' : '$8.90',
            yearly: isKZ ? '3 045 ₸' : '$5.90',
            totalYearly: isKZ ? '36 540 ₸' : '$70.80'
        },
        business: {
            monthly: isKZ ? '9 900 ₸' : '$19.90',
            yearly: isKZ ? '6 930 ₸' : '$13.90',
            totalYearly: isKZ ? '83 160 ₸' : '$166.80'
        }
    };

    const proFeatures = [
        t('landing.pricing.f1', 'All blocks without limits'),
        t('landing.pricing.f2', 'Online booking & mini-CRM'),
        t('landing.pricing.f3', 'Instant leads to Telegram'),
        t('landing.pricing.f4', 'Sell products & event tickets'),
        t('landing.pricing.f5', 'Built-in QR scanner'),
        t('landing.pricing.f6', 'Advanced analytics & reports'),
    ];

    const businessFeatures = [
        t('landing.pricing.b1', 'Everything in Pro, plus:'),
        t('landing.pricing.b2', 'Business Zones (workspaces)'),
        t('landing.pricing.b3', 'Team CRM & Kanban'),
        t('landing.pricing.b4', 'Team chat & tasks'),
        t('landing.pricing.b5', 'Roles & access control'),
        t('landing.pricing.b6', 'Up to 5 team members'),
    ];

    return (
        <SectionWrapper id="pricing" className="overflow-hidden z-10 bg-transparent">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[100px] pointer-events-none" />

            <div className="relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <Reveal>
                        <h2 className="text-section-title mb-6">
                            {t('landing.pricing.title', 'Simple Pricing,')}{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">{t('landing.pricing.titleHighlight', 'Exponential Growth')}</span>
                        </h2>
                    </Reveal>
                    <Reveal delay={100}>
                        <p className="text-muted-foreground text-lg mb-8">
                            {t('landing.pricing.subtitle', 'Start for free. Upgrade when you\'re ready to scale.')}
                        </p>
                    </Reveal>

                    <Reveal delay={150}>
                        <div className="flex items-center justify-center gap-4">
                            <Label htmlFor="billing-mode" className={cn("text-sm font-medium cursor-pointer", !isYearly && "text-primary")}>
                                {t('landing.pricing.monthly', 'Monthly')}
                            </Label>
                            <Switch id="billing-mode" checked={isYearly} onCheckedChange={setIsYearly} />
                            <Label htmlFor="billing-mode" className={cn("text-sm font-medium cursor-pointer", isYearly && "text-primary")}>
                                {t('landing.pricing.yearly', 'Yearly')}{' '}
                                <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary hover:bg-primary/20 text-xs uppercase">
                                    {t('landing.pricing.save', '-30%')}
                                </Badge>
                            </Label>
                        </div>
                    </Reveal>
                </div>

                <Reveal delay={200}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 max-w-6xl mx-auto px-4">
                        {/* PRO Card */}
                        <div className="glass border-primary/30 rounded-[2.5rem] sm:rounded-[3.5rem] p-1 relative transition-all duration-700 hover:-translate-y-3 hover:shadow-glass-lg group">
                            <div className="bg-white/5 backdrop-blur-[40px] rounded-[2.5rem] sm:rounded-[3.3rem] p-6 sm:p-10 md:p-12 h-full flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-secondary text-white text-[10px] font-black px-8 py-3 rounded-bl-[2rem] uppercase tracking-[0.2em] shadow-glass">
                                    {t('landing.pricing.popular', 'POPULAR')}
                                </div>
                                
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[80px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />

                                <div className="mb-10 relative">
                                    <h3 className="text-3xl font-black mb-4 flex items-center gap-3 tracking-tighter">
                                        {t('landing.pricing.proName', 'Pro')} 
                                        <Badge className="bg-primary/20 text-primary border-none font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest">
                                            {t('landing.pricing.aiPowered', 'AI Powered')}
                                        </Badge>
                                    </h3>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-4xl sm:text-5xl md:text-6xl font-black tabular-nums tracking-tighter drop-shadow-sm">
                                            {isYearly ? prices.pro.yearly : prices.pro.monthly}
                                        </span>
                                        <span className="text-muted-foreground/60 font-black uppercase tracking-widest text-xs">/ {t('landing.pricing.perMonth', 'mo')}</span>
                                    </div>
                                    {isYearly && (
                                        <div className="mt-4 px-4 py-1.5 bg-primary/10 rounded-full w-fit">
                                            <p className="text-[10px] text-primary font-black uppercase tracking-wider">
                                                {t('landing.pricing.billedYearly', 'Billed {{price}} yearly', { price: prices.pro.totalYearly })}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <ul className="space-y-6 mb-12 flex-1 relative">
                                    {proFeatures.map((f, i) => (
                                        <li key={i} className="flex items-center gap-4 text-sm font-bold text-foreground/80 group/feat">
                                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10 group-hover/feat:scale-110 transition-transform">
                                                <Check className="w-3.5 h-3.5 text-primary" />
                                            </div>
                                            <span className="group-hover:text-foreground transition-colors">{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                <MagneticButton className="w-full h-14 sm:h-16 md:h-20 rounded-2xl text-sm sm:text-base md:text-lg font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] bg-primary text-white shadow-glass-lg hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => onPlanSelect('pro')}>
                                    {t('landing.pricing.proCta', 'Start Pro Trial')}
                                </MagneticButton>
                            </div>
                        </div>

                        {/* BUSINESS Card */}
                        <div className="glass border-white/10 rounded-[2.5rem] sm:rounded-[3.5rem] p-1 relative transition-all duration-700 hover:-translate-y-3 hover:shadow-glass group">
                            <div className="bg-white/5 backdrop-blur-[30px] rounded-[2.3rem] sm:rounded-[3.3rem] p-6 sm:p-10 md:p-12 h-full flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-white/10 backdrop-blur-md text-foreground/50 text-[10px] font-black px-8 py-3 rounded-bl-[2rem] uppercase tracking-[0.2em]">
                                    {t('landing.pricing.newBadge', 'NEW')}
                                </div>

                                <div className="mb-10">
                                    <h3 className="text-3xl font-black mb-4 flex items-center gap-3 tracking-tighter">
                                        {t('landing.pricing.businessName', 'Business')} 
                                        <Badge variant="outline" className="text-foreground/40 border-white/10 font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest">
                                            {t('landing.pricing.teamLabel', 'Team')}
                                        </Badge>
                                    </h3>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-4xl sm:text-5xl md:text-6xl font-black tabular-nums tracking-tighter drop-shadow-sm">
                                            {isYearly ? prices.business.yearly : prices.business.monthly}
                                        </span>
                                        <span className="text-muted-foreground/60 font-black uppercase tracking-widest text-xs">/ {t('landing.pricing.perMonth', 'mo')}</span>
                                    </div>
                                    {isYearly && (
                                        <div className="mt-4 px-4 py-1.5 bg-white/5 rounded-full w-fit">
                                            <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-wider">
                                                {t('landing.pricing.billedYearly', 'Billed {{price}} yearly', { price: prices.business.totalYearly })}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <ul className="space-y-6 mb-12 flex-1">
                                    {businessFeatures.map((f, i) => (
                                        <li key={i} className="flex items-center gap-4 text-sm font-bold text-foreground/70 group/feat">
                                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/10 group-hover/feat:scale-110 transition-transform">
                                                <Check className="w-3.5 h-3.5 text-foreground/40" />
                                            </div>
                                            <span className="group-hover:text-foreground transition-colors">{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                <MagneticButton variant="outline" className="w-full h-14 sm:h-16 md:h-20 rounded-2xl text-sm sm:text-base md:text-lg font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] glass hover:bg-white/10 border-white/10 hover:shadow-glass hover:scale-[1.02] active:scale-[0.98] transition-all" onClick={() => onPlanSelect('business')}>
                                    {t('landing.pricing.businessCta', 'Start Business')}
                                </MagneticButton>
                            </div>
                        </div>
                    </div>
                </Reveal>

                {/* Free CTA */}
                <div className="text-center mt-12">
                    <Button
                        variant="ghost"
                        className="rounded-xl text-muted-foreground/60 hover:text-primary transition-colors text-sm h-auto py-2 font-black uppercase tracking-widest opacity-50 hover:opacity-100"
                        onClick={() => onPlanSelect('free')}
                    >
                        {t('landing.pricing.freeCta', 'Start for free')}
                    </Button>
                </div>
            </div>
        </SectionWrapper>
    );
};
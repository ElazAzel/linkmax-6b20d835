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
import { Slider } from "@/components/ui/slider";

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

function ProfitCalculator() {
    const { t } = useTranslation();
    const [leads, setLeads] = useState(100);
    const [conversion, setConversion] = useState(10);
    const [avgCheck, setAvgCheck] = useState(50);

    const revenue = leads * (conversion / 100) * avgCheck;
    // Base $5.90 + 1% processing fee
    const linkmaxCost = 5.9 + (revenue * 0.01);
    // Competitors usually charge ~8% or high flat monthly fee
    const competitorCost = revenue * 0.08; 
    const savings = competitorCost - linkmaxCost;

    return (
        <div className="glass border-primary/20 rounded-[2rem] p-6 sm:p-8 max-w-3xl mx-auto mb-16 relative overflow-hidden group shadow-glass-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />
            
                <h3 className="text-xl sm:text-2xl font-black mb-8 text-center flex items-center justify-center gap-3">
                {t('landing.pricing.calculator.title', 'Калькулятор выгоды')}
                <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-none uppercase tracking-widest text-xs hover:bg-green-500/30">ROI</Badge>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8 relative z-10 w-full px-2">
                <div className="space-y-4">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('landing.pricing.calculator.leads', 'Заявки в месяц')}</Label>
                    <div className="flex items-center gap-4">
                        <Slider value={[leads]} max={5000} step={10} onValueChange={(v) => setLeads(v[0])} className="flex-1 cursor-grab active:cursor-grabbing" />
                        <span className="w-10 text-right font-black text-sm tabular-nums">{leads}</span>
                    </div>
                </div>
                <div className="space-y-4">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('landing.pricing.calculator.conversion', 'Конверсия (%)')}</Label>
                    <div className="flex items-center gap-4">
                        <Slider value={[conversion]} max={100} step={1} onValueChange={(v) => setConversion(v[0])} className="flex-1 cursor-grab active:cursor-grabbing" />
                        <span className="w-10 text-right font-black text-sm tabular-nums">{conversion}%</span>
                    </div>
                </div>
                <div className="space-y-4">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">{t('landing.pricing.calculator.avgCheck', 'Средний чек ($)')}</Label>
                    <div className="flex items-center gap-4">
                        <Slider value={[avgCheck]} max={500} step={5} onValueChange={(v) => setAvgCheck(v[0])} className="flex-1 cursor-grab active:cursor-grabbing" />
                        <span className="w-10 text-right font-black text-sm tabular-nums">${avgCheck}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 mt-4 border-t border-border/10 relative z-10">
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-background/40">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">{t('landing.pricing.calculator.revenue', 'Ваш доход:')}</span>
                    <span className="text-2xl font-black tabular-nums tracking-tighter">${Math.round(revenue).toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-background/40 opacity-70">
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">{t('landing.pricing.calculator.competitorCost', 'Конкуренты (8%):')}</span>
                    <span className="text-xl font-black tabular-nums tracking-tighter line-through decoration-red-500/50 decoration-2">${Math.round(competitorCost).toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-primary/10 rounded-2xl p-4 border border-primary/20 shadow-inner group-hover:bg-primary/15 transition-colors">
                    <span className="text-xs text-primary font-black uppercase tracking-widest mb-1">{t('landing.pricing.calculator.savings', 'Ваша экономия:')}</span>
                    <span className="text-3xl font-black tabular-nums tracking-tighter text-primary drop-shadow-sm">
                        +${Math.max(0, Math.round(savings)).toLocaleString()}
                    </span>
                    <span className="text-xs text-primary/60 font-bold uppercase mt-1">/ {t('landing.pricing.perMonth', 'mo')}</span>
                </div>
            </div>
        </div>
    );
}

export const PricingAurora = ({ onPlanSelect }: { onPlanSelect: (plan: string) => void }) => {
    const { t, i18n } = useTranslation();
    const [isYearly, setIsYearly] = useState(true);
    const isKZ = i18n.language === 'ru' || i18n.language === 'kk';

    const prices = {
        starter: isKZ ? '0 ₸' : '$0',
        pro: {
            monthly: isKZ ? '4 350 ₸' : '$8.90',
            yearly: isKZ ? '3 045 ₸' : '$5.90',
            totalYearly: isKZ ? '36 540 ₸' : '$70.80'
        },
    };

    const proFeatures = [
        t('landing.pricing.f1', 'Все блоки без ограничений'),
        t('landing.pricing.f2', 'Онлайн-запись и мини-CRM'),
        t('landing.pricing.f3', 'Заявки сразу в Telegram'),
        t('landing.pricing.f4', 'Продажа товаров и билетов'),
        t('landing.pricing.f5', 'Встроенный QR-сканер'),
        t('landing.pricing.f6', 'Расширенная аналитика'),
        t('landing.pricing.f7_new', 'Свой домен и без брендинга'),
        t('landing.pricing.f8_new', 'До 6 страниц на аккаунт'),
    ];

    return (
        <SectionWrapper id="pricing" className="overflow-hidden z-10 bg-transparent">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-primary/8 blur-[100px] pointer-events-none" />

            <div className="relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <Reveal>
                         <h2 className="text-section-title mb-6">
                            {t('landing.pricing.title', 'Простые цены,')}{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">{t('landing.pricing.titleHighlight', 'максимум возможностей')}</span>
                        </h2>
                    </Reveal>
                    <Reveal delay={100}>
                        <p className="text-muted-foreground text-lg mb-8">
                            {t('landing.pricing.subtitle', 'Начните бесплатно. Перейдите на Pro, когда будете готовы масштабироваться.')}
                        </p>
                    </Reveal>

                    <Reveal delay={150}>
                        <div className="flex items-center justify-center gap-4">
                            <Label htmlFor="billing-mode" className={cn("text-sm font-medium cursor-pointer", !isYearly && "text-primary")}>
                                {t('landing.pricing.monthly', 'Ежемесячно')}
                            </Label>
                            <Switch id="billing-mode" checked={isYearly} onCheckedChange={setIsYearly} />
                            <Label htmlFor="billing-mode" className={cn("text-sm font-medium cursor-pointer", isYearly && "text-primary")}>
                                {t('landing.pricing.yearly', 'Годовой')}{' '}
                                <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary hover:bg-primary/20 text-xs uppercase">
                                    {t('landing.pricing.save', '-30%')}
                                </Badge>
                            </Label>
                        </div>
                    </Reveal>
                </div>

                <Reveal delay={175}>
                    <ProfitCalculator />
                </Reveal>

                <Reveal delay={200}>
                    <div className="max-w-xl mx-auto px-4">
                        {/* PRO Card */}
                        <div className="glass border-primary/30 rounded-[2.5rem] sm:rounded-[3.5rem] p-1 relative transition-all duration-700 hover:-translate-y-3 hover:shadow-glass-lg group">
                            <div className="bg-white/5 backdrop-blur-[40px] rounded-[2.5rem] sm:rounded-[3.3rem] p-6 sm:p-10 md:p-12 h-full flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-secondary text-white text-xs font-black px-8 py-3 rounded-bl-[2rem] uppercase tracking-[0.2em] shadow-glass">
                                    {t('landing.pricing.popular', 'ХИТ')}
                                </div>
                                
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[80px] rounded-full opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />

                                <div className="mb-10 relative">
                                    <h3 className="text-3xl font-black mb-4 flex items-center gap-3 tracking-tighter">
                                        {t('landing.pricing.proName', 'Pro')} 
                                        <Badge className="bg-primary/20 text-primary border-none font-black text-xs px-3 py-1 rounded-full uppercase tracking-widest">
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
                                            <p className="text-xs text-primary font-black uppercase tracking-wider">
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
                                    {t('landing.pricing.proCta', 'Попробовать Pro бесплатно')}
                                </MagneticButton>
                            </div>
                        </div>
                    </div>
                </Reveal>

                {/* Starter Tier Info */}
                <div className="text-center mt-16 max-w-xl mx-auto">
                    <Reveal delay={300}>
                        <div className="glass border-primary/10 rounded-2xl p-6 mb-6">
                            <h4 className="text-lg font-black mb-2 flex items-center justify-center gap-2">
                                <span className="text-primary">Starter</span> {t('landing.pricing.successFirst', 'Плати только за результат')}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-4">
                                {t('landing.pricing.starterDesc', 'Начните за 0₸/мес. Мы берём 7% комиссию только когда вы реально зарабатываете. Без скрытых платежей.')}
                            </p>
                            <Button
                                variant="outline"
                                className="rounded-xl border-primary/20 hover:bg-primary/5 text-primary text-xs font-black uppercase tracking-widest px-8"
                                onClick={() => onPlanSelect('starter')}
                            >
                                {t('landing.pricing.starterCta', 'Начать бесплатно')}
                            </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em]">
                            {t('landing.pricing.transactionFeeNote_v2', '* Комиссия за транзакции: Starter (7%), Pro (1%)')}
                        </p>
                    </Reveal>
                </div>
            </div>
        </SectionWrapper>
    );
};

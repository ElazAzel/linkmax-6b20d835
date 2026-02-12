import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { MagneticButton } from "./MagneticButton";


export const PricingAurora = ({ onPlanSelect }: { onPlanSelect: (plan: string) => void }) => {
    const { t, i18n } = useTranslation();
    const [isYearly, setIsYearly] = useState(true);
    const isKZ = i18n.language === 'ru' || i18n.language === 'kk';

    const prices = {
        free: isKZ ? '0 ₸' : '$0',
        pro: {
            monthly: isKZ ? '4 350 ₸' : '$8',
            yearly: isKZ ? '3 045 ₸' : '$5',
            totalYearly: isKZ ? '36 540 ₸' : '$60'
        }
    };

    return (
        <section className="py-24 relative overflow-hidden z-10 bg-background">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />

            <div className="container px-4 mx-auto relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        {t('landing.v2.pricing.title', 'Simple Pricing,')}{' '}
                        <span className="text-primary">{t('landing.v2.pricing.titleHighlight', 'Exponential Growth')}</span>
                    </h2>
                    <p className="text-muted-foreground text-lg mb-8">
                        {t('landing.v2.pricing.subtitle', 'Start for free. Upgrade when you\'re ready to scale.')}
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <Label htmlFor="billing-mode" className={cn("text-sm font-medium cursor-pointer", !isYearly && "text-primary")}>
                            {t('landing.v2.pricing.monthly', 'Monthly')}
                        </Label>
                        <Switch id="billing-mode" checked={isYearly} onCheckedChange={setIsYearly} />
                        <Label htmlFor="billing-mode" className={cn("text-sm font-medium cursor-pointer", isYearly && "text-primary")}>
                            {t('landing.v2.pricing.yearly', 'Yearly')}{' '}
                            <Badge variant="secondary" className="ml-1 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] uppercase">
                                {t('landing.v2.pricing.save', '-30%')}
                            </Badge>
                        </Label>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-card border border-border/60 rounded-2xl p-8 flex flex-col relative"
                    >
                        <div className="mb-6">
                            <h3 className="text-xl font-bold mb-2">{t('landing.v2.pricing.free.name', 'Starter')}</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black">{prices.free}</span>
                                <span className="text-muted-foreground">/ {t('landing.v2.pricing.forever', 'forever')}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                                {t('landing.v2.pricing.free.desc', 'Perfect for trying out the platform.')}
                            </p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>{t('landing.v2.pricing.free.f1', 'Basic Blocks')}</span></li>
                            <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>{t('landing.v2.pricing.free.f2', '1 AI Generation/mo')}</span></li>
                            <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>{t('landing.v2.pricing.free.f3', 'Basic Analytics')}</span></li>
                            <li className="flex items-center gap-3 text-sm text-muted-foreground"><X className="w-5 h-5 text-muted-foreground/50 shrink-0" /> <span>{t('landing.v2.pricing.free.f4', 'No Custom Domain')}</span></li>
                        </ul>

                        <Button variant="outline" className="w-full rounded-xl" onClick={() => onPlanSelect('free')}>
                            {t('landing.v2.pricing.free.cta', 'Get Started Free')}
                        </Button>
                    </motion.div>

                    {/* Pro Plan */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="bg-card border-2 border-primary/30 rounded-2xl p-1 relative"
                    >
                        <div className="bg-card rounded-xl p-7 h-full flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-bl-xl">
                                {t('landing.v2.pricing.popular', 'POPULAR')}
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    Pro <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">AI Powered</span>
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <AnimatePresence mode="wait">
                                        <motion.span
                                            key={isYearly ? 'year' : 'month'}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="text-4xl font-black"
                                        >
                                            {isYearly ? prices.pro.yearly : prices.pro.monthly}
                                        </motion.span>
                                    </AnimatePresence>
                                    <span className="text-muted-foreground">/ {t('landing.v2.pricing.perMonth', 'month')}</span>
                                </div>
                                {isYearly && (
                                    <p className="text-xs text-primary mt-1 font-medium">
                                        {t('landing.v2.pricing.billedYearly', 'Billed {{price}} yearly', { price: prices.pro.totalYearly })}
                                    </p>
                                )}
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-5 h-5 text-primary shrink-0" /> <span>{t('landing.v2.pricing.pro.f1', 'Everything in Free')}</span></li>
                                <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>{t('landing.v2.pricing.pro.f2', '5 AI Generations/mo')}</span></li>
                                <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>{t('landing.v2.pricing.pro.f3', 'Telegram Leads')}</span></li>
                                <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>{t('landing.v2.pricing.pro.f4', 'Advanced Analytics')}</span></li>
                                <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>{t('landing.v2.pricing.pro.f5', 'Remove Branding')}</span></li>
                            </ul>

                            <MagneticButton className="w-full rounded-xl" onClick={() => onPlanSelect('pro')}>
                                {t('landing.v2.pricing.pro.cta', 'Start Pro Trial')}
                            </MagneticButton>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

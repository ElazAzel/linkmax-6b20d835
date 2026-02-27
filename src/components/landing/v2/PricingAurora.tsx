import { useState } from "react";
import Check from 'lucide-react/dist/esm/icons/check';
import { cn } from "@/lib/utils/utils";
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

    const features = [
        t('landing.v2.pricing.pro.f1_new', 'Все блоки без ограничений'),
        t('landing.v2.pricing.pro.f2_new', 'Онлайн-запись и своя мини-CRM'),
        t('landing.v2.pricing.pro.f3_new', 'Мгновенные заявки в Telegram'),
        t('landing.v2.pricing.pro.f4_new', 'Продажа товаров и билетов'),
        t('landing.v2.pricing.pro.f5_new', 'Встроенный QR-сканер'),
        t('landing.v2.pricing.pro.f6_new', 'Продвинутая статистика'),
    ];

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

                <div className="max-w-md mx-auto">
                    <div className="bg-card border-2 border-primary/30 rounded-2xl p-1 relative transition-transform duration-200 hover:-translate-y-1">
                        <div className="bg-card rounded-xl p-7 h-full flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-bl-xl">
                                {t('landing.v2.pricing.popular', 'POPULAR')}
                            </div>

                            <div className="mb-6">
                                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                    {t('landing.v2.pricing.pro.name', 'Pro')} <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t('landing.v2.pricing.aiPowered', 'AI Powered')}</span>
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span
                                        key={isYearly ? 'year' : 'month'}
                                        className="text-4xl font-black transition-opacity duration-200"
                                    >
                                        {isYearly ? prices.pro.yearly : prices.pro.monthly}
                                    </span>
                                    <span className="text-muted-foreground">/ {t('landing.v2.pricing.perMonth', 'month')}</span>
                                </div>
                                {isYearly && (
                                    <p className="text-xs text-primary mt-1 font-medium">
                                        {t('landing.v2.pricing.billedYearly', 'Billed {{price}} yearly', { price: prices.pro.totalYearly })}
                                    </p>
                                )}
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {features.map((f, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm">
                                        <Check className="w-5 h-5 text-primary shrink-0" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <MagneticButton className="w-full rounded-xl mb-3" onClick={() => onPlanSelect('pro')}>
                                {t('landing.v2.pricing.pro.cta', 'Start Pro Trial')}
                            </MagneticButton>

                            <Button
                                variant="ghost"
                                className="w-full rounded-xl text-muted-foreground hover:text-primary transition-colors text-sm h-auto py-2"
                                onClick={() => onPlanSelect('free')}
                            >
                                {t('landing.v2.pricing.free.cta', 'Начать бесплатно')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

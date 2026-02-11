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
            monthly: isKZ ? '3 045 ₸' : '$6',
            yearly: isKZ ? '2 500 ₸' : '$5', // Discounted monthly price
            totalYearly: isKZ ? '30 000 ₸' : '$60'
        }
    };

    return (
        <section className="py-24 relative overflow-hidden">
            {/* Aurora Background for Pricing */}
            <div className="absolute inset-0 bg-aurora opacity-30 pointer-events-none" />

            <div className="container px-4 mx-auto relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple Pricing, <span className="text-spotlight">Exponential Growth</span></h2>
                    <p className="text-muted-foreground text-lg mb-8">Start for free. Upgrade when you're ready to scale.</p>

                    <div className="flex items-center justify-center gap-4">
                        <Label htmlFor="billing-mode" className={cn("text-sm font-medium cursor-pointer", !isYearly && "text-primary")}>Monthly</Label>
                        <Switch id="billing-mode" checked={isYearly} onCheckedChange={setIsYearly} />
                        <Label htmlFor="billing-mode" className={cn("text-sm font-medium cursor-pointer", isYearly && "text-primary")}>
                            Yearly <Badge variant="secondary" className="ml-1 bg-green-500/10 text-green-500 hover:bg-green-500/20 text-[10px] uppercase">Save 20%</Badge>
                        </Label>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-card p-8 flex flex-col relative"
                    >
                        <div className="mb-6">
                            <h3 className="text-xl font-bold mb-2">Starter</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black">{prices.free}</span>
                                <span className="text-muted-foreground">/ forever</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">Perfect for trying out the platform.</p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> <span>Basic Blocks</span></li>
                            <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> <span>1 AI Generation/mo</span></li>
                            <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-green-500 shrink-0" /> <span>Basic Analytics</span></li>
                            <li className="flex items-center gap-3 text-sm text-muted-foreground"><X className="w-5 h-5 text-neutral-500 shrink-0" /> <span>No Custom Domain</span></li>
                        </ul>

                        <Button variant="outline" className="w-full rounded-xl" onClick={() => onPlanSelect('free')}>
                            Get Started Free
                        </Button>
                    </motion.div>

                    {/* Pro Plan */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass-card p-1 rounded-3xl relative"
                    >
                        {/* Gradient Border Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-purple-500 to-pink-500 rounded-3xl opacity-20 blur-xl transition-opacity group-hover:opacity-40" />

                        <div className="bg-background/80 backdrop-blur-xl rounded-[1.4rem] p-7 h-full flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-gradient-to-bl from-primary to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">POPULAR</div>

                            <div className="mb-6">
                                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">Pro <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">AI Powered</span></h3>
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
                                    <span className="text-muted-foreground">/ month</span>
                                </div>
                                {isYearly && <p className="text-xs text-green-500 mt-1 font-medium">Billed {prices.pro.totalYearly} yearly</p>}
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                <li className="flex items-center gap-3 text-sm font-medium"><Check className="w-5 h-5 text-primary shrink-0" /> <span>Everything in Free</span></li>
                                <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>Unlimited AI Generations</span></li>
                                <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>Telegram Leads Integration</span></li>
                                <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>Advanced Analytics</span></li>
                                <li className="flex items-center gap-3 text-sm"><Check className="w-5 h-5 text-primary shrink-0" /> <span>Remove "Branding"</span></li>
                            </ul>

                            <MagneticButton className="w-full rounded-xl" onClick={() => onPlanSelect('pro')}>
                                Start Pro Trial
                            </MagneticButton>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

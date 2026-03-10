import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Loader2 } from 'lucide-react';
import { ZONE_PLANS, Zone } from '@/types/zones';
import { PaymentService } from '@/services/payment-service';
import { toast } from 'sonner';
import { useAppError } from '@/hooks/useAppError';

interface ZonePlanSelectorProps {
    zone: Zone;
    onRefetch?: () => void;
}

export function ZonePlanSelector({ zone, onRefetch }: ZonePlanSelectorProps) {
    const { t } = useTranslation();
    const { handleError } = useAppError();
    const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState<string | null>(null);

    const handleUpgrade = async (planCode: string) => {
        setLoading(planCode);
        try {
            const session = await PaymentService.createOrder({
                zoneId: zone.id,
                planCode,
                cycle,
                description: `Upgrade zone ${zone.name} to ${planCode} (${cycle})`,
            });

            // Redirect to RoboKassa
            if (session.paymentUrl) {
                window.location.href = session.paymentUrl;
            }

            onRefetch?.();
        } catch (err: any) {
            handleError(err, 'Payment initialization failed');
        } finally {
            setLoading(null);
        }
    };

    const getPrice = (plan: typeof ZONE_PLANS[0]) => {
        return cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
    };

    const isCurrentPlan = (planCode: string) => {
        return zone.plan_code.startsWith(planCode);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col items-center gap-4">
                <Tabs value={cycle} onValueChange={(val) => setCycle(val as any)} className="w-[300px]">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="monthly">{t('zones.plans.monthly', 'Monthly')}</TabsTrigger>
                        <TabsTrigger value="yearly">
                            {t('zones.plans.yearly', 'Yearly')}
                            <Badge variant="secondary" className="ml-2 scale-75 bg-green-500/20 text-green-500 border-none">
                                -20%
                            </Badge>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ZONE_PLANS.map((plan) => {
                    const isActive = isCurrentPlan(plan.code);
                    const price = getPrice(plan);

                    return (
                        <Card
                            key={plan.code}
                            className={`relative overflow-hidden transition-all hover:border-primary/50 glass-card ${isActive ? 'border-primary shadow-lg scale-[1.02]' : 'border-white/10'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider">
                                    Current
                                </div>
                            )}

                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl flex items-center justify-between">
                                    {plan.code.replace('business_', 'Business ')}
                                    {plan.memberLimit === 999999 ? (
                                        <span className="text-sm font-normal text-muted-foreground italic">Unlimited</span>
                                    ) : (
                                        <span className="text-sm font-normal text-muted-foreground">{plan.memberLimit} members</span>
                                    )}
                                </CardTitle>
                                <CardDescription>
                                    Full feature suite for growing teams and agencies.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pb-4">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold tracking-tight">{price.toLocaleString()}</span>
                                    <span className="text-muted-foreground">KZT</span>
                                    <span className="text-sm text-muted-foreground ml-1">
                                        /{cycle === 'monthly' ? 'mo' : 'yr'}
                                    </span>
                                </div>

                                <ul className="mt-6 space-y-3 text-sm">
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>All Business Features</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>CRM & Pipeline Management</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-500" />
                                        <span>Shared Team Inbox</span>
                                    </li>
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant={isActive ? "outline" : "default"}
                                    disabled={isActive || !!loading}
                                    onClick={() => handleUpgrade(plan.code)}
                                >
                                    {loading === plan.code ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : isActive ? (
                                        'Current Plan'
                                    ) : (
                                        'Upgrade Now'
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

const PRO_BASE_KZT = 2900;
const STARTER_FEE = 0.05;
const PRO_FEE = 0.01;
const COMPETITOR_BASE_KZT = 12000; // amoCRM/Bitrix per user

function formatKzt(value: number) {
    return Math.round(value).toLocaleString('ru-RU') + ' в‚ё';
}

export const RevenueCalculator = () => {
    const { t } = useTranslation();
    const [revenue, setRevenue] = useState(150_000); // в‚ё/РјРµСЃ

    const { starterCost, proCost, competitorCost, recommended, savingsVsCompetitor } = useMemo(() => {
        const starter = revenue * STARTER_FEE;
        const pro = PRO_BASE_KZT + revenue * PRO_FEE;
        const competitor = COMPETITOR_BASE_KZT + revenue * 0.03; // РїРѕРґРїРёСЃРєР° + СЌРєРІР°Р№СЂРёРЅРі
        return {
            starterCost: starter,
            proCost: pro,
            competitorCost: competitor,
            recommended: pro < starter ? 'pro' : 'starter',
            savingsVsCompetitor: Math.max(0, competitor - Math.min(starter, pro)),
        };
    }, [revenue]);

    const breakEven = Math.round(PRO_BASE_KZT / (STARTER_FEE - PRO_FEE)); // в‰€ 72500

    return (
        <SectionWrapper id="calculator" className="bg-transparent overflow-hidden">
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

            <SectionHeading
                title={t('landing.calc.title', 'РЎС‡РёС‚Р°Р№С‚Рµ РІС‹РіРѕРґСѓ РґРѕ С‚РѕРіРѕ, РєР°Рє Р·Р°РїР»Р°С‚РёС‚Рµ')}
                subtitle={t('landing.calc.subtitle', 'РџРµСЂРµРґРІРёРЅСЊС‚Рµ СЃР»Р°Р№РґРµСЂ Рё СЃСЂР°РІРЅРёС‚Рµ Starter, Pro Рё СЃСЂРµРґРЅСЋСЋ CRM РЅР° СЂС‹РЅРєРµ. РќРёРєР°РєРёС… СЃРєСЂС‹С‚С‹С… СЃР±РѕСЂРѕРІ.')}
                className="mb-12"
            />

            <div className="max-w-4xl mx-auto glass border-primary/20 rounded-[2rem] p-6 sm:p-10 relative shadow-glass-lg">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[60px] rounded-full pointer-events-none" />

                <div className="space-y-3 mb-8 relative">
                    <div className="flex items-center justify-between gap-4">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {t('landing.calc.revenueLabel', 'РћР±РѕСЂРѕС‚ С‡РµСЂРµР· LinkMAX РІ РјРµСЃСЏС†')}
                        </Label>
                        <span className="text-2xl sm:text-3xl font-black tabular-nums tracking-tight text-foreground">
                            {formatKzt(revenue)}
                        </span>
                    </div>
                    <Slider
                        value={[revenue]}
                        min={0}
                        max={2_000_000}
                        step={10_000}
                        onValueChange={(v) => setRevenue(v[0])}
                        className="cursor-grab active:cursor-grabbing"
                    />
                    <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                        <span>0 в‚ё</span>
                        <span>500Рє</span>
                        <span>1Рњ</span>
                        <span>2Рњ в‚ё</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 relative">
                    <PlanResultCard
                        name="Starter"
                        cost={starterCost}
                        sub={t('landing.calc.starterSub', '0 в‚ё + 5% СЃ РїСЂРѕРґР°Р¶')}
                        active={recommended === 'starter'}
                        recommendLabel={t('landing.calc.recommended', 'Р РµРєРѕРјРµРЅРґСѓРµРј')}
                    />
                    <PlanResultCard
                        name="Pro"
                        cost={proCost}
                        sub={t('landing.calc.proSub', '2 900 в‚ё + 1% СЃ РїСЂРѕРґР°Р¶')}
                        active={recommended === 'pro'}
                        recommendLabel={t('landing.calc.recommended', 'Р РµРєРѕРјРµРЅРґСѓРµРј')}
                    />
                    <PlanResultCard
                        name={t('landing.calc.competitor', 'amoCRM / Bitrix')}
                        cost={competitorCost}
                        sub={t('landing.calc.competitorSub', '12 000 в‚ё + СЌРєРІР°Р№СЂРёРЅРі 3%')}
                        muted
                    />
                </div>

                <div className="mt-6 pt-6 border-t border-border/30 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm relative">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {t('landing.calc.savings', 'Р­РєРѕРЅРѕРјРёСЏ vs amoCRM/Bitrix')}
                            </div>
                            <div className="text-lg font-black tabular-nums text-emerald-500">
                                {formatKzt(savingsVsCompetitor)} {t('landing.calc.perMonth', '/ РјРµСЃ')}
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed">
                        {t('landing.calc.breakEvenNote', 'РўРѕС‡РєР° РїРµСЂРµС…РѕРґР° Starter в†’ Pro: РїСЂРёРјРµСЂРЅРѕ')}{' '}
                        <strong className="text-foreground tabular-nums">{formatKzt(breakEven)}</strong>{' '}
                        {t('landing.calc.breakEvenSuffix', 'РѕР±РѕСЂРѕС‚Р° РІ РјРµСЃСЏС†. Р’С‹С€Рµ вЂ” Pro РІС‹РіРѕРґРЅРµРµ, РЅРёР¶Рµ вЂ” РѕСЃС‚Р°РІР°Р№С‚РµСЃСЊ РЅР° Starter.')}
                    </div>
                </div>
            </div>
        </SectionWrapper>
    );
};

function PlanResultCard({
    name,
    cost,
    sub,
    active,
    muted,
    recommendLabel,
}: {
    name: string;
    cost: number;
    sub: string;
    active?: boolean;
    muted?: boolean;
    recommendLabel?: string;
}) {
    return (
        <div
            className={cn(
                'rounded-2xl p-4 sm:p-5 border transition-all relative overflow-hidden',
                active && 'border-primary/40 bg-primary/5 shadow-lg shadow-primary/10',
                !active && !muted && 'border-border/40 bg-background/40',
                muted && 'border-border/30 bg-muted/20 opacity-70'
            )}
        >
            {active && recommendLabel && (
                <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-[9px] uppercase tracking-widest font-black">
                    {recommendLabel}
                </Badge>
            )}
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{name}</div>
            <div
                className={cn(
                    'text-2xl sm:text-3xl font-black tabular-nums tracking-tight',
                    active && 'text-primary',
                    muted && 'line-through decoration-red-500/40 decoration-2'
                )}
            >
                {formatKzt(cost)}
            </div>
            <div className="text-[11px] font-medium text-muted-foreground mt-1">{sub}</div>
        </div>
    );
}


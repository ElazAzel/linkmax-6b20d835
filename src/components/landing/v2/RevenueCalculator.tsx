import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { SectionHeading } from '@/components/shared/SectionHeading';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import { cn } from '@/lib/utils/utils';

const PRO_BASE_KZT = 2900;
const STARTER_FEE = 0.05;
const PRO_FEE = 0.01;
const COMPETITOR_BASE_KZT = 12000;

function formatKzt(value: number) {
  return `${Math.round(value).toLocaleString('ru-RU')} ₸`;
}

export const RevenueCalculator = () => {
  const { t } = useTranslation();
  const [revenue, setRevenue] = useState(150_000);

  const { starterCost, proCost, competitorCost, recommended, savingsVsCompetitor } = useMemo(() => {
    const starter = revenue * STARTER_FEE;
    const pro = PRO_BASE_KZT + revenue * PRO_FEE;
    const competitor = COMPETITOR_BASE_KZT + revenue * 0.03;

    return {
      starterCost: starter,
      proCost: pro,
      competitorCost: competitor,
      recommended: pro < starter ? 'pro' : 'starter',
      savingsVsCompetitor: Math.max(0, competitor - Math.min(starter, pro)),
    };
  }, [revenue]);

  const breakEven = Math.round(PRO_BASE_KZT / (STARTER_FEE - PRO_FEE));

  return (
    <SectionWrapper id="calculator" className="bg-white py-20 md:py-24">
      <SectionHeading
        title={t('landing.calc.title', 'Считайте выгоду до того, как заплатите')}
        subtitle={t(
          'landing.calc.subtitle',
          'Передвиньте слайдер и сравните Starter, Pro и среднюю CRM на рынке. Никаких скрытых сборов.'
        )}
        className="mb-12"
        titleClassName="text-[#172033]"
      />

      <div className="mx-auto max-w-[980px] rounded-[18px] border border-[#d8dee8] bg-[#f6f7f9] p-4 shadow-[0_16px_40px_rgba(23,32,51,0.10)] sm:p-6">
        <div className="rounded-[14px] border border-[#edf1f6] bg-white p-5 sm:p-8">
          <div className="mb-8 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Label className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7689]">
                {t('landing.calc.revenueLabel', 'Оборот через LinkMAX в месяц')}
              </Label>
              <span className="text-3xl font-semibold tracking-tight text-[#172033] sm:text-[42px] sm:leading-none">
                {formatKzt(revenue)}
              </span>
            </div>
            <Slider
              value={[revenue]}
              min={0}
              max={2_000_000}
              step={10_000}
              onValueChange={(value) => setRevenue(value[0] ?? 0)}
              className="cursor-grab active:cursor-grabbing"
            />
            <div className="flex justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9aa4b2]">
              <span>0 ₸</span>
              <span>500k</span>
              <span>1M</span>
              <span>2M ₸</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <PlanResultCard
              name="Starter"
              cost={starterCost}
              sub={t('landing.calc.starterSub', '0 ₸ + 5% с продаж')}
              active={recommended === 'starter'}
              recommendLabel={t('landing.calc.recommended', 'Рекомендуем')}
            />
            <PlanResultCard
              name="Pro"
              cost={proCost}
              sub={t('landing.calc.proSub', '2 900 ₸ + 1% с продаж')}
              active={recommended === 'pro'}
              recommendLabel={t('landing.calc.recommended', 'Рекомендуем')}
            />
            <PlanResultCard
              name={t('landing.calc.competitor', 'amoCRM / Bitrix')}
              cost={competitorCost}
              sub={t('landing.calc.competitorSub', '12 000 ₸ + эквайринг 3%')}
              muted
            />
          </div>

          <div className="mt-6 grid gap-4 border-t border-[#edf1f6] pt-6 sm:grid-cols-[0.85fr_1.15fr]">
            <div className="flex items-center gap-3 rounded-[18px] bg-emerald-50 p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-emerald-600">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                  {t('landing.calc.savings', 'Экономия vs amoCRM/Bitrix')}
                </div>
                <div className="mt-1 text-xl font-semibold tabular-nums text-emerald-700">
                  {formatKzt(savingsVsCompetitor)} {t('landing.calc.perMonth', '/ мес')}
                </div>
              </div>
            </div>
            <p className="rounded-[18px] bg-[#f6f7f9] p-4 text-sm leading-6 text-[#6b7689]">
              {t('landing.calc.breakEvenNote', 'Точка перехода Starter -> Pro: примерно')}{' '}
              <strong className="font-semibold text-[#172033]">{formatKzt(breakEven)}</strong>{' '}
              {t('landing.calc.breakEvenSuffix', 'оборота в месяц. Выше - Pro выгоднее, ниже - оставайтесь на Starter.')}
            </p>
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
        'relative rounded-[18px] border p-5 transition-all',
        active && 'border-[#2563eb] bg-[#eef4ff]',
        !active && !muted && 'border-[#d8dee8] bg-white',
        muted && 'border-[#d8dee8] bg-[#f6f7f9] opacity-75'
      )}
    >
      {active && recommendLabel && (
        <span className="absolute right-3 top-3 rounded-full bg-[#2563eb] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
          {recommendLabel}
        </span>
      )}
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7689]">{name}</div>
      <div className={cn('mt-4 text-3xl font-semibold tabular-nums tracking-tight', active ? 'text-[#2563eb]' : 'text-[#172033]', muted && 'line-through decoration-red-500/50 decoration-2')}>
        {formatKzt(cost)}
      </div>
      <div className="mt-2 text-xs font-medium leading-5 text-[#6b7689]">{sub}</div>
    </div>
  );
}

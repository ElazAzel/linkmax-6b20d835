import { useState } from 'react';
import Check from 'lucide-react/dist/esm/icons/check';
import { cn } from '@/lib/utils/utils';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { SectionWrapper } from '@/components/shared/SectionWrapper';

export const PricingAurora = ({ onPlanSelect }: { onPlanSelect: (plan: string) => void }) => {
  const { t, i18n } = useTranslation();
  const [isYearly, setIsYearly] = useState(true);
  const isKZ = i18n.language === 'ru' || i18n.language === 'kk';

  const prices = {
    starter: isKZ ? '0 ₸' : '$0',
    pro: {
      monthly: isKZ ? '4 350 ₸' : '$8.90',
      yearly: isKZ ? '3 045 ₸' : '$5.90',
      totalYearly: isKZ ? '36 540 ₸' : '$70.80',
    },
  };

  const starterFeatures = [
    t('landing.pricing.starterDesc', 'Начните за 0₸/мес. Мы берем комиссию только когда вы зарабатываете.'),
    t('landing.v5.bento.builder.title', 'Витрина услуг без пустых блоков'),
    t('landing.v5.bento.crm.notify_title', 'Новая заявка'),
  ];

  const proFeatures = [
    t('landing.pricing.f1', 'Все блоки без ограничений'),
    t('landing.pricing.f2', 'Онлайн-запись и мини-CRM'),
    t('landing.pricing.f3', 'Заявки сразу в Telegram'),
    t('landing.pricing.f4', 'Продажа товаров и билетов'),
    t('landing.pricing.f6', 'Расширенная аналитика'),
    t('landing.pricing.f7_new', 'Свой домен и без брендинга'),
    t('landing.pricing.f8_new', 'До 6 страниц на аккаунт'),
  ];

  return (
    <SectionWrapper id="pricing" className="bg-[#f6f7f9] py-20 md:py-24">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2563eb]">pricing</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#172033] md:text-[42px] md:leading-[1.12]">
            {t('landing.pricing.title', 'Простые цены,')}{' '}
            <span className="text-[#2563eb]">{t('landing.pricing.titleHighlight', 'максимум возможностей')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#6b7689]">
            {t('landing.pricing.subtitle', 'Начните бесплатно. Перейдите на Pro, когда будете готовы масштабироваться.')}
          </p>

          <div className="mt-8 inline-flex items-center gap-4 rounded-full border border-[#d8dee8] bg-white px-4 py-2">
            <Label htmlFor="billing-mode" className={cn('cursor-pointer text-sm font-semibold', !isYearly ? 'text-[#2563eb]' : 'text-[#6b7689]')}>
              {t('landing.pricing.monthly', 'Ежемесячно')}
            </Label>
            <Switch id="billing-mode" checked={isYearly} onCheckedChange={setIsYearly} />
            <Label htmlFor="billing-mode" className={cn('cursor-pointer text-sm font-semibold', isYearly ? 'text-[#2563eb]' : 'text-[#6b7689]')}>
              {t('landing.pricing.yearly', 'Годовой')}
              <Badge variant="secondary" className="ml-2 rounded-full bg-[#eef4ff] text-[#2563eb] hover:bg-[#eef4ff]">
                {t('landing.pricing.save', '-30%')}
              </Badge>
            </Label>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <PlanCard
            name="Starter"
            price={prices.starter}
            suffix={t('landing.pricing.perMonth', 'mo')}
            description={t('landing.pricing.successFirst', 'Плати только за результат')}
            features={starterFeatures}
            cta={t('landing.pricing.starterCta', 'Начать бесплатно')}
            onClick={() => onPlanSelect('starter')}
          />

          <PlanCard
            featured
            name={t('landing.pricing.proName', 'Pro')}
            price={isYearly ? prices.pro.yearly : prices.pro.monthly}
            suffix={t('landing.pricing.perMonth', 'mo')}
            description={
              isYearly
                ? t('landing.pricing.billedYearly', 'Billed {{price}} yearly', { price: prices.pro.totalYearly })
                : t('landing.pricing.proSub', '2 900 ₸ + 1% с продаж')
            }
            features={proFeatures}
            cta={t('landing.pricing.proCta', 'Попробовать Pro бесплатно')}
            badge={t('landing.pricing.popular', 'Хит')}
            onClick={() => onPlanSelect('pro')}
          />
        </div>

        <p className="mt-6 text-center text-xs font-medium leading-5 text-[#6b7689]">
          {t('landing.pricing.transactionFeeNote_v2', '* Комиссия за транзакции: Starter (7%), Pro (1%)')}
        </p>
      </div>
    </SectionWrapper>
  );
};

function PlanCard({
  name,
  price,
  suffix,
  description,
  features,
  cta,
  featured,
  badge,
  onClick,
}: {
  name: string;
  price: string;
  suffix: string;
  description: string;
  features: string[];
  cta: string;
  featured?: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <article
      className={cn(
        'relative flex h-full flex-col rounded-[18px] border p-6 sm:p-8',
        featured
          ? 'border-[#2563eb] bg-white shadow-[0_16px_40px_rgba(23,32,51,0.10)]'
          : 'border-[#d8dee8] bg-white'
      )}
    >
      {featured && (
        <span className="absolute right-5 top-5 rounded-full bg-[#2563eb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white">
          {badge}
        </span>
      )}

      <div>
        <h3 className="text-2xl font-semibold tracking-tight text-[#172033]">{name}</h3>
        <div className="mt-5 flex items-end gap-2">
          <span className="text-5xl font-semibold tracking-tight text-[#172033]">{price}</span>
          <span className="pb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#6b7689]">/ {suffix}</span>
        </div>
        <p className="mt-4 text-sm leading-6 text-[#6b7689]">{description}</p>
      </div>

      <ul className="mt-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm font-medium leading-6 text-[#3b4658]">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef4ff]">
              <Check className="h-3.5 w-3.5 text-[#2563eb]" />
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <Button
        onClick={onClick}
        className={cn(
          'mt-8 h-12 rounded-[12px] text-base font-semibold',
          featured ? 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]' : 'border border-[#d8dee8] bg-[#f6f7f9] text-[#172033] hover:bg-[#edf1f6]'
        )}
      >
        {cta}
      </Button>
    </article>
  );
}

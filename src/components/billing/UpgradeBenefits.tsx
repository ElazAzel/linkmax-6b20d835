/**
 * UpgradeBenefits — переиспользуемый блок выгод Pro.
 * Показывает 3 ключевых преимущества + микро-калькулятор окупаемости.
 * Встраивается внутрь paywall-компонентов (PremiumFeatureGate, FreemiumBlockLimit и т.д.).
 *
 * Не имеет своих CTA — оставляет это родительскому компоненту, чтобы не ломать
 * существующие upgrade-флоу (Robokassa через openPremiumPurchase).
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Zap from 'lucide-react/dist/esm/icons/zap';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Globe from 'lucide-react/dist/esm/icons/globe';
import { cn } from '@/lib/utils/utils';

interface UpgradeBenefitsProps {
  /** compact = горизонтальный inline-вариант для узких карточек */
  compact?: boolean;
  className?: string;
}

export const UpgradeBenefits = memo(function UpgradeBenefits({
  compact = false,
  className,
}: UpgradeBenefitsProps) {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: Zap,
      title: t('upgradeBenefits.b1Title', 'Все блоки и формы'),
      desc: t('upgradeBenefits.b1Desc', 'Заявки, запись, оплата'),
    },
    {
      icon: TrendingUp,
      title: t('upgradeBenefits.b2Title', 'Комиссия 1% вместо 5%'),
      desc: t('upgradeBenefits.b2Desc', 'Окупается с 60 000 ₸ оборота'),
    },
    {
      icon: Globe,
      title: t('upgradeBenefits.b3Title', 'Свой домен · без брендинга'),
      desc: t('upgradeBenefits.b3Desc', 'Профессиональный вид'),
    },
  ];

  if (compact) {
    return (
      <ul className={cn('space-y-1.5', className)}>
        {benefits.map((b, i) => {
          const Icon = b.icon;
          return (
            <li key={i} className="flex items-center gap-2 text-xs">
              <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-semibold text-foreground/90">{b.title}</span>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-3 gap-3 w-full', className)}>
      {benefits.map((b, i) => {
        const Icon = b.icon;
        return (
          <div
            key={i}
            className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-xs font-bold text-foreground leading-tight mb-0.5">
              {b.title}
            </p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {b.desc}
            </p>
          </div>
        );
      })}
    </div>
  );
});

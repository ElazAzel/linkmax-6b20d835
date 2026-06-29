import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PricingBlock as PricingBlockType } from '@/types/page';
import { Badge } from '@/components/ui/badge';
import { BlockShell, SectionHeader } from '@/components/blocks/shells/BlockShell';
import { getI18nText } from '@/lib/i18n-helpers';
import { getLocale } from '@/lib/utils/format';
import { cn } from '@/lib/utils/utils';
import { handleKeyboardActivation } from '@/lib/utils/a11y';
import Star from 'lucide-react/dist/esm/icons/star';
import Tag from 'lucide-react/dist/esm/icons/tag';
import { useAnalytics } from '@/hooks/analytics/useAnalyticsTracking';

interface PricingBlockProps {
  block: PricingBlockType;
}

const currencySymbols: Record<string, string> = {
  KZT: '₸', RUB: '₽', USD: '$', EUR: '€', GBP: '£', BYN: 'Br',
  AMD: '֏', AZN: '₼', KGS: 'с', TJS: 'SM', TMT: 'm', UZS: 'сўм',
  CNY: '¥', JPY: '¥', CHF: 'CHF', CAD: 'C$', AUD: 'A$',
};

export const PricingBlock = React.memo(function PricingBlock({ block }: PricingBlockProps) {
  const { t, i18n } = useTranslation();
  const { onBlockClick } = useAnalytics();
  const currentLang = i18n.language as 'ru' | 'en' | 'kk';

  const title = block.title ? getI18nText(block.title, currentLang) : '';

  const formatPrice = (price: number, currency: string = 'KZT') => {
    const symbol = currencySymbols[currency] || currency;
    return `${price.toLocaleString(getLocale(i18n.language))} ${symbol}`;
  };

  if (!block.items || block.items.length === 0) {
    return (
      <BlockShell variant="quiet" padding="md" className="text-center text-muted-foreground text-sm">
        {t('blocks.pricing.empty', 'Добавьте услуги')}
      </BlockShell>
    );
  }

  return (
    <div
      className="w-full space-y-2"
      style={{
        backgroundColor: block.blockStyle?.backgroundColor,
        backgroundImage: block.blockStyle?.backgroundGradient,
      }}
    >
      {title && <SectionHeader icon={<Tag className="h-4 w-4" />} title={title} />}

      <div className="space-y-2">
        {block.items.map((item) => {
          const name = getI18nText(item.name, currentLang);
          const description = item.description ? getI18nText(item.description, currentLang) : '';
          const period = item.period ? getI18nText(item.period, currentLang) : '';
          const handle = () => onBlockClick(block.id, block.type, `${title} - ${name}`);

          return (
            <div
              key={item.id}
              onClick={handle}
              onKeyDown={(event) => handleKeyboardActivation(event, handle)}
              role="button"
              tabIndex={0}
              className={cn(
                'qb-card qb-card-hover flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 cursor-pointer active:scale-[0.99] transition-transform',
                item.featured && 'ring-2 ring-primary/60'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-sm leading-snug break-words hyphens-auto tracking-tight">{name}</h4>
                  {item.featured && (
                    <Badge variant="default" className="text-[10px] h-5 px-2">
                      <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                      {t('blocks.pricing.hit', 'Хит')}
                    </Badge>
                  )}
                </div>
                {description && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed break-words hyphens-auto">{description}</p>
                )}
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                <span className="text-base font-semibold text-primary break-words tracking-tight">
                  {formatPrice(item.price, item.currency || block.currency || 'KZT')}
                </span>
                {period && <p className="text-xs text-muted-foreground">{period}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

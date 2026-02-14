import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PricingBlock as PricingBlockType } from '@/types/page';
import { Badge } from '@/components/ui/badge';
import { getTranslatedString } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';
import { Star, Tag } from 'lucide-react';

interface PricingBlockProps {
  block: PricingBlockType;
}

const currencySymbols: Record<string, string> = {
  KZT: '₸',
  RUB: '₽',
  USD: '$',
  EUR: '€',
  GBP: '£',
  BYN: 'Br',
  AMD: '֏',
  AZN: '₼',
  KGS: 'с',
  TJS: 'SM',
  TMT: 'm',
  UZS: 'сўм',
  CNY: '¥',
  JPY: '¥',
  CHF: 'CHF',
  CAD: 'C$',
  AUD: 'A$',
};

export const PricingBlock = React.memo(function PricingBlock({ block }: PricingBlockProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'ru' | 'en' | 'kk';

  const title = block.title ? getTranslatedString(block.title, currentLang) : '';

  const formatPrice = (price: number, currency: string = 'KZT') => {
    const symbol = currencySymbols[currency] || currency;
    return `${price.toLocaleString('ru-RU')} ${symbol}`;
  };

  if (!block.items || block.items.length === 0) {
    return (
      <div className="w-full p-4 rounded-xl bg-card border border-border text-center text-muted-foreground text-sm">
        {t('blocks.pricing.empty', 'Добавьте услуги')}
      </div>
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
      {title && (
        <div className="flex items-center gap-2 px-1 mb-3">
          <Tag className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
      )}
      
      <div className="space-y-1.5">
        {block.items.map((item) => {
          const name = getTranslatedString(item.name, currentLang);
          const description = item.description 
            ? getTranslatedString(item.description, currentLang) 
            : '';
          const period = item.period 
            ? getTranslatedString(item.period, currentLang) 
            : '';

          return (
            <div 
              key={item.id} 
              className={cn(
                'flex items-center justify-between gap-3 p-4 rounded-xl',
                'bg-card border border-border shadow-sm',
                'transition-all active:scale-[0.99]',
                item.featured && 'ring-2 ring-primary bg-primary/5'
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm truncate">{name}</h4>
                  {item.featured && (
                    <Badge variant="default" className="text-[10px] h-5 px-1.5">
                      <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                      {t('blocks.pricing.hit', 'Хит')}
                    </Badge>
                  )}
                </div>
                {description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {description}
                  </p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-base font-bold text-primary whitespace-nowrap">
                  {formatPrice(item.price, item.currency || block.currency || 'KZT')}
                </span>
                {period && (
                  <p className="text-[10px] text-muted-foreground">{period}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

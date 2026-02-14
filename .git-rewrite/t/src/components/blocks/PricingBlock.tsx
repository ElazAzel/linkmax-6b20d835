import React from 'react';
import { useTranslation } from 'react-i18next';
import type { PricingBlock as PricingBlockType } from '@/types/page';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getTranslatedString } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

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
    return `${price.toLocaleString()} ${symbol}`;
  };

  if (!block.items || block.items.length === 0) {
    return (
      <Card className="w-full bg-card border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('blocks.pricing.empty', 'Добавьте услуги')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-3">
      {title && (
        <h3 className="text-xl font-semibold text-center">{title}</h3>
      )}
      
      <div className="space-y-2">
        {block.items.map((item) => {
          const name = getTranslatedString(item.name, currentLang);
          const description = item.description 
            ? getTranslatedString(item.description, currentLang) 
            : '';
          const period = item.period 
            ? getTranslatedString(item.period, currentLang) 
            : '';

          return (
            <Card 
              key={item.id} 
              className={cn(
                'transition-all bg-card border-border shadow-sm',
                item.featured && 'ring-2 ring-primary bg-primary/5'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{name}</h4>
                      {item.featured && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          {t('blocks.pricing.popular', 'Популярное')}
                        </Badge>
                      )}
                    </div>
                    {description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {description}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(item.price, item.currency || block.currency || 'KZT')}
                    </span>
                    {period && (
                      <p className="text-xs text-muted-foreground">{period}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
});

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
import { dispatchBookingOfferingSelection } from '@/lib/revenue/booking-offering-events';
import { openExternal } from '@/lib/blocks/safe-href';
import { contactMessageHref, usePageContacts } from '@/lib/blocks/page-contacts';

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
  const contacts = usePageContacts();
  const chat = contacts.find((c) => c.platform !== 'phone');
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
      {title && <SectionHeader className="px-5 pt-4 mb-1" icon={<Tag className="h-4 w-4" />} title={title} />}

      {/* One flat list inside the block's own card: rows used to be cards
          inside the card, truncated to one line, and looked tappable even
          when a tap did nothing. */}
      <ul className="divide-y divide-border/60 px-5 py-2">
        {block.items.map((item, index) => {
          const name = getI18nText(item.name, currentLang);
          const description = item.description ? getI18nText(item.description, currentLang) : '';
          const period = item.period ? getI18nText(item.period, currentLang) : '';
          const orderHref = !item.serviceOfferingId && chat
            ? contactMessageHref(chat, t('blocks.pricing.orderMessage', { name, defaultValue: 'Здравствуйте! Хочу записаться: «{{name}}»' }))
            : undefined;
          const interactive = Boolean(item.serviceOfferingId || orderHref);
          const handle = () => {
            onBlockClick(block.id, block.type, `${title} - ${name}`);
            if (item.serviceOfferingId) {
              dispatchBookingOfferingSelection({
                serviceOfferingId: item.serviceOfferingId,
                pricingBlockId: block.id,
              });
            } else if (orderHref) {
              openExternal(orderHref);
            }
          };

          return (
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- role/tabIndex applied when interactive
            <li
              key={item.id || `item-${index}`}
              onClick={interactive ? handle : undefined}
              onKeyDown={interactive ? (event) => handleKeyboardActivation(event, handle) : undefined}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              className={cn(
                '-mx-2 flex items-start justify-between gap-4 px-2 py-3',
                interactive && 'cursor-pointer rounded-lg transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.06]'
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h4 className="text-sm font-semibold leading-snug tracking-tight break-words">{name}</h4>
                  {item.featured && (
                    <Badge variant="secondary" className="h-5 px-2 text-[10px] font-medium">
                      <Star className="mr-0.5 h-2.5 w-2.5 fill-current" />
                      {t('blocks.pricing.hit', 'Хит')}
                    </Badge>
                  )}
                </div>
                {description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-3 break-words">{description}</p>
                )}
              </div>
              <div className="flex-shrink-0 text-right">
                <span className="whitespace-nowrap text-sm font-semibold tabular-nums tracking-tight text-foreground">
                  {formatPrice(item.price, item.currency || block.currency || 'KZT')}
                </span>
                {period && <p className="text-xs text-muted-foreground">{period}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

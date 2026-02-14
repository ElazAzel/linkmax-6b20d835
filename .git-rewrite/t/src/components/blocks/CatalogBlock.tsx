import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { CatalogBlock as CatalogBlockType, CatalogItem } from '@/types/page';
import { Card, CardContent } from '@/components/ui/card';
import { getTranslatedString } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';

interface CatalogBlockProps {
  block: CatalogBlockType;
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

export const CatalogBlock = React.memo(function CatalogBlock({ block }: CatalogBlockProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'ru' | 'en' | 'kk';

  const title = block.title ? getTranslatedString(block.title, currentLang) : '';
  const isGrid = block.layout === 'grid';

  const formatPrice = (price: number, currency: string = 'KZT') => {
    const symbol = currencySymbols[currency] || currency;
    return `${price.toLocaleString()} ${symbol}`;
  };

  // Group items by category
  const groupedItems = useMemo(() => {
    const categories = block.categories || [];
    const items = block.items || [];
    
    const groups: { categoryId: string | null; categoryName: string; items: CatalogItem[] }[] = [];
    
    // Add categorized items
    categories.forEach(category => {
      const categoryItems = items.filter(item => item.categoryId === category.id);
      if (categoryItems.length > 0) {
        groups.push({
          categoryId: category.id,
          categoryName: getTranslatedString(category.name, currentLang),
          items: categoryItems,
        });
      }
    });
    
    // Add uncategorized items
    const uncategorizedItems = items.filter(item => !item.categoryId || !categories.find(c => c.id === item.categoryId));
    if (uncategorizedItems.length > 0) {
      groups.push({
        categoryId: null,
        categoryName: categories.length > 0 ? t('blocks.catalog.uncategorized', 'Другое') : '',
        items: uncategorizedItems,
      });
    }
    
    return groups;
  }, [block.categories, block.items, currentLang, t]);

  if (!block.items || block.items.length === 0) {
    return (
      <Card className="w-full bg-card border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('blocks.catalog.empty', 'Каталог пуст')}
        </CardContent>
      </Card>
    );
  }

  const renderItem = (item: CatalogItem) => {
    const itemName = getTranslatedString(item.name, currentLang);
    const itemDescription = item.description 
      ? getTranslatedString(item.description, currentLang) 
      : '';

    return (
      <Card key={item.id} className="overflow-hidden bg-card border-border shadow-sm">
        {item.image && (
          <div className={cn(
            'overflow-hidden',
            isGrid ? 'aspect-square' : 'aspect-video'
          )}>
            <img
              src={item.image}
              alt={itemName}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <CardContent className={cn('p-4', isGrid && 'p-3')}>
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                'font-medium truncate',
                isGrid ? 'text-sm' : 'text-base'
              )}>
                {itemName}
              </h4>
              {itemDescription && (
                <p className={cn(
                  'text-muted-foreground mt-1',
                  isGrid ? 'text-xs line-clamp-2' : 'text-sm line-clamp-3'
                )}>
                  {itemDescription}
                </p>
              )}
            </div>
            {block.showPrices !== false && item.price !== undefined && item.price > 0 && (
              <span className={cn(
                'font-semibold text-primary whitespace-nowrap',
                isGrid ? 'text-sm' : 'text-base'
              )}>
                {formatPrice(item.price, item.currency || block.currency || 'KZT')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full space-y-4">
      {title && (
        <h3 className="text-xl font-semibold text-center">{title}</h3>
      )}
      
      {groupedItems.map((group, groupIndex) => (
        <div key={group.categoryId || `uncategorized-${groupIndex}`} className="space-y-3">
          {group.categoryName && (
            <h4 className="text-lg font-medium text-foreground/80 border-b pb-2">
              {group.categoryName}
            </h4>
          )}
          <div className={cn(
            isGrid 
              ? 'grid grid-cols-2 gap-3' 
              : 'flex flex-col gap-3'
          )}>
            {group.items.map(renderItem)}
          </div>
        </div>
      ))}
    </div>
  );
});

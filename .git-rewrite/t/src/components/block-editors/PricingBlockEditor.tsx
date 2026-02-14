import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, Star } from 'lucide-react';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { CurrencySelect } from '@/components/form-fields/CurrencySelect';
import type { PricingBlock, PricingItem, Currency } from '@/types/page';
import { createMultilingualString, getTranslatedString } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';

interface PricingBlockEditorProps {
  formData: Partial<PricingBlock>;
  onChange: (data: Partial<PricingBlock>) => void;
}

export function PricingBlockEditor({ formData, onChange }: PricingBlockEditorProps) {
  const { t, i18n } = useTranslation();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const currentLang = i18n.language as 'ru' | 'en' | 'kk';

  const items = formData.items || [];

  const addItem = () => {
    const newItem: PricingItem = {
      id: `price-${Date.now()}`,
      name: createMultilingualString(''),
      description: createMultilingualString(''),
      price: 0,
      currency: formData.currency || 'KZT',
      period: createMultilingualString(''),
      featured: false,
    };
    onChange({ items: [...items, newItem] });
    setExpandedItem(newItem.id);
  };

  const updateItem = (itemId: string, updates: Partial<PricingItem>) => {
    onChange({
      items: items.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      ),
    });
  };

  const removeItem = (itemId: string) => {
    onChange({ items: items.filter(item => item.id !== itemId) });
    if (expandedItem === itemId) {
      setExpandedItem(null);
    }
  };

  const getItemName = (item: PricingItem): string => {
    return getTranslatedString(item.name, currentLang) || t('blocks.pricing.newItem', 'Новая услуга');
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <MultilingualInput
        label={t('blocks.pricing.title', 'Заголовок')}
        value={typeof formData.title === 'string' ? createMultilingualString(formData.title) : (formData.title || createMultilingualString(''))}
        onChange={(value) => onChange({ title: value })}
        placeholder={t('blocks.pricing.titlePlaceholder', 'Прайс-лист')}
      />

      {/* Default Currency */}
      <div className="space-y-2">
        <Label>{t('blocks.pricing.defaultCurrency', 'Валюта по умолчанию')}</Label>
        <CurrencySelect
          value={formData.currency || 'KZT'}
          onValueChange={(value) => onChange({ currency: value as Currency })}
        />
      </div>

      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('blocks.pricing.items', 'Услуги')}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            {t('blocks.pricing.addItem', 'Добавить')}
          </Button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {items.map((item, index) => (
            <Card 
              key={item.id} 
              className={cn(
                'transition-all',
                expandedItem === item.id && 'ring-2 ring-primary',
                item.featured && 'border-primary'
              )}
            >
              <CardContent className="p-3">
                {/* Collapsed view */}
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  {item.featured && <Star className="h-4 w-4 text-primary flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">
                      {getItemName(item)}
                    </p>
                    {item.price > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {item.price.toLocaleString()} {item.currency || formData.currency || 'KZT'}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Expanded view */}
                {expandedItem === item.id && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {/* Name */}
                    <MultilingualInput
                      label={t('blocks.pricing.itemName', 'Название')}
                      value={typeof item.name === 'string' ? createMultilingualString(item.name) : item.name}
                      onChange={(value) => updateItem(item.id, { name: value })}
                      placeholder={t('blocks.pricing.itemNamePlaceholder', 'Название услуги')}
                    />

                    {/* Description */}
                    <MultilingualInput
                      label={t('blocks.pricing.itemDescription', 'Описание')}
                      value={typeof item.description === 'string' ? createMultilingualString(item.description) : (item.description || createMultilingualString(''))}
                      onChange={(value) => updateItem(item.id, { description: value })}
                      placeholder={t('blocks.pricing.itemDescriptionPlaceholder', 'Описание услуги')}
                      type="textarea"
                    />

                    {/* Price */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label>{t('blocks.pricing.itemPrice', 'Цена')}</Label>
                        <Input
                          type="number"
                          min="0"
                          value={item.price || ''}
                          onChange={(e) => updateItem(item.id, { 
                            price: e.target.value ? parseFloat(e.target.value) : 0 
                          })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{t('blocks.pricing.itemCurrency', 'Валюта')}</Label>
                        <CurrencySelect
                          value={item.currency || formData.currency || 'KZT'}
                          onValueChange={(value) => updateItem(item.id, { currency: value as Currency })}
                        />
                      </div>
                    </div>

                    {/* Period */}
                    <MultilingualInput
                      label={t('blocks.pricing.itemPeriod', 'Период')}
                      value={typeof item.period === 'string' ? createMultilingualString(item.period) : (item.period || createMultilingualString(''))}
                      onChange={(value) => updateItem(item.id, { period: value })}
                      placeholder={t('blocks.pricing.itemPeriodPlaceholder', 'за час, за сеанс...')}
                    />

                    {/* Featured */}
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        {t('blocks.pricing.featured', 'Популярное')}
                      </Label>
                      <Switch
                        checked={item.featured || false}
                        onCheckedChange={(checked) => updateItem(item.id, { featured: checked })}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="text-sm">{t('blocks.pricing.emptyHint', 'Добавьте услуги и цены')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

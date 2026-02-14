import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, GripVertical, Star, Clock, Lightbulb } from 'lucide-react';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { CurrencySelect } from '@/components/form-fields/CurrencySelect';
import type { PricingBlock, PricingItem, Currency, ServiceType } from '@/types/page';
import { createMultilingualString, getTranslatedString } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';

interface PricingBlockEditorProps {
  formData: Partial<PricingBlock>;
  onChange: (data: Partial<PricingBlock>) => void;
}

const SERVICE_TYPES: { value: ServiceType; label: string; emoji: string }[] = [
  { value: 'haircut', label: 'Стрижка', emoji: '💇' },
  { value: 'consultation', label: 'Консультация', emoji: '💬' },
  { value: 'training', label: 'Тренировка', emoji: '💪' },
  { value: 'manicure', label: 'Маникюр', emoji: '💅' },
  { value: 'lesson', label: 'Урок', emoji: '📚' },
  { value: 'massage', label: 'Массаж', emoji: '💆' },
  { value: 'photo', label: 'Фотосессия', emoji: '📷' },
  { value: 'other', label: 'Другое', emoji: '📦' },
];

const DURATION_OPTIONS = [
  { value: 30, label: '30 мин' },
  { value: 60, label: '1 час' },
  { value: 90, label: '1.5 часа' },
  { value: 120, label: '2 часа' },
];

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
      featured: false,
      serviceType: 'other',
      duration: 60,
    };
    onChange({ items: [...items, newItem] });
    setExpandedItem(newItem.id);
  };

  const updateItem = (itemId: string, updates: Partial<PricingItem>) => {
    onChange({
      items: items.map(item => item.id === itemId ? { ...item, ...updates } : item),
    });
  };

  const removeItem = (itemId: string) => {
    onChange({ items: items.filter(item => item.id !== itemId) });
  };

  const getItemName = (item: PricingItem): string => {
    return getTranslatedString(item.name, currentLang) || t('blocks.pricing.newItem', 'Новая услуга');
  };

  return (
    <div className="space-y-4">
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          Чем подробнее описаны услуги, тем точнее AI-помощник понимает ваш бизнес.
        </AlertDescription>
      </Alert>

      <MultilingualInput
        label={t('blocks.pricing.title', 'Заголовок')}
        value={typeof formData.title === 'string' ? createMultilingualString(formData.title) : (formData.title || createMultilingualString(''))}
        onChange={(value) => onChange({ title: value })}
        placeholder="Мои услуги"
      />

      <div className="space-y-2">
        <Label>Валюта по умолчанию</Label>
        <CurrencySelect
          value={formData.currency || 'KZT'}
          onValueChange={(value) => onChange({ currency: value as Currency })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Услуги</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Добавить
          </Button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {items.map((item) => {
            const serviceType = SERVICE_TYPES.find(s => s.value === item.serviceType);
            
            return (
              <Card key={item.id} className={cn('transition-all', expandedItem === item.id && 'ring-2 ring-primary')}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    {serviceType && <span>{serviceType.emoji}</span>}
                    {item.featured && <Star className="h-4 w-4 text-primary" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{getItemName(item)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.price > 0 && <span>{item.price.toLocaleString()} {item.currency || 'KZT'}</span>}
                        {item.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.duration} мин</span>}
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {expandedItem === item.id && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <div className="space-y-2">
                        <Label>Тип услуги</Label>
                        <Select value={item.serviceType || 'other'} onValueChange={(value) => updateItem(item.id, { serviceType: value as ServiceType })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {SERVICE_TYPES.map(({ value, label, emoji }) => (
                              <SelectItem key={value} value={value}>{emoji} {label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <MultilingualInput label="Название" value={typeof item.name === 'string' ? createMultilingualString(item.name) : item.name} onChange={(value) => updateItem(item.id, { name: value })} placeholder="Стрижка мужская" />
                      <MultilingualInput label="Описание" value={typeof item.description === 'string' ? createMultilingualString(item.description) : (item.description || createMultilingualString(''))} onChange={(value) => updateItem(item.id, { description: value })} type="textarea" />

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Цена</Label>
                          <Input type="number" min="0" value={item.price || ''} onChange={(e) => updateItem(item.id, { price: parseFloat(e.target.value) || 0 })} />
                        </div>
                        <div className="space-y-2">
                          <Label>Длительность</Label>
                          <Select value={String(item.duration || 60)} onValueChange={(value) => updateItem(item.id, { duration: parseInt(value) })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {DURATION_OPTIONS.map(({ value, label }) => (<SelectItem key={value} value={String(value)}>{label}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2"><Star className="h-4 w-4" />Популярное</Label>
                        <Switch checked={item.featured || false} onCheckedChange={(checked) => updateItem(item.id, { featured: checked })} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="text-sm">Расскажите, какие услуги вы оказываете</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

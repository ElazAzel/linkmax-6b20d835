import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import type { FAQBlock, FAQItem } from '@/types/page';
import { createMultilingualString, getTranslatedString } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';

interface FAQBlockEditorProps {
  formData: Partial<FAQBlock>;
  onChange: (data: Partial<FAQBlock>) => void;
}

export function FAQBlockEditor({ formData, onChange }: FAQBlockEditorProps) {
  const { t, i18n } = useTranslation();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const currentLang = i18n.language as 'ru' | 'en' | 'kk';

  const items = formData.items || [];

  const addItem = () => {
    const newItem: FAQItem = {
      id: `faq-${Date.now()}`,
      question: createMultilingualString(''),
      answer: createMultilingualString(''),
    };
    onChange({ items: [...items, newItem] });
    setExpandedItem(newItem.id);
  };

  const updateItem = (itemId: string, updates: Partial<FAQItem>) => {
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

  const getQuestionPreview = (item: FAQItem): string => {
    return getTranslatedString(item.question, currentLang) || t('blocks.faq.newQuestion', 'Новый вопрос');
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <MultilingualInput
        label={t('blocks.faq.title', 'Заголовок')}
        value={typeof formData.title === 'string' ? createMultilingualString(formData.title) : (formData.title || createMultilingualString(''))}
        onChange={(value) => onChange({ title: value })}
        placeholder={t('blocks.faq.titlePlaceholder', 'Частые вопросы')}
      />

      {/* Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('blocks.faq.items', 'Вопросы и ответы')}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            {t('blocks.faq.addItem', 'Добавить')}
          </Button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {items.map((item, index) => (
            <Card 
              key={item.id} 
              className={cn(
                'transition-all',
                expandedItem === item.id && 'ring-2 ring-primary'
              )}
            >
              <CardContent className="p-3">
                {/* Collapsed view */}
                <div 
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">
                      {getQuestionPreview(item)}
                    </p>
                  </div>
                  {expandedItem === item.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
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
                    <MultilingualInput
                      label={t('blocks.faq.question', 'Вопрос')}
                      value={typeof item.question === 'string' ? createMultilingualString(item.question) : item.question}
                      onChange={(value) => updateItem(item.id, { question: value })}
                      placeholder={t('blocks.faq.questionPlaceholder', 'Введите вопрос')}
                    />

                    <MultilingualInput
                      label={t('blocks.faq.answer', 'Ответ')}
                      value={typeof item.answer === 'string' ? createMultilingualString(item.answer) : item.answer}
                      onChange={(value) => updateItem(item.id, { answer: value })}
                      placeholder={t('blocks.faq.answerPlaceholder', 'Введите ответ')}
                      type="textarea"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="text-sm">{t('blocks.faq.emptyHint', 'Добавьте вопросы и ответы')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

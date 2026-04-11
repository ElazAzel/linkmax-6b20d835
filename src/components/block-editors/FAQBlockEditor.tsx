import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import ChevronUp from 'lucide-react/dist/esm/icons/chevron-up';
import Type from 'lucide-react/dist/esm/icons/type';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import type { FAQItem } from '@/types/page';
import { createMultilingualString, getI18nText } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils/utils';
import { useDashboard } from '@/hooks/dashboard/useDashboard';
import { getRandomSuggestion } from '@/lib/intelligence/writing-algorithm';
import { toast } from 'sonner';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { EditorSection } from './EditorSection';

function FAQBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t, i18n } = useTranslation();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const currentLang = i18n.language as 'ru' | 'en' | 'kk';
  const { pageData } = useDashboard();
  const niche = pageData?.niche || 'general';

  const items: FAQItem[] = formData.items || [];

  const handleMagicWandQuestion = (itemId: string) => {
    const suggestion = getRandomSuggestion(niche, 'faq_question');
    const item = items.find(i => i.id === itemId);
    if (item) {
      const currentQ = typeof item.question === 'string' ? createMultilingualString(item.question) : item.question;
      updateItem(itemId, { question: { ...currentQ, [currentLang]: suggestion } });
      toast.success(t('ai.suggestionApplied', 'Предложение применено'));
    }
  };

  const handleMagicWandAnswer = (itemId: string) => {
    const suggestion = getRandomSuggestion(niche, 'faq_answer');
    const item = items.find(i => i.id === itemId);
    if (item) {
      const currentA = typeof item.answer === 'string' ? createMultilingualString(item.answer) : item.answer;
      updateItem(itemId, { answer: { ...currentA, [currentLang]: suggestion } });
      toast.success(t('ai.suggestionApplied', 'Предложение применено'));
    }
  };

  const addItem = () => {
    const newItem: FAQItem = {
      id: `faq-${Date.now()}`,
      question: createMultilingualString(''),
      answer: createMultilingualString(''),
    };
    onChange({ ...formData, items: [...items, newItem] });
    setExpandedItem(newItem.id);
  };

  const updateItem = (itemId: string, updates: Partial<FAQItem>) => {
    onChange({
      ...formData,
      items: items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    });
  };

  const removeItem = (itemId: string) => {
    onChange({ ...formData, items: items.filter(item => item.id !== itemId) });
    if (expandedItem === itemId) {
      setExpandedItem(null);
    }
  };

  const getQuestionPreview = (item: FAQItem): string => {
    return getI18nText(item.question, currentLang) || t('blocks.faq.newQuestion', 'Новый вопрос');
  };

  return (
    <div className="space-y-4">
      <EditorSection
        title={t('editor.sections.content', 'Контент')}
        icon={<Type className="h-5 w-5 text-primary" />}
        collapsible={false}
      >
        <MultilingualInput
          label={t('blocks.faq.title', 'Заголовок')}
          value={typeof formData.title === 'string' ? createMultilingualString(formData.title) : (formData.title || createMultilingualString(''))}
          onChange={(value) => onChange({ ...formData, title: value })}
          placeholder={t('blocks.faq.titlePlaceholder', 'Частые вопросы')}
        />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('blocks.faq.items', 'Вопросы и ответы')}</span>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              {t('blocks.faq.addItem', 'Добавить')}
            </Button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'border border-border/30 rounded-xl transition-all overflow-hidden',
                  expandedItem === item.id && 'ring-2 ring-primary border-primary/30'
                )}
              >
                <div
                  className="flex items-center gap-2 cursor-pointer p-3"
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

                {expandedItem === item.id && (
                  <div className="px-3 pb-3 space-y-3 border-t border-border/20 pt-3">
                    <MultilingualInput
                      label={t('blocks.faq.question', 'Вопрос')}
                      value={typeof item.question === 'string' ? createMultilingualString(item.question) : item.question}
                      onChange={(value) => updateItem(item.id, { question: value })}
                      onMagicWand={() => handleMagicWandQuestion(item.id)}
                      placeholder={t('blocks.faq.questionPlaceholder', 'Введите вопрос')}
                    />

                    <MultilingualInput
                      label={t('blocks.faq.answer', 'Ответ')}
                      value={typeof item.answer === 'string' ? createMultilingualString(item.answer) : item.answer}
                      onChange={(value) => updateItem(item.id, { answer: value })}
                      onMagicWand={() => handleMagicWandAnswer(item.id)}
                      placeholder={t('blocks.faq.answerPlaceholder', 'Введите ответ')}
                      type="textarea"
                    />
                  </div>
                )}
              </div>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                <p className="text-sm">{t('blocks.faq.emptyHint', 'Добавьте вопросы и ответы')}</p>
              </div>
            )}
          </div>
        </div>
      </EditorSection>
    </div>
  );
}

export const FAQBlockEditor = withBlockEditor(FAQBlockEditorComponent, {});

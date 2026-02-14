import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import type { CountdownBlock } from '@/types/page';
import { createMultilingualString } from '@/lib/i18n-helpers';

interface CountdownBlockEditorProps {
  formData: Partial<CountdownBlock>;
  onChange: (data: Partial<CountdownBlock>) => void;
}

export function CountdownBlockEditor({ formData, onChange }: CountdownBlockEditorProps) {
  const { t } = useTranslation();

  // Format date for datetime-local input
  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <MultilingualInput
        label={t('blocks.countdown.title', 'Заголовок')}
        value={typeof formData.title === 'string' ? createMultilingualString(formData.title) : (formData.title || createMultilingualString(''))}
        onChange={(value) => onChange({ title: value })}
        placeholder={t('blocks.countdown.titlePlaceholder', 'До конца акции')}
      />

      {/* Target Date */}
      <div className="space-y-2">
        <Label>{t('blocks.countdown.targetDate', 'Дата и время')}</Label>
        <Input
          type="datetime-local"
          value={formatDateForInput(formData.targetDate)}
          onChange={(e) => onChange({ targetDate: new Date(e.target.value).toISOString() })}
        />
      </div>

      {/* Expired Text */}
      <MultilingualInput
        label={t('blocks.countdown.expiredText', 'Текст после окончания')}
        value={typeof formData.expiredText === 'string' ? createMultilingualString(formData.expiredText) : (formData.expiredText || createMultilingualString(''))}
        onChange={(value) => onChange({ expiredText: value })}
        placeholder={t('blocks.countdown.expiredTextPlaceholder', 'Время вышло!')}
      />

      {/* Display Options */}
      <div className="space-y-3">
        <Label>{t('blocks.countdown.displayOptions', 'Отображение')}</Label>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">{t('blocks.countdown.showDays', 'Показывать дни')}</span>
          <Switch
            checked={formData.showDays !== false}
            onCheckedChange={(checked) => onChange({ showDays: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">{t('blocks.countdown.showHours', 'Показывать часы')}</span>
          <Switch
            checked={formData.showHours !== false}
            onCheckedChange={(checked) => onChange({ showHours: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">{t('blocks.countdown.showMinutes', 'Показывать минуты')}</span>
          <Switch
            checked={formData.showMinutes !== false}
            onCheckedChange={(checked) => onChange({ showMinutes: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">{t('blocks.countdown.showSeconds', 'Показывать секунды')}</span>
          <Switch
            checked={formData.showSeconds !== false}
            onCheckedChange={(checked) => onChange({ showSeconds: checked })}
          />
        </div>
      </div>
    </div>
  );
}

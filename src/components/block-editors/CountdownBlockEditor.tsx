import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { createMultilingualString } from '@/lib/i18n-helpers';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { EditorSection, EditorField } from './EditorSection';
import Type from 'lucide-react/dist/esm/icons/type';
import Settings from 'lucide-react/dist/esm/icons/settings';

function CountdownBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="space-y-4">
      <EditorSection
        title={t('editor.sections.content', 'Контент')}
        icon={<Type className="h-5 w-5 text-primary" />}
        collapsible={false}
      >
        <MultilingualInput
          label={t('blocks.countdown.title', 'Заголовок')}
          value={typeof formData.title === 'string' ? createMultilingualString(formData.title) : (formData.title || createMultilingualString(''))}
          onChange={(value) => onChange({ ...formData, title: value })}
          placeholder={t('blocks.countdown.titlePlaceholder', 'До конца акции')}
        />

        <EditorField label={t('blocks.countdown.targetDate', 'Дата и время')} required>
          <Input
            type="datetime-local"
            value={formatDateForInput(formData.targetDate)}
            onChange={(e) => onChange({ ...formData, targetDate: new Date(e.target.value).toISOString() })}
            className="h-12 rounded-xl"
          />
        </EditorField>

        <MultilingualInput
          label={t('blocks.countdown.expiredText', 'Текст после окончания')}
          value={typeof formData.expiredText === 'string' ? createMultilingualString(formData.expiredText) : (formData.expiredText || createMultilingualString(''))}
          onChange={(value) => onChange({ ...formData, expiredText: value })}
          placeholder={t('blocks.countdown.expiredTextPlaceholder', 'Время вышло!')}
        />
      </EditorSection>

      <EditorSection
        title={t('blocks.countdown.displayOptions', 'Отображение')}
        icon={<Settings className="h-5 w-5 text-primary" />}
        defaultOpen={false}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm">{t('blocks.countdown.showDays', 'Показывать дни')}</span>
          <Switch
            checked={formData.showDays !== false}
            onCheckedChange={(checked) => onChange({ ...formData, showDays: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">{t('blocks.countdown.showHours', 'Показывать часы')}</span>
          <Switch
            checked={formData.showHours !== false}
            onCheckedChange={(checked) => onChange({ ...formData, showHours: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">{t('blocks.countdown.showMinutes', 'Показывать минуты')}</span>
          <Switch
            checked={formData.showMinutes !== false}
            onCheckedChange={(checked) => onChange({ ...formData, showMinutes: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">{t('blocks.countdown.showSeconds', 'Показывать секунды')}</span>
          <Switch
            checked={formData.showSeconds !== false}
            onCheckedChange={(checked) => onChange({ ...formData, showSeconds: checked })}
          />
        </div>
      </EditorSection>
    </div>
  );
}

export const CountdownBlockEditor = withBlockEditor(CountdownBlockEditorComponent, {});

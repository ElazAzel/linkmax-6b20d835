import React from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import type { BeforeAfterBlock } from '@/types/page';
import { createMultilingualString } from '@/lib/i18n-helpers';

interface BeforeAfterBlockEditorProps {
  formData: Partial<BeforeAfterBlock>;
  onChange: (data: Partial<BeforeAfterBlock>) => void;
}

export function BeforeAfterBlockEditor({ formData, onChange }: BeforeAfterBlockEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Title */}
      <MultilingualInput
        label={t('blocks.beforeAfter.title', 'Заголовок')}
        value={typeof formData.title === 'string' ? createMultilingualString(formData.title) : (formData.title || createMultilingualString(''))}
        onChange={(value) => onChange({ title: value })}
        placeholder={t('blocks.beforeAfter.titlePlaceholder', 'Результат работы')}
      />

      {/* Before Image */}
      <div className="space-y-2">
        <Label>{t('blocks.beforeAfter.beforeImage', 'Фото "До"')}</Label>
        <MediaUpload
          value={formData.beforeImage || ''}
          onChange={(url) => onChange({ beforeImage: url })}
          accept="image/*"
        />
      </div>

      {/* After Image */}
      <div className="space-y-2">
        <Label>{t('blocks.beforeAfter.afterImage', 'Фото "После"')}</Label>
        <MediaUpload
          value={formData.afterImage || ''}
          onChange={(url) => onChange({ afterImage: url })}
          accept="image/*"
        />
      </div>

      {/* Before Label */}
      <MultilingualInput
        label={t('blocks.beforeAfter.beforeLabel', 'Подпись "До"')}
        value={typeof formData.beforeLabel === 'string' ? createMultilingualString(formData.beforeLabel) : (formData.beforeLabel || createMultilingualString(''))}
        onChange={(value) => onChange({ beforeLabel: value })}
        placeholder={t('blocks.beforeAfter.beforeLabelPlaceholder', 'До')}
      />

      {/* After Label */}
      <MultilingualInput
        label={t('blocks.beforeAfter.afterLabel', 'Подпись "После"')}
        value={typeof formData.afterLabel === 'string' ? createMultilingualString(formData.afterLabel) : (formData.afterLabel || createMultilingualString(''))}
        onChange={(value) => onChange({ afterLabel: value })}
        placeholder={t('blocks.beforeAfter.afterLabelPlaceholder', 'После')}
      />
    </div>
  );
}

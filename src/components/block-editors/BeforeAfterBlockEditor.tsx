import React from 'react';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { createMultilingualString } from '@/lib/i18n-helpers';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { EditorSection, EditorField } from './EditorSection';
import Type from 'lucide-react/dist/esm/icons/type';
import ImageIcon from 'lucide-react/dist/esm/icons/image';

function BeforeAfterBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <EditorSection
        title={t('editor.sections.content', 'Контент')}
        icon={<Type className="h-5 w-5 text-primary" />}
        collapsible={false}
      >
        <MultilingualInput
          label={t('blocks.beforeAfter.title', 'Заголовок')}
          value={typeof formData.title === 'string' ? createMultilingualString(formData.title) : (formData.title || createMultilingualString(''))}
          onChange={(value) => onChange({ ...formData, title: value })}
          placeholder={t('blocks.beforeAfter.titlePlaceholder', 'Результат работы')}
        />
      </EditorSection>

      <EditorSection
        title={t('blocks.beforeAfter.images', 'Изображения')}
        icon={<ImageIcon className="h-5 w-5 text-primary" />}
      >
        <EditorField label={t('blocks.beforeAfter.beforeImage', 'Фото "До"')}>
          <MediaUpload
            value={formData.beforeImage || ''}
            onChange={(url) => onChange({ ...formData, beforeImage: url })}
            accept="image/*"
          />
        </EditorField>

        <EditorField label={t('blocks.beforeAfter.afterImage', 'Фото "После"')}>
          <MediaUpload
            value={formData.afterImage || ''}
            onChange={(url) => onChange({ ...formData, afterImage: url })}
            accept="image/*"
          />
        </EditorField>

        <MultilingualInput
          label={t('blocks.beforeAfter.beforeLabel', 'Подпись "До"')}
          value={typeof formData.beforeLabel === 'string' ? createMultilingualString(formData.beforeLabel) : (formData.beforeLabel || createMultilingualString(''))}
          onChange={(value) => onChange({ ...formData, beforeLabel: value })}
          placeholder={t('blocks.beforeAfter.beforeLabelPlaceholder', 'До')}
        />

        <MultilingualInput
          label={t('blocks.beforeAfter.afterLabel', 'Подпись "После"')}
          value={typeof formData.afterLabel === 'string' ? createMultilingualString(formData.afterLabel) : (formData.afterLabel || createMultilingualString(''))}
          onChange={(value) => onChange({ ...formData, afterLabel: value })}
          placeholder={t('blocks.beforeAfter.afterLabelPlaceholder', 'После')}
        />
      </EditorSection>
    </div>
  );
}

export const BeforeAfterBlockEditor = withBlockEditor(BeforeAfterBlockEditorComponent, {});

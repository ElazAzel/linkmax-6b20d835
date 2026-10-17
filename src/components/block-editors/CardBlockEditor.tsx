import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { validateCardBlock } from '@/lib/blocks/block-validators';
import { cn } from '@/lib/utils/utils';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { EditorField } from './EditorSection';

function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 rounded-2xl bg-muted/60 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'h-10 flex-1 rounded-xl text-sm font-medium transition-colors',
            value === option.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function CardBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const set = (patch: Record<string, unknown>) => onChange({ ...formData, ...patch });

  return (
    <div className="space-y-5">
      <MultilingualInput
        label={t('fields.title', 'Заголовок')}
        value={migrateToMultilingual(formData.title)}
        onChange={(title) => set({ title })}
        required
      />
      <MultilingualInput
        label={t('cardBlock.text', 'Текст')}
        value={migrateToMultilingual(formData.text)}
        onChange={(text) => set({ text })}
        type="textarea"
      />
      <EditorField label={t('cardBlock.photo', 'Фото')}>
        <MediaUpload value={formData.image || ''} onChange={(image) => set({ image })} accept="image/*" />
      </EditorField>
      <MultilingualInput
        label={t('fields.buttonText', 'Текст кнопки')}
        value={migrateToMultilingual(formData.buttonText)}
        onChange={(buttonText) => set({ buttonText })}
      />
      <EditorField label={t('fields.url', 'Ссылка')}>
        <Input
          type="url"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          value={formData.url || ''}
          onChange={(event) => set({ url: event.target.value })}
          placeholder="https://"
          className="h-12 rounded-xl"
        />
      </EditorField>
      <EditorField label={t('cardBlock.buttonStyle', 'Кнопка')}>
        <Segmented
          label={t('cardBlock.buttonStyle', 'Кнопка')}
          value={(formData.buttonStyle as 'solid' | 'outline') || 'solid'}
          onChange={(buttonStyle) => set({ buttonStyle })}
          options={[
            { value: 'solid', label: t('cardBlock.solid', 'Залитая') },
            { value: 'outline', label: t('cardBlock.outline', 'Контур') },
          ]}
        />
      </EditorField>
    </div>
  );
}

export const CardBlockEditor = withBlockEditor(CardBlockEditorComponent, { validate: validateCardBlock });

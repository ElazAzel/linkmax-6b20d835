import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateSearchBlock } from '@/lib/block-validators';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';

function SearchBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <MultilingualInput
        label={`${t('fields.title', 'Title')} (${t('fields.optional', 'optional')})`}
        value={migrateToMultilingual(formData.title)}
        onChange={(value) => onChange({ ...formData, title: value })}
        placeholder="Ask me anything"
      />

      <MultilingualInput
        label={t('fields.placeholder', 'Placeholder Text')}
        value={migrateToMultilingual(formData.placeholder)}
        onChange={(value) => onChange({ ...formData, placeholder: value })}
        placeholder="Ask a question..."
      />
    </div>
  );
}

export const SearchBlockEditor = withBlockEditor(SearchBlockEditorComponent, {
  hint: 'AI-powered search that answers questions using Google Search',
  validate: validateSearchBlock,
  isPremium: true,
  description: 'Enable real-time internet search with AI-powered answers',
});

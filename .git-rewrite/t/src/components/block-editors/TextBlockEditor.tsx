import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';

function TextBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <MultilingualInput
        label={t('fields.content', 'Content')}
        value={migrateToMultilingual(formData.content)}
        onChange={(value) => onChange({ ...formData, content: value })}
        type="textarea"
        placeholder="Enter your text..."
        required
        enableRichText={true}
      />
      
      <div>
        <Label>{t('fields.style', 'Style')}</Label>
        <Select
          value={formData.style || 'paragraph'}
          onValueChange={(value) => onChange({ ...formData, style: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="heading">{t('fields.heading', 'Heading')}</SelectItem>
            <SelectItem value="paragraph">{t('fields.paragraph', 'Paragraph')}</SelectItem>
            <SelectItem value="quote">{t('fields.quote', 'Quote')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>{t('fields.alignment', 'Alignment')}</Label>
        <Select
          value={formData.alignment || 'left'}
          onValueChange={(value) => onChange({ ...formData, alignment: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">{t('fields.left', 'Left')}</SelectItem>
            <SelectItem value="center">{t('fields.center', 'Center')}</SelectItem>
            <SelectItem value="right">{t('fields.right', 'Right')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export const TextBlockEditor = withBlockEditor(TextBlockEditorComponent, {
  hint: 'Add text content with different styles: Heading, Paragraph, or Quote',
});

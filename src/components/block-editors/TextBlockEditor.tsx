import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { EditorSection, EditorField } from './EditorSection';
import { AlignmentButton } from './EditorUtils';
import Type from 'lucide-react/dist/esm/icons/type';
import Palette from 'lucide-react/dist/esm/icons/palette';
import Heading from 'lucide-react/dist/esm/icons/heading';
import Pilcrow from 'lucide-react/dist/esm/icons/pilcrow';
import Quote from 'lucide-react/dist/esm/icons/quote';
import AlignLeft from 'lucide-react/dist/esm/icons/align-left';
import AlignCenter from 'lucide-react/dist/esm/icons/align-center';
import AlignRight from 'lucide-react/dist/esm/icons/align-right';

function TextBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();

  const contentFilled = [
    formData.content?.ru || formData.content?.en
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <EditorSection
        title={t('editor.sections.content', 'Content')}
        icon={<Type className="h-5 w-5 text-primary" />}
        collapsible={false}
        filledCount={contentFilled}
        totalCount={1}
      >
        <MultilingualInput
          label={t('fields.content', 'Content')}
          value={migrateToMultilingual(formData.content)}
          onChange={(value) => onChange({ ...formData, content: value })}
          type="textarea"
          placeholder={t('placeholders.enterText', 'Enter your text...')}
          required
          enableRichText={true}
        />
      </EditorSection>

      <EditorSection
        title={t('editor.sections.style', 'Style')}
        icon={<Palette className="h-5 w-5 text-primary" />}
        defaultOpen={true}
      >
        <EditorField label={t('fields.style', 'Text Style')}>
          <Select
            value={formData.style || 'paragraph'}
            onValueChange={(value: string) => onChange({ ...formData, style: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="heading">
                <span className="flex items-center gap-2"><Heading className="h-4 w-4" /> {t('fields.heading', 'Heading')}</span>
              </SelectItem>
              <SelectItem value="paragraph">
                <span className="flex items-center gap-2"><Pilcrow className="h-4 w-4" /> {t('fields.paragraph', 'Paragraph')}</span>
              </SelectItem>
              <SelectItem value="quote">
                <span className="flex items-center gap-2"><Quote className="h-4 w-4" /> {t('fields.quote', 'Quote')}</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </EditorField>

        <EditorField label={t('fields.alignment', 'Alignment')}>
          <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
            <AlignmentButton
              value="left"
              current={formData.alignment || 'left'}
              icon={<AlignLeft className="h-5 w-5" />}
              label={t('fields.left', 'Left')}
              onClick={(v) => onChange({ ...formData, alignment: v })}
            />
            <AlignmentButton
              value="center"
              current={formData.alignment || 'left'}
              icon={<AlignCenter className="h-5 w-5" />}
              label={t('fields.center', 'Center')}
              onClick={(v) => onChange({ ...formData, alignment: v })}
            />
            <AlignmentButton
              value="right"
              current={formData.alignment || 'left'}
              icon={<AlignRight className="h-5 w-5" />}
              label={t('fields.right', 'Right')}
              onClick={(v) => onChange({ ...formData, alignment: v })}
            />
          </div>
        </EditorField>
      </EditorSection>
    </div>
  );
}

export const TextBlockEditor = withBlockEditor(TextBlockEditorComponent, {
  hint: 'Add text content with different styles: Heading, Paragraph, or Quote',
});

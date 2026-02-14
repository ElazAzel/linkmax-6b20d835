import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateDownloadBlock } from '@/lib/block-validators';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';

function DownloadBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <MultilingualInput
        label={t('fields.title', 'Title')}
        value={migrateToMultilingual(formData.title)}
        onChange={(value) => onChange({ ...formData, title: value })}
        placeholder="Download My File"
        required
      />

      <MultilingualInput
        label={t('fields.description', 'Description')}
        value={migrateToMultilingual(formData.description)}
        onChange={(value) => onChange({ ...formData, description: value })}
        type="textarea"
        placeholder="Brief description of the file"
      />

      <div>
        <Label>{t('fields.fileUrl', 'File URL')}</Label>
        <Input
          type="url"
          value={formData.fileUrl || ''}
          onChange={(e) => onChange({ ...formData, fileUrl: e.target.value })}
          placeholder="https://example.com/file.pdf"
        />
      </div>

      <div>
        <Label>{t('fields.fileName', 'File Name')}</Label>
        <Input
          value={formData.fileName || ''}
          onChange={(e) => onChange({ ...formData, fileName: e.target.value })}
          placeholder="document.pdf"
        />
      </div>

      <div>
        <Label>{t('fields.fileSize', 'File Size')} {t('fields.optional', '(optional)')}</Label>
        <Input
          value={formData.fileSize || ''}
          onChange={(e) => onChange({ ...formData, fileSize: e.target.value })}
          placeholder="2.5 MB"
        />
      </div>

      <div>
        <Label>{t('fields.alignment', 'Alignment')}</Label>
        <Select
          value={formData.alignment || 'center'}
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

export const DownloadBlockEditor = withBlockEditor(DownloadBlockEditorComponent, {
  hint: 'Add downloadable files like PDFs, documents, or media',
  validate: validateDownloadBlock,
});

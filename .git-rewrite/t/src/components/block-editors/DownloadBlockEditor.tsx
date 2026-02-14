import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateDownloadBlock } from '@/lib/block-validators';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { FileUpload } from '@/components/form-fields/FileUpload';
import { migrateToMultilingual } from '@/lib/i18n-helpers';

function DownloadBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  
  const handleFileInfoChange = (info: { fileName: string; fileSize: string }) => {
    onChange({ 
      ...formData, 
      fileName: info.fileName || formData.fileName,
      fileSize: info.fileSize || formData.fileSize 
    });
  };

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

      <MultilingualInput
        label={t('fields.buttonText', 'Button Text')}
        value={migrateToMultilingual(formData.buttonText)}
        onChange={(value) => onChange({ ...formData, buttonText: value })}
        placeholder={t('actions.download', 'Download')}
      />

      <FileUpload
        label={t('fields.file', 'Файл')}
        value={formData.fileUrl || ''}
        onChange={(url) => onChange({ ...formData, fileUrl: url })}
        onFileInfoChange={handleFileInfoChange}
        accept="*/*"
        maxSizeMB={50}
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('fields.fileName', 'File Name')}</Label>
          <Input
            value={formData.fileName || ''}
            onChange={(e) => onChange({ ...formData, fileName: e.target.value })}
            placeholder="document.pdf"
          />
        </div>

        <div>
          <Label>{t('fields.fileSize', 'File Size')}</Label>
          <Input
            value={formData.fileSize || ''}
            onChange={(e) => onChange({ ...formData, fileSize: e.target.value })}
            placeholder="2.5 MB"
          />
        </div>
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
  hint: 'Add downloadable files - upload directly to platform storage or use external URLs',
  validate: validateDownloadBlock,
});

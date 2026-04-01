import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateDownloadBlock } from '@/lib/blocks/block-validators';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { FileUpload } from '@/components/form-fields/FileUpload';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { EditorSection, EditorField } from './EditorSection';
import Type from 'lucide-react/dist/esm/icons/type';
import FileDown from 'lucide-react/dist/esm/icons/file-down';
import Palette from 'lucide-react/dist/esm/icons/palette';

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
      <EditorSection
        title={t('editor.sections.content', 'Контент')}
        icon={<Type className="h-5 w-5 text-primary" />}
        collapsible={false}
      >
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
      </EditorSection>

      <EditorSection
        title={t('editor.sections.file', 'Файл')}
        icon={<FileDown className="h-5 w-5 text-primary" />}
      >
        <FileUpload
          label={t('fields.file', 'Файл')}
          value={formData.fileUrl || ''}
          onChange={(url) => onChange({ ...formData, fileUrl: url })}
          onFileInfoChange={handleFileInfoChange}
          accept="*/*"
          maxSizeMB={50}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditorField label={t('fields.fileName', 'File Name')}>
            <Input
              value={formData.fileName || ''}
              onChange={(e) => onChange({ ...formData, fileName: e.target.value })}
              placeholder="document.pdf"
              className="h-12 rounded-xl"
            />
          </EditorField>

          <EditorField label={t('fields.fileSize', 'File Size')}>
            <Input
              value={formData.fileSize || ''}
              onChange={(e) => onChange({ ...formData, fileSize: e.target.value })}
              placeholder="2.5 MB"
              className="h-12 rounded-xl"
            />
          </EditorField>
        </div>
      </EditorSection>

      <EditorSection
        title={t('editor.sections.appearance', 'Внешний вид')}
        icon={<Palette className="h-5 w-5 text-primary" />}
        defaultOpen={false}
      >
        <EditorField label={t('fields.alignment', 'Alignment')}>
          <Select
            value={formData.alignment || 'center'}
            onValueChange={(value: string) => onChange({ ...formData, alignment: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">{t('fields.left', 'Left')}</SelectItem>
              <SelectItem value="center">{t('fields.center', 'Center')}</SelectItem>
              <SelectItem value="right">{t('fields.right', 'Right')}</SelectItem>
            </SelectContent>
          </Select>
        </EditorField>
      </EditorSection>
    </div>
  );
}

export const DownloadBlockEditor = withBlockEditor(DownloadBlockEditorComponent, {
  validate: validateDownloadBlock,
});

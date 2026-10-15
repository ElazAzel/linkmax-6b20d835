import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUpload } from '@/components/form-fields/FileUpload';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { getSafeAudioUrl, validateAudioUpload } from '@/lib/blocks/audio';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { EditorField } from './EditorSection';

function AudioBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const update = (values: Record<string, unknown>) => onChange({ ...formData, ...values });
  const external = formData.sourceType === 'external';
  const value = external ? formData.externalUrl : formData.fileUrl;
  return <div className="space-y-4">
    <MultilingualInput label={t('fields.title')} value={migrateToMultilingual(formData.title)} onChange={title => update({ title })} />
    <MultilingualInput label={t('fields.description')} value={migrateToMultilingual(formData.description)} onChange={description => update({ description })} type="textarea" />
    <EditorField label={t('audioBlock.source')}>
      <Select value={external ? 'external' : 'file'} onValueChange={(sourceType: string) => update({ sourceType })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="file">{t('audioBlock.file')}</SelectItem><SelectItem value="external">{t('audioBlock.musicLink')}</SelectItem></SelectContent>
      </Select>
    </EditorField>
    {external ? <EditorField label={t('audioBlock.musicLink')}><Input type="url" value={formData.externalUrl || ''} placeholder="https://…" onChange={e => update({ externalUrl: e.target.value })} /></EditorField> : <FileUpload value={formData.fileUrl || ''} onChange={fileUrl => update({ fileUrl })} accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav" maxSizeMB={50} validateFile={validateAudioUpload} bucket="page-audio" getContentType={file => /\.wav$/i.test(file.name) ? 'audio/wav' : 'audio/mpeg'} label={t('audioBlock.file')} placeholder="https://…/audio.mp3" />}
    <p className="text-xs text-muted-foreground">{t(external ? 'audioBlock.externalHint' : 'audioBlock.fileHint')}</p>
    {value && !getSafeAudioUrl(value) && <p role="alert" className="text-sm text-destructive">{t('audioBlock.invalidUrl')}</p>}
    <MediaUpload value={formData.coverUrl || ''} onChange={coverUrl => update({ coverUrl })} label={t('audioBlock.cover')} accept="image/*" />
  </div>;
}

export const AudioBlockEditor = withBlockEditor(AudioBlockEditorComponent);

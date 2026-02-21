import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateVideoBlock } from '@/lib/blocks/block-validators';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { EditorSection, EditorField } from './EditorSection';
import { Video, Youtube, Settings } from 'lucide-react';

function VideoBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();

  const contentFilled = [
    formData.url,
    formData.title?.ru || formData.title?.en
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Content Section */}
      <EditorSection
        title={t('editor.sections.content', 'Video Content')}
        icon={<Video className="h-5 w-5 text-primary" />}
        collapsible={false}
        filledCount={contentFilled}
        totalCount={2}
      >
        <MultilingualInput
          label={t('fields.title', 'Title')}
          value={migrateToMultilingual(formData.title)}
          onChange={(value) => onChange({ ...formData, title: value })}
          placeholder={t('fields.myVideoPlaceholder', 'My Video')}
        />

        <EditorField
          label={t('fields.videoUrl', 'Video URL')}
          required
          hint={t('fields.videoUrlHint', 'Supports YouTube and Vimeo URLs')}
        >
          <Input
            type="url"
            placeholder="https://youtube.com/watch?v=..."
            value={formData.url || ''}
            onChange={(e) => onChange({ ...formData, url: e.target.value })}
            className="h-12 rounded-xl"
          />
        </EditorField>
      </EditorSection>

      {/* Settings Section */}
      <EditorSection
        title={t('editor.sections.settings', 'Settings')}
        icon={<Settings className="h-5 w-5 text-primary" />}
        defaultOpen={true}
      >
        <EditorField label={t('fields.platform', 'Platform')}>
          <Select
            value={formData.platform || 'youtube'}
            onValueChange={(value: string) => onChange({ ...formData, platform: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="youtube">
                <span className="flex items-center gap-2"><Youtube className="h-4 w-4 text-red-500" /> YouTube</span>
              </SelectItem>
              <SelectItem value="vimeo">
                <span className="flex items-center gap-2"><Video className="h-4 w-4 text-blue-500" /> Vimeo</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </EditorField>

        <EditorField label={t('fields.aspectRatio', 'Aspect Ratio')}>
          <Select
            value={formData.aspectRatio || '16:9'}
            onValueChange={(value: string) => onChange({ ...formData, aspectRatio: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">{t('fields.aspectRatio169', '16:9 (Widescreen)')}</SelectItem>
              <SelectItem value="4:3">{t('fields.aspectRatio43', '4:3 (Standard)')}</SelectItem>
              <SelectItem value="1:1">{t('fields.aspectRatio11', '1:1 (Square)')}</SelectItem>
              <SelectItem value="9:16">{t('fields.aspectRatio916', '9:16 (Vertical/Shorts)')}</SelectItem>
            </SelectContent>
          </Select>
        </EditorField>
      </EditorSection>
    </div>
  );
}

export const VideoBlockEditor = withBlockEditor(VideoBlockEditorComponent, {
  hint: 'Embed YouTube or Vimeo videos with custom aspect ratios',
  validate: validateVideoBlock,
});

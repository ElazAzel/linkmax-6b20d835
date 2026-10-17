import { Input } from '@/components/ui/input';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { ImagePlacementControls } from './ImagePlacementControls';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateImageBlock } from '@/lib/blocks/block-validators';
import { useTranslation } from 'react-i18next';
import { EditorSection, EditorField } from './EditorSection';
import Image from 'lucide-react/dist/esm/icons/image';
const ImageIcon = Image;
import Link from 'lucide-react/dist/esm/icons/link';
import Palette from 'lucide-react/dist/esm/icons/palette';

function ImageBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();

  const contentFilled = [
    formData.url
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Image Content */}
      <EditorSection
        title={t('editor.sections.image', 'Image')}
        icon={<ImageIcon className="h-5 w-5 text-primary" />}
        collapsible={false}
        filledCount={contentFilled}
        totalCount={1}
      >
        <MediaUpload
          label=""
          value={formData.url || ''}
          onChange={(url) => onChange({ ...formData, url })}
          accept="image/*"
          allowGif
        />

        <EditorField
          label={`${t('fields.caption', 'Caption')} (${t('fields.optional', 'optional')})`}
        >
          <MultilingualInput
            label=""
            value={migrateToMultilingual(formData.caption)}
            onChange={(value) => onChange({ ...formData, caption: value })}
            type="textarea"
            placeholder={t('fields.captionPlaceholder', 'Add a caption for your image...')}
          />
        </EditorField>
      </EditorSection>

      <EditorSection title={t('imagePlacement.title', 'Кадрирование и положение')} defaultOpen={false}>
        <ImagePlacementControls value={formData.imagePlacement} onChange={imagePlacement => onChange({ ...formData, imagePlacement })} />
      </EditorSection>

      {/* Link Settings */}
      <EditorSection
        title={t('editor.sections.link', 'Interaction')}
        icon={<Link className="h-5 w-5 text-primary" />}
        description={t('fields.linkHint', 'Make image clickable')}
        defaultOpen={!!formData.link}
      >
        <EditorField
          label={t('fields.link', 'Link URL')}
          hint={t('fields.linkHint', 'Add a link to make the image clickable')}
        >
          <Input
            type="url"
            value={formData.link || ''}
            onChange={(e) => onChange({ ...formData, link: e.target.value })}
            placeholder="https://example.com"
            className="h-12 rounded-xl"
          />
        </EditorField>
      </EditorSection>

      {/* Style & Alt Text */}
      <EditorSection
        title={t('editor.sections.imageSeo', 'Описание для поиска')}
        icon={<Palette className="h-5 w-5 text-primary" />}
        defaultOpen={false}
      >
        <EditorField
          label={t('fields.altText', 'Описание фото')}
          hint={t('fields.altHint', 'Помогает поиску и незрячим посетителям')}
        >
          <MultilingualInput
            label=""
            value={migrateToMultilingual(formData.alt)}
            onChange={(value) => onChange({ ...formData, alt: value })}
            placeholder={t('fields.altPlaceholder', 'Что на фото')}
          />
        </EditorField>
      </EditorSection>
    </div>
  );
}

export const ImageBlockEditor = withBlockEditor(ImageBlockEditorComponent, {
  hint: 'Фото занимает всю ширину блока. Добавьте ссылку, чтобы фото открывало её.',
  validate: validateImageBlock,
});

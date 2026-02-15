import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateImageBlock } from '@/lib/block-validators';
import { useTranslation } from 'react-i18next';
import { EditorSection, EditorField } from './EditorSection';
import { AlignmentButton } from './EditorUtils';
import {
  Image as ImageIcon,
  Link,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type
} from 'lucide-react';

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
        title={t('editor.sections.style', 'Style & SEO')}
        icon={<Palette className="h-5 w-5 text-primary" />}
        defaultOpen={false}
      >
        <EditorField label={t('fields.imageStyle', 'Image Style')}>
          <Select
            value={formData.style || 'default'}
            onValueChange={(value: string) => onChange({ ...formData, style: value })}
            modal={false}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">{t('imageStyles.default', 'Default - Rounded Corners')}</SelectItem>
              <SelectItem value="banner">{t('imageStyles.banner', 'Banner - Full Width')}</SelectItem>
              <SelectItem value="polaroid">{t('imageStyles.polaroid', 'Polaroid - Vintage Frame')}</SelectItem>
              <SelectItem value="vignette">{t('imageStyles.vignette', 'Vignette - Soft Edges')}</SelectItem>
              <SelectItem value="circle">{t('imageStyles.circle', 'Circle - Round Crop')}</SelectItem>
            </SelectContent>
          </Select>
        </EditorField>

        <EditorField label={t('fields.imageScale', 'Image Scale')}>
          <Select
            value={formData.scale || 'cover'}
            onValueChange={(value: any) => onChange({ ...formData, scale: value })}
            modal={false}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">{t('imageScales.cover', 'Fill (Cover)')}</SelectItem>
              <SelectItem value="contain">{t('imageScales.contain', 'Fit (Contain)')}</SelectItem>
              <SelectItem value="fill">{t('imageScales.fill', 'Stretch')}</SelectItem>
              <SelectItem value="tile">{t('imageScales.tile', 'Tile')}</SelectItem>
            </SelectContent>
          </Select>
        </EditorField>

        <EditorField label={t('fields.alignment', 'Alignment')}>
          <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
            <AlignmentButton
              value="left"
              current={formData.alignment || 'center'}
              icon={<AlignLeft className="h-5 w-5" />}
              label={t('fields.left', 'Left')}
              onClick={(v) => onChange({ ...formData, alignment: v })}
            />
            <AlignmentButton
              value="center"
              current={formData.alignment || 'center'}
              icon={<AlignCenter className="h-5 w-5" />}
              label={t('fields.center', 'Center')}
              onClick={(v) => onChange({ ...formData, alignment: v })}
            />
            <AlignmentButton
              value="right"
              current={formData.alignment || 'center'}
              icon={<AlignRight className="h-5 w-5" />}
              label={t('fields.right', 'Right')}
              onClick={(v) => onChange({ ...formData, alignment: v })}
            />
          </div>
        </EditorField>

        <EditorField
          label={t('fields.altText', 'Alt Text')}
          hint="Important for SEO and accessibility"
        >
          <MultilingualInput
            label=""
            value={migrateToMultilingual(formData.alt)}
            onChange={(value) => onChange({ ...formData, alt: value })}
            placeholder={t('fields.altPlaceholder', 'Image description for accessibility')}
          />
        </EditorField>
      </EditorSection>
    </div>
  );
}

export const ImageBlockEditor = withBlockEditor(ImageBlockEditorComponent, {
  hint: 'Add images with different styles: Banner (full width), Polaroid, Vignette, Circle, or Default. Add a link to make the image clickable.',
  validate: validateImageBlock,
});
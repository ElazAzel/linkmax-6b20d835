import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateImageBlock } from '@/lib/block-validators';
import { useTranslation } from 'react-i18next';

function ImageBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <MediaUpload
        label={t('fields.imageUrl', 'Image')}
        value={formData.url || ''}
        onChange={(url) => onChange({ ...formData, url })}
        accept="image/*"
      />

      <div>
        <Label>{t('fields.altText', 'Alt Text')}</Label>
        <Input
          value={formData.alt || ''}
          onChange={(e) => onChange({ ...formData, alt: e.target.value })}
          placeholder={t('fields.altPlaceholder', 'Image description for accessibility')}
        />
      </div>

      <div>
        <Label>{t('fields.caption', 'Caption')} ({t('fields.optional', 'optional')})</Label>
        <Textarea
          value={formData.caption || ''}
          onChange={(e) => onChange({ ...formData, caption: e.target.value })}
          placeholder={t('fields.captionPlaceholder', 'Add a caption for your image...')}
          rows={2}
        />
      </div>

      <div>
        <Label>{t('fields.imageStyle', 'Image Style')}</Label>
        <Select
          value={formData.style || 'default'}
          onValueChange={(value) => onChange({ ...formData, style: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">{t('imageStyles.default', 'Default - Rounded Corners')}</SelectItem>
            <SelectItem value="polaroid">{t('imageStyles.polaroid', 'Polaroid - Vintage Frame')}</SelectItem>
            <SelectItem value="vignette">{t('imageStyles.vignette', 'Vignette - Soft Edges')}</SelectItem>
            <SelectItem value="circle">{t('imageStyles.circle', 'Circle - Round Crop')}</SelectItem>
          </SelectContent>
        </Select>
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

export const ImageBlockEditor = withBlockEditor(ImageBlockEditorComponent, {
  hint: 'Add images with different styles: Polaroid, Vignette, Circle, or Default',
  validate: validateImageBlock,
});

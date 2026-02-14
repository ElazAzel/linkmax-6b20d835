import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateCarouselBlock } from '@/lib/block-validators';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

function CarouselBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const images = formData.images || [];

  const addImage = () => {
    onChange({
      ...formData,
      images: [...images, { url: '', alt: '', link: '' }],
    });
  };

  const removeImage = (index: number) => {
    onChange({
      ...formData,
      images: images.filter((_: any, i: number) => i !== index),
    });
  };

  const updateImage = (index: number, field: string, value: string) => {
    const updated = [...images];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...formData, images: updated });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>{t('fields.title', 'Title')} ({t('fields.optional', 'optional')})</Label>
        <Input
          value={formData.title || ''}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>{t('fields.images', 'Images')}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addImage}>
            {t('actions.addImage', 'Add Image')}
          </Button>
        </div>

        {images.map((image: any, index: number) => (
          <div key={index} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t('fields.image', 'Image')} {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeImage(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <MediaUpload
              value={image.url}
              onChange={(url) => updateImage(index, 'url', url)}
              accept="image/*"
            />

            <div>
              <Label className="text-xs">{t('fields.altText', 'Alt Text')}</Label>
              <Input
                value={image.alt}
                onChange={(e) => updateImage(index, 'alt', e.target.value)}
                placeholder={t('fields.imageDescription', 'Image description')}
              />
            </div>

            <div>
              <Label className="text-xs">{t('fields.link', 'Link')} ({t('fields.optional', 'optional')})</Label>
              <Input
                type="url"
                value={image.link || ''}
                onChange={(e) => updateImage(index, 'link', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="autoPlay"
          checked={formData.autoPlay || false}
          onChange={(e) => onChange({ ...formData, autoPlay: e.target.checked })}
          className="h-4 w-4"
        />
        <Label htmlFor="autoPlay" className="cursor-pointer">{t('fields.autoPlay', 'Auto-play')}</Label>
      </div>

      {formData.autoPlay && (
        <div>
          <Label>{t('fields.interval', 'Interval')} (ms)</Label>
          <Input
            type="number"
            value={formData.interval || 3000}
            onChange={(e) => onChange({ ...formData, interval: parseInt(e.target.value) })}
            min="1000"
            step="500"
          />
        </div>
      )}
    </div>
  );
}

export const CarouselBlockEditor = withBlockEditor(CarouselBlockEditorComponent, {
  hint: 'Create an image gallery carousel with auto-play option',
  validate: validateCarouselBlock,
});

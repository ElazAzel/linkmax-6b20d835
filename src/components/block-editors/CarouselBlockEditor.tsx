import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateCarouselBlock } from '@/lib/blocks/block-validators';
import { useTranslation } from 'react-i18next';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { EditorSection, EditorField } from './EditorSection';
import Type from 'lucide-react/dist/esm/icons/type';
import Settings from 'lucide-react/dist/esm/icons/settings';

import { CarouselBlock } from '@/types/page';

interface CarouselImage {
  url: string;
  alt: any;
  link?: string;
}

function CarouselBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const data = formData as Partial<CarouselBlock>;
  const images = data.images || [];
  const handleChange = (updates: Partial<CarouselBlock>) => onChange(updates);

  const addImage = () => handleChange({ ...data, images: [...images, { url: '', alt: { ru: '', en: '', kk: '' }, link: '' }] });
  const removeImage = (index: number) => handleChange({ ...data, images: images.filter((_, i) => i !== index) });
  const updateImage = (index: number, field: keyof CarouselImage, value: any) => {
    const updated = [...images];
    updated[index] = { ...updated[index], [field]: value };
    handleChange({ ...data, images: updated });
  };

  return (
    <div className="space-y-4">
      <EditorSection
        title={t('editor.sections.content', 'Контент')}
        icon={<Type className="h-5 w-5 text-primary" />}
        collapsible={false}
      >
        <MultilingualInput
          label={`${t('fields.title', 'Title')} (${t('fields.optional', 'optional')})`}
          value={migrateToMultilingual(data.title)}
          onChange={(value) => handleChange({ ...data, title: value })}
          placeholder="Gallery"
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('fields.images', 'Images')}</span>
            <Button type="button" variant="outline" size="sm" onClick={addImage}>{t('actions.addImage', 'Add Image')}</Button>
          </div>

          {images.map((image, index) => (
            <div key={index} className="border border-border/30 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('fields.image', 'Image')} {index + 1}</span>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeImage(index)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <MediaUpload value={image.url} onChange={(url) => updateImage(index, 'url', url)} accept="image/*" />
              <MultilingualInput
                label={t('fields.altText', 'Alt Text')}
                value={migrateToMultilingual(image.alt)}
                onChange={(value) => updateImage(index, 'alt', value)}
                placeholder={t('fields.imageDescription', 'Image description')}
              />
              <EditorField label={`${t('fields.link', 'Link')} (${t('fields.optional', 'optional')})`}>
                <Input type="url" value={image.link || ''} onChange={(e) => updateImage(index, 'link', e.target.value)} placeholder="https://example.com" className="h-12 rounded-xl" />
              </EditorField>
            </div>
          ))}
        </div>
      </EditorSection>

      <EditorSection
        title={t('editor.sections.settings', 'Настройки')}
        icon={<Settings className="h-5 w-5 text-primary" />}
        defaultOpen={false}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t('fields.autoPlay', 'Auto-play')}</span>
          <Switch
            checked={data.autoPlay || false}
            onCheckedChange={(checked) => handleChange({ ...data, autoPlay: checked })}
          />
        </div>

        {data.autoPlay && (
          <EditorField label={`${t('fields.interval', 'Interval')} (ms)`}>
            <Input
              type="number"
              value={data.interval || 3000}
              onChange={(e) => handleChange({ ...data, interval: parseInt(e.target.value) })}
              min="1000"
              step="500"
              className="h-12 rounded-xl"
            />
          </EditorField>
        )}
      </EditorSection>
    </div>
  );
}

export const CarouselBlockEditor = withBlockEditor(CarouselBlockEditorComponent, {
  validate: validateCarouselBlock,
});

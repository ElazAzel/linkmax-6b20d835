import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateButtonBlock } from '@/lib/block-validators';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { Maximize2, Square, Minus } from 'lucide-react';
function ButtonBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <MultilingualInput
        label={t('fields.title', 'Title')}
        value={migrateToMultilingual(formData.title)}
        onChange={(value) => onChange({ ...formData, title: value })}
        placeholder={t('placeholders.buttonText', 'Button text')}
        required
      />

      <div>
        <Label>URL</Label>
        <Input
          type="url"
          value={formData.url || ''}
          onChange={(e) => onChange({ ...formData, url: e.target.value })}
          placeholder="https://example.com"
        />
      </div>

      <div>
        <Label>{t('fields.hoverEffect', 'Hover Effect')}</Label>
        <Select
          value={formData.hoverEffect || 'none'}
          onValueChange={(value) => onChange({ ...formData, hoverEffect: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('fields.none', 'None')}</SelectItem>
            <SelectItem value="glow">{t('fields.glow', 'Glow')}</SelectItem>
            <SelectItem value="scale">{t('fields.scale', 'Scale')}</SelectItem>
            <SelectItem value="shadow">{t('fields.shadow', 'Shadow')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-4">
        <Label>{t('fields.backgroundType', 'Background Type')}</Label>
        <Select
          value={formData.background?.type || 'solid'}
          onValueChange={(value) =>
            onChange({
              ...formData,
              background: { ...formData.background, type: value },
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">{t('fields.solidColor', 'Solid Color')}</SelectItem>
            <SelectItem value="gradient">{t('fields.gradient', 'Gradient')}</SelectItem>
            <SelectItem value="image">{t('fields.image', 'Image')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.background?.type === 'solid' && (
        <div>
          <Label>{t('fields.backgroundColor', 'Background Color')}</Label>
          <Input
            type="color"
            value={formData.background?.value || '#000000'}
            onChange={(e) =>
              onChange({
                ...formData,
                background: { ...formData.background, value: e.target.value },
              })
            }
          />
        </div>
      )}

      {formData.background?.type === 'gradient' && (
        <>
          <div>
            <Label>{t('fields.gradientColors', 'Gradient Colors')}</Label>
            <Input
              value={formData.background?.value || ''}
              onChange={(e) =>
                onChange({
                  ...formData,
                  background: { ...formData.background, value: e.target.value },
                })
              }
              placeholder="#ff0000, #0000ff"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('fields.enterCommaSeparatedColors', 'Enter comma-separated colors')}
            </p>
          </div>
          <div>
            <Label>{t('fields.gradientAngle', 'Gradient Angle (degrees)')}</Label>
            <Input
              type="number"
              value={formData.background?.gradientAngle || 135}
              onChange={(e) =>
                onChange({
                  ...formData,
                  background: {
                    ...formData.background,
                    gradientAngle: parseInt(e.target.value),
                  },
                })
              }
              min="0"
              max="360"
            />
          </div>
        </>
      )}

      {formData.background?.type === 'image' && (
        <MediaUpload
          label={t('fields.backgroundImage', 'Background Image')}
          value={formData.background?.value || ''}
          onChange={(value) =>
            onChange({
              ...formData,
              background: { ...formData.background, value },
            })
          }
          accept="image/*"
        />
      )}

      <div>
        <Label>{t('fields.width', 'Width')}</Label>
        <Select
          value={formData.width || 'medium'}
          onValueChange={(value) => onChange({ ...formData, width: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">
              <span className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                {t('fields.fullWidth', 'Full Width')}
              </span>
            </SelectItem>
            <SelectItem value="medium">
              <span className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                {t('fields.mediumWidth', 'Medium')}
              </span>
            </SelectItem>
            <SelectItem value="small">
              <span className="flex items-center gap-2">
                <Minus className="h-4 w-4" />
                {t('fields.smallWidth', 'Small')}
              </span>
            </SelectItem>
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

export const ButtonBlockEditor = withBlockEditor(ButtonBlockEditorComponent, {
  hint: 'Create custom buttons with gradients, images, and hover effects',
  validate: validateButtonBlock,
});

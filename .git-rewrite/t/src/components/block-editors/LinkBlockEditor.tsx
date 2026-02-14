import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { AIButton } from '@/components/form-fields/AIButton';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { generateMagicTitle } from '@/lib/ai-helpers';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateLinkBlock } from '@/lib/block-validators';
function LinkBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const [aiLoading, setAiLoading] = useState(false);

  const handleGenerateTitle = async () => {
    if (!formData.url) return;
    
    setAiLoading(true);
    try {
      const title = await generateMagicTitle(formData.url);
      onChange({ ...formData, title: { ru: title, en: '', kk: '' } });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>URL</Label>
        <Input
          type="url"
          value={formData.url || ''}
          onChange={(e) => onChange({ ...formData, url: e.target.value })}
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Заголовок</Label>
          <AIButton
            onClick={handleGenerateTitle}
            loading={aiLoading}
            disabled={!formData.url}
            title="Generate with AI"
            variant="icon"
          />
        </div>
        <MultilingualInput
          label=""
          value={migrateToMultilingual(formData.title)}
          onChange={(value) => onChange({ ...formData, title: value })}
          required
        />
      </div>
      
      <div>
        <Label>Icon</Label>
        <Select
          value={formData.icon || 'globe'}
          onValueChange={(value) => onChange({ ...formData, icon: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="globe">Globe</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Button Style</Label>
        <Select
          value={formData.style || 'default'}
          onValueChange={(value) => onChange({ ...formData, style: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default</SelectItem>
            <SelectItem value="rounded">Rounded</SelectItem>
            <SelectItem value="pill">Pill (Fully Rounded)</SelectItem>
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
    </div>
  );
}

export const LinkBlockEditor = withBlockEditor(LinkBlockEditorComponent, {
  hint: 'Add clickable links to any external page or resource',
  validate: validateLinkBlock,
});

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencySelect } from '@/components/form-fields/CurrencySelect';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { generateSalesCopy } from '@/lib/ai-helpers';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateProductBlock } from '@/lib/blocks/block-validators';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual, getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { useDashboard } from '@/hooks/dashboard/useDashboard';
import { getRandomSuggestion } from '@/lib/intelligence/writing-algorithm';
import { toast } from 'sonner';
import { AIButton } from '@/components/form-fields/AIButton';
import { EditorSection, EditorField } from './EditorSection';
import Type from 'lucide-react/dist/esm/icons/type';
import Palette from 'lucide-react/dist/esm/icons/palette';

function ProductBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t, i18n } = useTranslation();
  const [aiLoading, setAiLoading] = useState(false);
  const { pageData } = useDashboard();
  const niche = pageData?.niche || 'general';
  const currentLang = i18n.language as SupportedLanguage;

  const handleMagicWandName = () => {
    const suggestion = getRandomSuggestion(niche, 'product_name');
    const currentName = migrateToMultilingual(formData.name);
    onChange({ ...formData, name: { ...currentName, [currentLang]: suggestion } });
    toast.success(t('ai.suggestionApplied', 'Предложение примененно'));
  };

  const handleMagicWandDescription = () => {
    const suggestion = getRandomSuggestion(niche, 'product_description');
    const currentDesc = migrateToMultilingual(formData.description);
    onChange({ ...formData, description: { ...currentDesc, [currentLang]: suggestion } });
    toast.success(t('ai.suggestionApplied', 'Предложение примененно'));
  };

  const handleGenerateCopy = async () => {
    const name = getI18nText(formData.name, i18n.language as SupportedLanguage);
    if (!name || !formData.price) return;

    setAiLoading(true);
    try {
      const description = await generateSalesCopy({
        productName: name,
        price: formData.price,
        currency: formData.currency || 'KZT',
      });
      const currentDesc = migrateToMultilingual(formData.description);
      onChange({
        ...formData,
        description: {
          ...currentDesc,
          [i18n.language]: description
        }
      });
    } finally {
      setAiLoading(false);
    }
  };

  const productName = getI18nText(formData.name, i18n.language as SupportedLanguage);

  return (
    <div className="space-y-4">
      <EditorSection
        title={t('editor.sections.content', 'Контент')}
        icon={<Type className="h-5 w-5 text-primary" />}
        collapsible={false}
      >
        <MultilingualInput
          label={t('fields.productName', 'Product Name')}
          value={migrateToMultilingual(formData.name)}
          onChange={(value) => onChange({ ...formData, name: value })}
          onMagicWand={handleMagicWandName}
          placeholder={t('fields.productNamePlaceholder', 'Product Name')}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditorField label={t('fields.price', 'Price')} required>
            <Input
              type="number"
              value={formData.price || ''}
              onChange={(e) => onChange({ ...formData, price: parseFloat(e.target.value) })}
              className="h-12 rounded-xl"
            />
          </EditorField>
          <EditorField label={t('fields.currency', 'Currency')}>
            <CurrencySelect
              value={formData.currency || 'KZT'}
              onValueChange={(value: string) => onChange({ ...formData, currency: value })}
            />
          </EditorField>
        </div>

        <MultilingualInput
          label={t('fields.description', 'Description')}
          value={migrateToMultilingual(formData.description)}
          onChange={(value) => onChange({ ...formData, description: value })}
          onMagicWand={handleMagicWandDescription}
          type="textarea"
          placeholder={t('fields.productDescPlaceholder', 'Product description...')}
        />

        <AIButton
          onClick={handleGenerateCopy}
          loading={aiLoading}
          disabled={!productName || !formData.price}
          variant="full"
          title={t('ai.generateDescription', 'Generate with AI')}
        />

        <MediaUpload
          label={t('fields.productImage', 'Product Image') + ` (${t('fields.optional', 'optional')})`}
          value={formData.image || ''}
          onChange={(image) => onChange({ ...formData, image })}
          accept="image/*"
        />

        <EditorField label={`${t('fields.buyLink', 'Buy Link')} (${t('fields.optional', 'optional')})`}>
          <Input
            type="url"
            value={formData.buyLink || ''}
            onChange={(e) => onChange({ ...formData, buyLink: e.target.value })}
            className="h-12 rounded-xl"
          />
        </EditorField>

        <MultilingualInput
          label={t('fields.buttonText', 'Button Text')}
          value={migrateToMultilingual(formData.buttonText)}
          onChange={(value) => onChange({ ...formData, buttonText: value })}
          placeholder={t('actions.buy', 'Buy')}
        />
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

        <EditorField label={t('fields.backgroundType', 'Background Type')}>
          <Select
            value={formData.background?.type || 'none'}
            onValueChange={(value: string) =>
              onChange({
                ...formData,
                background: value === 'none' ? undefined : { ...formData.background, type: value },
              })
            }
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('fields.none', 'None')}</SelectItem>
              <SelectItem value="solid">{t('fields.solidColor', 'Solid Color')}</SelectItem>
              <SelectItem value="gradient">{t('fields.gradient', 'Gradient')}</SelectItem>
              <SelectItem value="image">{t('fields.image', 'Image')}</SelectItem>
            </SelectContent>
          </Select>
        </EditorField>

        {formData.background?.type === 'solid' && (
          <EditorField label={t('fields.backgroundColor', 'Background Color')}>
            <Input
              type="color"
              value={formData.background?.value || '#ffffff'}
              onChange={(e) =>
                onChange({
                  ...formData,
                  background: { ...formData.background, value: e.target.value },
                })
              }
              className="h-12 w-16 rounded-xl p-1 cursor-pointer"
            />
          </EditorField>
        )}

        {formData.background?.type === 'gradient' && (
          <>
            <EditorField
              label={t('fields.gradientColors', 'Gradient Colors')}
              hint={t('fields.enterCommaSeparatedColors', 'Enter comma-separated colors')}
            >
              <Input
                value={formData.background?.value || ''}
                onChange={(e) =>
                  onChange({
                    ...formData,
                    background: { ...formData.background, value: e.target.value },
                  })
                }
                placeholder="#ff0000, #0000ff"
                className="h-12 rounded-xl"
              />
            </EditorField>
            <EditorField label={t('fields.gradientAngle', 'Gradient Angle (degrees)')}>
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
                className="h-12 rounded-xl"
              />
            </EditorField>
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
      </EditorSection>
    </div>
  );
}

export const ProductBlockEditor = withBlockEditor(ProductBlockEditorComponent, {
  validate: validateProductBlock,
});

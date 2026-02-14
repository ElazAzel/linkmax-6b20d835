import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIButton } from '@/components/form-fields/AIButton';
import { CurrencySelect } from '@/components/form-fields/CurrencySelect';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { generateSalesCopy } from '@/lib/ai-helpers';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateProductBlock } from '@/lib/block-validators';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual, getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';

function ProductBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t, i18n } = useTranslation();
  const [aiLoading, setAiLoading] = useState(false);

  const handleGenerateCopy = async () => {
    const name = getTranslatedString(formData.name, i18n.language as SupportedLanguage);
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

  const productName = getTranslatedString(formData.name, i18n.language as SupportedLanguage);

  return (
    <div className="space-y-4">
      <MultilingualInput
        label={t('fields.productName', 'Product Name')}
        value={migrateToMultilingual(formData.name)}
        onChange={(value) => onChange({ ...formData, name: value })}
        placeholder="Product Name"
        required
      />
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>{t('fields.price', 'Price')}</Label>
          <Input
            type="number"
            value={formData.price || ''}
            onChange={(e) => onChange({ ...formData, price: parseFloat(e.target.value) })}
          />
        </div>
        <div>
          <Label>{t('fields.currency', 'Currency')}</Label>
          <CurrencySelect
            value={formData.currency || 'KZT'}
            onValueChange={(value) => onChange({ ...formData, currency: value })}
          />
        </div>
      </div>
      
      <div>
        <MultilingualInput
          label={t('fields.description', 'Description')}
          value={migrateToMultilingual(formData.description)}
          onChange={(value) => onChange({ ...formData, description: value })}
          type="textarea"
          placeholder="Product description..."
        />
        <div className="mt-2">
          <AIButton
            onClick={handleGenerateCopy}
            loading={aiLoading}
            disabled={!productName || !formData.price}
            variant="full"
            title={t('ai.generateDescription', 'Generate with AI')}
          />
        </div>
      </div>
      
      <MediaUpload
        label={t('fields.productImage', 'Product Image') + ` (${t('fields.optional', 'optional')})`}
        value={formData.image || ''}
        onChange={(image) => onChange({ ...formData, image })}
        accept="image/*"
      />
      
      <div>
        <Label>{t('fields.buyLink', 'Buy Link')} ({t('fields.optional', 'optional')})</Label>
        <Input
          type="url"
          value={formData.buyLink || ''}
          onChange={(e) => onChange({ ...formData, buyLink: e.target.value })}
        />
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

export const ProductBlockEditor = withBlockEditor(ProductBlockEditorComponent, {
  hint: 'Create a product showcase with pricing and buy link',
  validate: validateProductBlock,
});

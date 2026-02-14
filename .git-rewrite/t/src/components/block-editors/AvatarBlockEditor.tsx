import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import type { AvatarBlock, AvatarFrameStyle } from '@/types/page';
import { withBlockEditor } from './BlockEditorWrapper';
import { useTranslation } from 'react-i18next';
import { FrameGridSelector } from '@/components/editor/FramePreview';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface AvatarBlockEditorProps {
  formData: AvatarBlock;
  onChange: (data: Partial<AvatarBlock>) => void;
}

function AvatarBlockEditorComponent({ formData, onChange }: AvatarBlockEditorProps) {
  const { t } = useTranslation();
  const [frameOpen, setFrameOpen] = useState(false);
  
  return (
    <div className="space-y-4">
      <MediaUpload
        label={t('fields.imageUrl', 'Image URL') + ' *'}
        value={formData.imageUrl}
        onChange={(imageUrl) => onChange({ imageUrl })}
        accept="image/*"
        allowGif={true}
      />

      <MultilingualInput
        label={t('fields.name', 'Name')}
        value={migrateToMultilingual(formData.name)}
        onChange={(value) => onChange({ name: value })}
        required
      />

      <MultilingualInput
        label={t('fields.subtitle', 'Subtitle') + ` (${t('fields.optional', 'optional')})`}
        value={migrateToMultilingual(formData.subtitle)}
        onChange={(value) => onChange({ subtitle: value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('fields.size', 'Size')}</Label>
          <Select
            value={formData.size || 'medium'}
            onValueChange={(value: 'small' | 'medium' | 'large' | 'xlarge') => onChange({ size: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">{t('sizes.small', 'Small')}</SelectItem>
              <SelectItem value="medium">{t('sizes.medium', 'Medium')}</SelectItem>
              <SelectItem value="large">{t('sizes.large', 'Large')}</SelectItem>
              <SelectItem value="xlarge">{t('sizes.xlarge', 'Extra Large')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('fields.shape', 'Shape')}</Label>
          <Select
            value={formData.shape || 'circle'}
            onValueChange={(value: 'circle' | 'rounded' | 'square') => onChange({ shape: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="circle">{t('shapes.circle', 'Circle')}</SelectItem>
              <SelectItem value="rounded">{t('shapes.rounded', 'Rounded')}</SelectItem>
              <SelectItem value="square">{t('shapes.square', 'Square')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('fields.shadow', 'Shadow')}</Label>
        <Select
          value={formData.shadow || 'soft'}
          onValueChange={(value: 'none' | 'soft' | 'medium' | 'strong' | 'glow') => onChange({ shadow: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t('shadows.none', 'No Shadow')}</SelectItem>
            <SelectItem value="soft">{t('shadows.soft', 'Soft')}</SelectItem>
            <SelectItem value="medium">{t('shadows.medium', 'Medium')}</SelectItem>
            <SelectItem value="strong">{t('shadows.strong', 'Strong')}</SelectItem>
            <SelectItem value="glow">{t('shadows.glow', 'Glow')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Collapsible open={frameOpen} onOpenChange={setFrameOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
          <span>{t('fields.frameStyle', 'Frame Style')}</span>
          <ChevronDown className={`h-4 w-4 transition-transform ${frameOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border rounded-lg bg-muted/30 mt-2">
            <FrameGridSelector
              value={(formData.frameStyle || 'none') as AvatarFrameStyle}
              onChange={(value) => onChange({ frameStyle: value as AvatarFrameStyle, border: value !== 'none' })}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-2">
        <Label>{t('fields.alignment', 'Alignment')}</Label>
        <Select
          value={formData.alignment || 'center'}
          onValueChange={(value: 'left' | 'center' | 'right') => onChange({ alignment: value })}
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

export const AvatarBlockEditor = withBlockEditor(
  AvatarBlockEditorComponent,
  {
    validate: (data) => {
      if (!data.imageUrl || data.imageUrl.trim() === '') {
        return 'Image URL is required';
      }
      const nameStr = typeof data.name === 'string' ? data.name : data.name?.ru || '';
      if (!nameStr || nameStr.trim() === '') {
        return 'Name is required';
      }
      return null;
    }
  }
);

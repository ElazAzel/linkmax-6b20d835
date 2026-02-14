import type { MapBlock } from '@/types/page';
import { withBlockEditor } from './BlockEditorWrapper';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { type MultilingualString } from '@/lib/i18n-helpers';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MapBlockEditorProps {
  formData: MapBlock;
  onChange: (data: Partial<MapBlock>) => void;
}

function MapBlockEditorComponent({ formData, onChange }: MapBlockEditorProps) {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <MultilingualInput
          label={t('mapBlock.address', 'Адрес')}
          value={formData.address as MultilingualString || { ru: '', en: '', kk: '' }}
          onChange={(value) => onChange({ address: value })}
          placeholder={t('mapBlock.addressPlaceholder', 'Алматы, ул. Абая 150')}
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {t('mapBlock.hint', 'Введите адрес — карта найдёт место автоматически')}
        </p>
      </div>
    </div>
  );
}

export const MapBlockEditor = withBlockEditor(
  MapBlockEditorComponent,
  {
    validate: (data) => {
      const address = data.address;
      if (!address) return 'enterAddress';
      
      if (typeof address === 'object') {
        const hasValue = address.ru || address.en || address.kk;
        if (!hasValue) return 'enterAddress';
      } else if (!address.trim()) {
        return 'enterAddress';
      }
      
      return null;
    }
  }
);

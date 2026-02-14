import type { MapBlock } from '@/types/page';
import { withBlockEditor } from './BlockEditorWrapper';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { type MultilingualString } from '@/lib/i18n-helpers';
import { MapPin } from 'lucide-react';

interface MapBlockEditorProps {
  formData: MapBlock;
  onChange: (data: Partial<MapBlock>) => void;
}

function MapBlockEditorComponent({ formData, onChange }: MapBlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <MultilingualInput
          label="Адрес"
          value={formData.address as MultilingualString || { ru: '', en: '', kk: '' }}
          onChange={(value) => onChange({ address: value })}
          placeholder="Алматы, ул. Абая 150"
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          Введите адрес — карта найдёт место автоматически
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
      if (!address) return 'Введите адрес';
      
      if (typeof address === 'object') {
        const hasValue = address.ru || address.en || address.kk;
        if (!hasValue) return 'Введите адрес';
      } else if (!address.trim()) {
        return 'Введите адрес';
      }
      
      return null;
    }
  }
);

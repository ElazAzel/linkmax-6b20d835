import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MapBlock } from '@/types/page';
import { withBlockEditor } from './BlockEditorWrapper';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MapBlockEditorProps {
  formData: MapBlock;
  onChange: (data: Partial<MapBlock>) => void;
}

function MapBlockEditorComponent({ formData, onChange }: MapBlockEditorProps) {
  const getPlaceholderUrl = () => {
    if (formData.provider === 'google') {
      return 'https://www.google.com/maps/embed?pb=...';
    }
    return 'https://yandex.ru/map-widget/v1/?...';
  };

  const getInstructions = () => {
    if (formData.provider === 'google') {
      return 'Перейдите на Google Maps, найдите место, нажмите "Поделиться" → "Встроить карту" и скопируйте ссылку из iframe';
    }
    return 'Перейдите на Яндекс.Карты, найдите место, нажмите "Поделиться" → "HTML-код" и скопируйте ссылку из src';
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Заголовок (опционально)</Label>
        <Input
          placeholder="Наш офис"
          value={formData.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Провайдер карты</Label>
        <Select
          value={formData.provider}
          onValueChange={(value: 'google' | 'yandex') => onChange({ provider: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="google">Google Maps</SelectItem>
            <SelectItem value="yandex">Яндекс.Карты</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="text-xs">
          {getInstructions()}
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label>Ссылка для встраивания *</Label>
        <Textarea
          placeholder={getPlaceholderUrl()}
          value={formData.embedUrl}
          onChange={(e) => onChange({ embedUrl: e.target.value })}
          rows={3}
          className="font-mono text-xs"
        />
      </div>

      <div className="space-y-2">
        <Label>Адрес (опционально)</Label>
        <Input
          placeholder="ул. Примерная, 123, Москва"
          value={formData.address || ''}
          onChange={(e) => onChange({ address: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Высота карты</Label>
        <Select
          value={formData.height || 'medium'}
          onValueChange={(value: 'small' | 'medium' | 'large') => onChange({ height: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Маленькая (192px)</SelectItem>
            <SelectItem value="medium">Средняя (256px)</SelectItem>
            <SelectItem value="large">Большая (384px)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export const MapBlockEditor = withBlockEditor(
  MapBlockEditorComponent,
  {
    validate: (data) => {
      if (!data.embedUrl || data.embedUrl.trim() === '') {
        return 'Ссылка для встраивания обязательна';
      }
      return null;
    }
  }
);

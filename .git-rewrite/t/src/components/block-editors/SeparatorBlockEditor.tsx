import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { SeparatorBlock } from '@/types/page';
import { withBlockEditor } from './BlockEditorWrapper';

interface SeparatorBlockEditorProps {
  formData: SeparatorBlock;
  onChange: (data: Partial<SeparatorBlock>) => void;
}

function SeparatorBlockEditorComponent({ formData, onChange }: SeparatorBlockEditorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Стиль линии</Label>
        <Select
          value={formData.variant || 'solid'}
          onValueChange={(value: 'solid' | 'dashed' | 'dotted' | 'gradient') => onChange({ variant: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Сплошная</SelectItem>
            <SelectItem value="dashed">Пунктирная</SelectItem>
            <SelectItem value="dotted">Точечная</SelectItem>
            <SelectItem value="gradient">Градиент</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Толщина</Label>
          <Select
            value={formData.thickness || 'thin'}
            onValueChange={(value: 'thin' | 'medium' | 'thick') => onChange({ thickness: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thin">Тонкая</SelectItem>
              <SelectItem value="medium">Средняя</SelectItem>
              <SelectItem value="thick">Толстая</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ширина</Label>
          <Select
            value={formData.width || 'full'}
            onValueChange={(value: 'full' | 'half' | 'third') => onChange({ width: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Полная</SelectItem>
              <SelectItem value="half">Половина</SelectItem>
              <SelectItem value="third">Треть</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Отступы</Label>
        <Select
          value={formData.spacing || 'md'}
          onValueChange={(value: 'sm' | 'md' | 'lg' | 'xl') => onChange({ spacing: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">Маленькие</SelectItem>
            <SelectItem value="md">Средние</SelectItem>
            <SelectItem value="lg">Большие</SelectItem>
            <SelectItem value="xl">Очень большие</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.variant !== 'gradient' && (
        <div className="space-y-2">
          <Label>Цвет (опционально)</Label>
          <Input
            type="color"
            value={formData.color || '#000000'}
            onChange={(e) => onChange({ color: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

export const SeparatorBlockEditor = withBlockEditor(
  SeparatorBlockEditorComponent,
  {
    validate: () => null // No validation needed for separator
  }
);

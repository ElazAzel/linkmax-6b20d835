import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('separatorBlock.lineStyle', 'Стиль линии')}</Label>
        <Select
          value={formData.variant || 'solid'}
          onValueChange={(value: 'solid' | 'dashed' | 'dotted' | 'gradient') => onChange({ variant: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">{t('separatorBlock.solid', 'Сплошная')}</SelectItem>
            <SelectItem value="dashed">{t('separatorBlock.dashed', 'Пунктирная')}</SelectItem>
            <SelectItem value="dotted">{t('separatorBlock.dotted', 'Точечная')}</SelectItem>
            <SelectItem value="gradient">{t('separatorBlock.gradient', 'Градиент')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('separatorBlock.thickness', 'Толщина')}</Label>
          <Select
            value={formData.thickness || 'thin'}
            onValueChange={(value: 'thin' | 'medium' | 'thick') => onChange({ thickness: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thin">{t('separatorBlock.thin', 'Тонкая')}</SelectItem>
              <SelectItem value="medium">{t('separatorBlock.medium', 'Средняя')}</SelectItem>
              <SelectItem value="thick">{t('separatorBlock.thick', 'Толстая')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t('separatorBlock.width', 'Ширина')}</Label>
          <Select
            value={formData.width || 'full'}
            onValueChange={(value: 'full' | 'half' | 'third') => onChange({ width: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">{t('separatorBlock.full', 'Полная')}</SelectItem>
              <SelectItem value="half">{t('separatorBlock.half', 'Половина')}</SelectItem>
              <SelectItem value="third">{t('separatorBlock.third', 'Треть')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t('separatorBlock.spacing', 'Отступы')}</Label>
        <Select
          value={formData.spacing || 'md'}
          onValueChange={(value: 'sm' | 'md' | 'lg' | 'xl') => onChange({ spacing: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sm">{t('separatorBlock.small', 'Маленькие')}</SelectItem>
            <SelectItem value="md">{t('separatorBlock.medium', 'Средние')}</SelectItem>
            <SelectItem value="lg">{t('separatorBlock.large', 'Большие')}</SelectItem>
            <SelectItem value="xl">{t('separatorBlock.extraLarge', 'Очень большие')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.variant !== 'gradient' && (
        <div className="space-y-2">
          <Label>{t('separatorBlock.color', 'Цвет (опционально)')}</Label>
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

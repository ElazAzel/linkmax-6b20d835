import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Plus from 'lucide-react/dist/esm/icons/plus';

interface ArrayFieldListProps {
  label: string;
  items: any[];
  onAdd: () => void;
  children: ReactNode;
  /** Text of the add button; defaults to «Добавить». */
  addLabel?: string;
}

/**
 * Reusable component for managing array fields in block editors
 * Provides consistent Add button and list container
 */
export function ArrayFieldList({ label, items: _items, onAdd, children, addLabel }: ArrayFieldListProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {/* Was "Add {label}" in English («Add Поля форм»). */}
        <Button type="button" size="sm" variant="outline" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" />
          {addLabel ?? t('common.add', 'Добавить')}
        </Button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

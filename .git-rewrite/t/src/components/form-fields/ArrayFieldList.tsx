import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface ArrayFieldListProps {
  label: string;
  items: any[];
  onAdd: () => void;
  children: ReactNode;
}

/**
 * Reusable component for managing array fields in block editors
 * Provides consistent Add button and list container
 */
export function ArrayFieldList({ label, items, onAdd, children }: ArrayFieldListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Add {label.slice(0, -1)}
        </Button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

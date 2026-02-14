import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Trash2 } from 'lucide-react';

interface ArrayFieldItemProps {
  index: number;
  label: string;
  onRemove: () => void;
  children: ReactNode;
}

/**
 * Reusable component for individual items in array fields
 * Provides consistent layout with remove button
 */
export function ArrayFieldItem({ index, label, onRemove, children }: ArrayFieldItemProps) {
  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm">
          {label} {index + 1}
        </Label>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}

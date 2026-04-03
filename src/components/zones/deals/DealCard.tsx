/**
 * DealCard - Draggable deal card for Kanban board
 */
import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/utils';
import User from 'lucide-react/dist/esm/icons/user';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { Checkbox } from '@/components/ui/checkbox';
import type { ZoneDeal } from '@/types/zones';

interface DealCardProps {
  deal: ZoneDeal;
  onClick: () => void;
  selected?: boolean;
  onSelectChange?: (selected: boolean) => void;
}

function isOverdue(deal: ZoneDeal) {
  if (!deal.next_step_at) return false;
  return new Date(deal.next_step_at) < new Date();
}

export const DealCard = memo(function DealCard({ deal, onClick, selected, onSelectChange }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 100 }
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow touch-none",
        isDragging && "opacity-50 shadow-lg",
        isOverdue(deal) && "border-destructive/50"
      )}
      data-testid="deal-card"
      onClick={(e) => {
        if (!isDragging) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <CardContent className="p-3 space-y-2 relative group-card">
        <div className="absolute top-2 right-2 opacity-0 group-card-hover:opacity-100 transition-opacity z-20">
          <Checkbox 
            checked={!!selected} 
            onCheckedChange={(c) => {
              onSelectChange?.(!!c);
            }} 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
        {(selected) && (
          <div className="absolute inset-0 bg-primary/5 rounded-xl border-2 border-primary z-10 pointer-events-none" />
        )}
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-sm leading-tight pr-6">{deal.title}</span>
          {isOverdue(deal) && <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />}
        </div>
        {deal.value_amount > 0 && (
          <div className="text-sm font-bold text-primary">
            {deal.value_amount.toLocaleString()} {deal.currency}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {deal.contact && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {deal.contact.name}
            </span>
          )}
          {deal.next_step_at && (
            <span className={cn("flex items-center gap-1", isOverdue(deal) && "text-destructive")}>
              <Calendar className="h-3 w-3" />
              {new Date(deal.next_step_at).toLocaleDateString()}
            </span>
          )}
        </div>
        {deal.next_step && (
          <p className="text-xs text-muted-foreground truncate">→ {deal.next_step}</p>
        )}
      </CardContent>
    </Card>
  );
});

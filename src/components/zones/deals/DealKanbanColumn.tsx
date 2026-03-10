/**
 * DealKanbanColumn - Droppable column for a deal stage
 */
import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/utils';
import { DealCard } from './DealCard';
import type { ZoneDeal, ZoneDealStage } from '@/types/zones';

interface DealKanbanColumnProps {
  stage: ZoneDealStage;
  deals: ZoneDeal[];
  onDealClick: (deal: ZoneDeal) => void;
}

export const DealKanbanColumn = memo(function DealKanbanColumn({
  stage,
  deals,
  onDealClick,
}: DealKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: { stage },
  });

  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
        <span className="font-semibold text-sm">{stage.name}</span>
        <Badge variant="secondary" className="text-xs h-5 px-1.5">
          {deals.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "space-y-2 min-h-[200px] bg-muted/30 rounded-xl p-2 transition-colors",
          isOver && "bg-primary/10 ring-2 ring-primary/30"
        )}
      >
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onClick={() => onDealClick(deal)} />
        ))}
      </div>
    </div>
  );
});

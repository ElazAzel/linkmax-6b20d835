/**
 * TaskCard - Draggable task card for Kanban board
 */
import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/utils';
import { format, isPast, isToday } from 'date-fns';
import type { ZoneTask, TaskPriority } from '@/hooks/zones/useZoneTasks';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  low: { label: 'Низкий', variant: 'outline' },
  medium: { label: 'Средний', variant: 'secondary' },
  high: { label: 'Высокий', variant: 'default' },
  urgent: { label: 'Срочный', variant: 'destructive' },
};

interface TaskCardProps {
  task: ZoneTask;
  onClick: () => void;
  getMemberName?: (id: string | null) => string | null;
  isDragOverlay?: boolean;
}

export const TaskCard = memo(function TaskCard({ task, onClick, getMemberName, isDragOverlay }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const priorityConf = PRIORITY_CONFIG[task.priority];
  const assigneeName = getMemberName?.(task.assigned_to);
  const isOverdue = task.due_date && task.status !== 'done' && task.status !== 'cancelled' && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
  const isDueToday = task.due_date && isToday(new Date(task.due_date));

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      className={cn(
        "bg-card border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-all group",
        isOverdue ? "border-destructive/50 bg-destructive/5" : "border-border/40",
        isDragging && "opacity-30",
        isDragOverlay && "shadow-lg rotate-2 scale-105"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-1.5">
        <div
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab opacity-0 group-hover:opacity-50 hover:!opacity-100 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-tight flex-1 truncate">{task.title}</p>
            <Badge variant={priorityConf.variant} className="text-[9px] shrink-0 h-5">
              {task.priority === 'urgent' && <AlertCircle className="h-2.5 w-2.5 mr-0.5" />}
              {priorityConf.label}
            </Badge>
          </div>

          {task.description && (
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{task.description}</p>
          )}

          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {assigneeName && (
              <span className="text-[11px] text-muted-foreground">→ {assigneeName}</span>
            )}
            {task.due_date && (
              <span className={cn(
                "text-[11px] flex items-center gap-0.5",
                isOverdue ? "text-destructive font-medium" : isDueToday ? "text-warning font-medium" : "text-muted-foreground"
              )}>
                <Calendar className="h-2.5 w-2.5" />
                {format(new Date(task.due_date), 'dd.MM.yyyy')}
                {isOverdue && ' ⚠'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

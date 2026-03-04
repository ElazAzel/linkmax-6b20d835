/**
 * TaskCard - Draggable task card for Kanban board with glassmorphism
 */
import { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/utils';
import { format, isPast, isToday } from 'date-fns';
import type { ZoneTask, TaskPriority } from '@/types/zones';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';

const PRIORITY_CONFIG: Record<TaskPriority, { labelKey: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  low: { labelKey: 'tasks.priority.low', variant: 'outline' },
  medium: { labelKey: 'tasks.priority.medium', variant: 'secondary' },
  high: { labelKey: 'tasks.priority.high', variant: 'default' },
  urgent: { labelKey: 'tasks.priority.urgent', variant: 'destructive' },
};

interface TaskCardProps {
  task: ZoneTask;
  onClick: () => void;
  getMemberName?: (id: string | null) => string | null;
  isDragOverlay?: boolean;
}

export const TaskCard = memo(function TaskCard({ task, onClick, getMemberName, isDragOverlay }: TaskCardProps) {
  const { t } = useTranslation();
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
        "bg-background/40 backdrop-blur-md border border-border/40 rounded-xl p-3 cursor-pointer",
        "hover:bg-background/60 hover:border-border/80 hover:shadow-lg transition-all duration-300 group",
        isOverdue && "border-destructive/30 bg-destructive/5",
        isDragging && "opacity-20",
        isDragOverlay && "shadow-2xl rotate-1 scale-105 border-primary/50 bg-background/80"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab opacity-40 group-hover:opacity-60 hover:!opacity-100 shrink-0 transition-opacity touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm font-semibold leading-tight flex-1 truncate",
              task.status === 'done' && "text-muted-foreground line-through decoration-muted-foreground/50 font-normal"
            )}>
              {task.title}
            </p>
            <Badge variant={priorityConf.variant} className="text-[9px] shrink-0 h-4 px-1.5 uppercase font-bold tracking-wider">
              {task.priority === 'urgent' && <AlertCircle className="h-2.5 w-2.5 mr-0.5" />}
              {t(priorityConf.labelKey)}
            </Badge>
          </div>

          {task.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-normal">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 overflow-hidden">
              {assigneeName && (
                <div className="flex items-center gap-1 min-w-0">
                  <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
                    {assigneeName[0].toUpperCase()}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate">{assigneeName}</span>
                </div>
              )}
            </div>

            {task.due_date && (
              <span className={cn(
                "text-[10px] flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-full bg-muted/40",
                isOverdue ? "text-destructive font-bold bg-destructive/10" : isDueToday ? "text-warning font-bold bg-warning/10" : "text-muted-foreground"
              )}>
                <Calendar className="h-2.5 w-2.5" />
                {format(new Date(task.due_date), 'dd MMM')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});


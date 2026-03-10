/**
 * TaskKanbanColumn - Droppable column for task status
 */
import { memo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/utils';
import { TaskCard } from './TaskCard';
import type { ZoneTask, TaskStatus } from '@/hooks/zones/useZoneTasks';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Circle from 'lucide-react/dist/esm/icons/circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import type { LucideIcon } from 'lucide-react';

const STATUS_CONFIG: Record<TaskStatus, { icon: LucideIcon; labelKey: string; color: string }> = {
  todo: { icon: Circle, labelKey: 'tasks.status.todo', color: 'text-muted-foreground' },
  in_progress: { icon: Clock, labelKey: 'tasks.status.inProgress', color: 'text-blue-500' },
  done: { icon: CheckCircle2, labelKey: 'tasks.status.done', color: 'text-green-500' },
  cancelled: { icon: Circle, labelKey: 'tasks.status.cancelled', color: 'text-red-500' },
};

const VISIBLE_COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done'];

interface TaskKanbanColumnProps {
  status: TaskStatus;
  tasks: ZoneTask[];
  onTaskClick: (task: ZoneTask) => void;
  getMemberName: (id: string | null) => string | null;
}

export const TaskKanbanColumn = memo(function TaskKanbanColumn({
  status,
  tasks,
  onTaskClick,
  getMemberName,
}: TaskKanbanColumnProps) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  const { setNodeRef, isOver } = useDroppable({
    id: `task-col-${status}`,
    data: { status },
  });

  return (
    <div className="w-72 md:w-80 shrink-0 flex flex-col">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon className={cn("h-4 w-4", config.color)} />
        <span className="text-sm font-semibold">{t(config.labelKey)}</span>
        <Badge variant="outline" className="text-xs ml-auto">{tasks.length}</Badge>
      </div>

      <ScrollArea className="flex-1">
        <div
          ref={setNodeRef}
          className={cn(
            "space-y-2 pr-2 min-h-[200px] rounded-xl p-2 transition-colors",
            isOver ? "bg-primary/10 ring-2 ring-primary/30" : "bg-muted/30"
          )}
        >
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              getMemberName={getMemberName}
            />
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-muted-foreground text-xs py-8 border border-dashed rounded-lg">
              {t('tasks.empty')}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

export { VISIBLE_COLUMNS };

/**
 * ZoneTasksScreen - Kanban-style task board for zones
 */
import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneTasks, type ZoneTask, type TaskStatus, type TaskPriority } from '@/hooks/zones/useZoneTasks';
import { useZoneContext } from '@/contexts/ZoneContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils/utils';
import { format } from 'date-fns';
import Plus from 'lucide-react/dist/esm/icons/plus';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Circle from 'lucide-react/dist/esm/icons/circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import ListTodo from 'lucide-react/dist/esm/icons/list-todo';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';

interface Props {
  zoneId: string;
}

const STATUS_CONFIG: Record<TaskStatus, { icon: any; label: string; color: string }> = {
  todo: { icon: Circle, label: 'К выполнению', color: 'text-muted-foreground' },
  in_progress: { icon: Clock, label: 'В работе', color: 'text-blue-500' },
  done: { icon: CheckCircle2, label: 'Готово', color: 'text-green-500' },
  cancelled: { icon: XCircle, label: 'Отменено', color: 'text-red-500' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  low: { label: 'Низкий', variant: 'outline' },
  medium: { label: 'Средний', variant: 'secondary' },
  high: { label: 'Высокий', variant: 'default' },
  urgent: { label: 'Срочный', variant: 'destructive' },
};

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done'];

export const ZoneTasksScreen = memo(function ZoneTasksScreen({ zoneId }: Props) {
  const { t } = useTranslation();
  const { tasks, loading, createTask, updateTask, deleteTask } = useZoneTasks(zoneId);
  const { members } = useZoneContext();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newAssignee, setNewAssignee] = useState<string>('');

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, ZoneTask[]> = { todo: [], in_progress: [], done: [], cancelled: [] };
    tasks.forEach(t => { grouped[t.status]?.push(t); });
    return grouped;
  }, [tasks]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await createTask({
        title: newTitle.trim(),
        priority: newPriority,
        assigned_to: newAssignee || null,
      });
      setCreateOpen(false);
      setNewTitle('');
      setNewPriority('medium');
      setNewAssignee('');
    } catch { /* handled */ }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  const getMemberName = (userId: string | null) => {
    if (!userId) return null;
    const m = members.find(m => m.user_id === userId);
    return m?.display_name || m?.email || null;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">{t('zones.tasks.title', 'Задачи')}</h1>
          <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          {t('zones.tasks.new', 'Новая задача')}
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-4">
        {loading ? (
          <div className="flex gap-4">
            {COLUMNS.map(col => (
              <div key={col} className="w-72 shrink-0 space-y-3">
                <div className="h-8 bg-muted rounded animate-pulse" />
                {[1, 2].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 min-h-[400px]">
            {COLUMNS.map(status => {
              const config = STATUS_CONFIG[status];
              const Icon = config.icon;
              const columnTasks = tasksByStatus[status];
              return (
                <div key={status} className="w-72 md:w-80 shrink-0 flex flex-col">
                  {/* Column Header */}
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <Icon className={cn("h-4 w-4", config.color)} />
                    <span className="text-sm font-semibold">{config.label}</span>
                    <Badge variant="outline" className="text-[10px] ml-auto">{columnTasks.length}</Badge>
                  </div>

                  {/* Cards */}
                  <ScrollArea className="flex-1">
                    <div className="space-y-2 pr-2">
                      {columnTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={handleStatusChange}
                          onDelete={deleteTask}
                          getMemberName={getMemberName}
                        />
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="text-center text-muted-foreground text-xs py-8 border border-dashed rounded-lg">
                          {t('zones.tasks.empty', 'Пусто')}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('zones.tasks.newTask', 'Новая задача')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder={t('zones.tasks.titlePlaceholder', 'Название задачи')}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-2">
              {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(p => (
                <Button
                  key={p}
                  size="sm"
                  variant={newPriority === p ? 'default' : 'outline'}
                  onClick={() => setNewPriority(p)}
                  className="text-xs"
                >
                  {PRIORITY_CONFIG[p].label}
                </Button>
              ))}
            </div>
            {members.length > 0 && (
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={newAssignee}
                onChange={e => setNewAssignee(e.target.value)}
              >
                <option value="">{t('zones.tasks.unassigned', 'Не назначено')}</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.display_name || m.email || m.user_id}
                  </option>
                ))}
              </select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {t('common.cancel', 'Отмена')}
            </Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim()}>
              {t('common.create', 'Создать')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

// ─── Task Card ───
interface TaskCardProps {
  task: ZoneTask;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  getMemberName: (id: string | null) => string | null;
}

function TaskCard({ task, onStatusChange, onDelete, getMemberName }: TaskCardProps) {
  const priorityConf = PRIORITY_CONFIG[task.priority];
  const nextStatus: TaskStatus | null =
    task.status === 'todo' ? 'in_progress' :
    task.status === 'in_progress' ? 'done' : null;

  const assigneeName = getMemberName(task.assigned_to);

  return (
    <div className="bg-card border border-border/40 rounded-lg p-3 hover:shadow-sm transition-shadow group">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-tight flex-1">{task.title}</p>
        <Badge variant={priorityConf.variant} className="text-[9px] shrink-0 h-5">
          {task.priority === 'urgent' && <AlertCircle className="h-2.5 w-2.5 mr-0.5" />}
          {priorityConf.label}
        </Badge>
      </div>

      {assigneeName && (
        <p className="text-[11px] text-muted-foreground mt-1.5">→ {assigneeName}</p>
      )}

      {task.due_date && (
        <p className="text-[11px] text-muted-foreground mt-1">
          📅 {format(new Date(task.due_date), 'dd.MM.yyyy')}
        </p>
      )}

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/20">
        {nextStatus ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[11px] px-2"
            onClick={() => onStatusChange(task.id, nextStatus)}
          >
            {nextStatus === 'in_progress' ? '▶ В работу' : '✓ Готово'}
          </Button>
        ) : (
          <span className="text-[11px] text-green-500 font-medium">✓ Выполнено</span>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-destructive"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

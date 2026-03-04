/**
 * ZoneTasksScreen - Kanban-style task board with DnD, filters, detail sheet
 */
import { memo, useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core';
import { useZoneTasks } from '@/hooks/zones/useZoneTasks';
import type { ZoneTask, TaskStatus, TaskPriority } from '@/types/zones';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { useZoneContext } from '@/contexts/ZoneContext';
import { supabase } from '@/platform/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TaskCard } from './tasks/TaskCard';
import { TaskKanbanColumn, VISIBLE_COLUMNS } from './tasks/TaskKanbanColumn';
import { TaskDetailSheet } from './tasks/TaskDetailSheet';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ListTodo from 'lucide-react/dist/esm/icons/list-todo';
import Filter from 'lucide-react/dist/esm/icons/filter';

interface Props {
  zoneId: string;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string }> = {
  low: { label: 'Низкий' },
  medium: { label: 'Средний' },
  high: { label: 'Высокий' },
  urgent: { label: 'Срочный' },
};

export const ZoneTasksScreen = memo(function ZoneTasksScreen({ zoneId }: Props) {
  const { t } = useTranslation();
  const { tasks, loading, createTask, updateTask, deleteTask } = useZoneTasks(zoneId);
  const { contacts } = useZoneContacts(zoneId);
  const { deals } = useZoneDeals(zoneId);
  const { members } = useZoneContext();

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newContactId, setNewContactId] = useState('');
  const [newDealId, setNewDealId] = useState('');

  // Detail sheet
  const [selectedTask, setSelectedTask] = useState<ZoneTask | null>(null);

  // Filters
  const [filterMy, setFilterMy] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user id once
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  // DnD
  const [activeDragTask, setActiveDragTask] = useState<ZoneTask | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const filteredTasks = useMemo(() => {
    if (!filterMy || !currentUserId) return tasks;
    return tasks.filter(t => t.assigned_to === currentUserId);
  }, [tasks, filterMy, currentUserId]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, ZoneTask[]> = { todo: [], in_progress: [], done: [], cancelled: [] };
    filteredTasks.forEach(t => { grouped[t.status]?.push(t); });
    return grouped;
  }, [filteredTasks]);

  const overdueCount = useMemo(() => {
    const now = new Date();
    return tasks.filter(t => t.due_date && t.status !== 'done' && t.status !== 'cancelled' && new Date(t.due_date) < now).length;
  }, [tasks]);

  const getMemberName = useCallback((userId: string | null) => {
    if (!userId) return null;
    const m = members.find(m => m.user_id === userId);
    return m?.display_name || m?.email || null;
  }, [members]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragTask(event.active.data.current?.task ?? null);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDragTask(null);
    const { active, over } = event;
    if (!over) return;
    const task = active.data.current?.task as ZoneTask | undefined;
    const newStatus = over.data.current?.status as TaskStatus | undefined;
    if (!task || !newStatus || task.status === newStatus) return;
    await updateTask(task.id, { status: newStatus });
  }, [updateTask]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await createTask({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        priority: newPriority,
        assigned_to: newAssignee || null,
        due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
        contact_id: newContactId || null,
        deal_id: newDealId || null,
      });
      setCreateOpen(false);
      setNewTitle('');
      setNewDescription('');
      setNewPriority('medium');
      setNewAssignee('');
      setNewDueDate('');
      setNewContactId('');
      setNewDealId('');
    } catch { /* handled */ }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ListTodo className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">{t('zones.tasks.title', 'Задачи')}</h1>
          <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
          {overdueCount > 0 && (
            <Badge variant="destructive" className="text-xs">{overdueCount} просрочено</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={filterMy ? 'default' : 'outline'}
            onClick={() => setFilterMy(!filterMy)}
            className="text-xs"
          >
            <Filter className="h-3.5 w-3.5 mr-1" />
            {filterMy ? 'Мои' : 'Все'}
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            {t('zones.tasks.new', 'Новая задача')}
          </Button>
        </div>
      </div>

      {/* Kanban Board with DnD */}
      <div className="flex-1 overflow-x-auto p-4">
        {loading ? (
          <div className="flex gap-4">
            {VISIBLE_COLUMNS.map(col => (
              <div key={col} className="w-72 shrink-0 space-y-3">
                <div className="h-8 bg-muted rounded animate-pulse" />
                {[1, 2].map(i => <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />)}
              </div>
            ))}
          </div>
        ) : (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 min-h-[400px]">
              {VISIBLE_COLUMNS.map(status => (
                <TaskKanbanColumn
                  key={status}
                  status={status}
                  tasks={tasksByStatus[status]}
                  onTaskClick={setSelectedTask}
                  getMemberName={getMemberName}
                />
              ))}
            </div>
            <DragOverlay>
              {activeDragTask && (
                <div className="w-72">
                  <TaskCard task={activeDragTask} onClick={() => { }} isDragOverlay />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('zones.tasks.newTask', 'Новая задача')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Название</Label>
              <Input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Название задачи"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Описание</Label>
              <Input
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Описание (необязательно)"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Срок</Label>
              <Input type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Приоритет</Label>
              <div className="flex gap-2 mt-1">
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
            </div>
            {members.length > 0 && (
              <div>
                <Label>Ответственный</Label>
                <Select value={newAssignee} onValueChange={setNewAssignee}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="Не назначено" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Не назначено</SelectItem>
                    {members.map(m => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.display_name || m.email || m.user_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {contacts.length > 0 && (
              <div>
                <Label>{t('zones.tasks.contact', 'Contact')}</Label>
                <Select value={newContactId} onValueChange={setNewContactId}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    {contacts.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {deals.length > 0 && (
              <div>
                <Label>{t('zones.tasks.deal', 'Deal')}</Label>
                <Select value={newDealId} onValueChange={setNewDealId}>
                  <SelectTrigger className="h-9 mt-1">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">—</SelectItem>
                    {deals.filter(d => d.status === 'open').map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={!newTitle.trim()}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => { if (!open) setSelectedTask(null); }}
        onUpdate={updateTask}
        onDelete={deleteTask}
        members={members}
        contacts={contacts}
        deals={deals}
      />
    </div>
  );
});

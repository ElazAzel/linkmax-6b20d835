/**
 * TaskDetailSheet - Side panel for viewing/editing a task
 */
import { memo, useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/utils';
import { format } from 'date-fns';
import type { ZoneTask, TaskStatus, TaskPriority } from '@/hooks/zones/useZoneTasks';
import type { ZoneMember, ZoneContact, ZoneDeal } from '@/types/zones';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Save from 'lucide-react/dist/esm/icons/save';

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'К выполнению' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Готово' },
  { value: 'cancelled', label: 'Отменено' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }[] = [
  { value: 'low', label: 'Низкий', variant: 'outline' },
  { value: 'medium', label: 'Средний', variant: 'secondary' },
  { value: 'high', label: 'Высокий', variant: 'default' },
  { value: 'urgent', label: 'Срочный', variant: 'destructive' },
];

interface TaskDetailSheetProps {
  task: ZoneTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: Partial<ZoneTask>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  members: ZoneMember[];
  contacts: ZoneContact[];
  deals: ZoneDeal[];
}

export const TaskDetailSheet = memo(function TaskDetailSheet({
  task,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  members,
  contacts,
  deals,
}: TaskDetailSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [contactId, setContactId] = useState('');
  const [dealId, setDealId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssignedTo(task.assigned_to || '');
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
      setContactId(task.contact_id || '');
      setDealId(task.deal_id || '');
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        status,
        priority,
        assigned_to: assignedTo || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        contact_id: contactId || null,
        deal_id: dealId || null,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await onDelete(task.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Редактирование задачи</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4">
          {/* Title */}
          <div>
            <Label>Название</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} className="mt-1" />
          </div>

          {/* Description */}
          <div>
            <Label>Описание</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Добавьте описание задачи..."
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* Status */}
          <div>
            <Label>Статус</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {STATUS_OPTIONS.map(s => (
                <Button
                  key={s.value}
                  size="sm"
                  variant={status === s.value ? 'default' : 'outline'}
                  className="text-xs h-7"
                  onClick={() => setStatus(s.value)}
                >
                  {s.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <Label>Приоритет</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {PRIORITY_OPTIONS.map(p => (
                <Button
                  key={p.value}
                  size="sm"
                  variant={priority === p.value ? 'default' : 'outline'}
                  className="text-xs h-7"
                  onClick={() => setPriority(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <Label>Срок выполнения</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1" />
          </div>

          {/* Assignee */}
          <div>
            <Label>Ответственный</Label>
            <select
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
            >
              <option value="">Не назначено</option>
              {members.map(m => (
                <option key={m.user_id} value={m.user_id}>
                  {m.display_name || m.email || m.user_id}
                </option>
              ))}
            </select>
          </div>

          {/* Contact */}
          {contacts.length > 0 && (
            <div>
              <Label>Контакт</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1"
                value={contactId}
                onChange={e => setContactId(e.target.value)}
              >
                <option value="">Без контакта</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Deal */}
          {deals.length > 0 && (
            <div>
              <Label>Сделка</Label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm mt-1"
                value={dealId}
                onChange={e => setDealId(e.target.value)}
              >
                <option value="">Без сделки</option>
                {deals.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Meta */}
          <div className="text-xs text-muted-foreground pt-2 border-t border-border/30 space-y-1">
            <p>Создано: {format(new Date(task.created_at), 'dd.MM.yyyy HH:mm')}</p>
            {task.completed_at && <p>Завершено: {format(new Date(task.completed_at), 'dd.MM.yyyy HH:mm')}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving || !title.trim()} className="flex-1">
              <Save className="h-4 w-4 mr-1" />
              Сохранить
            </Button>
            <Button variant="destructive" size="icon" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
});

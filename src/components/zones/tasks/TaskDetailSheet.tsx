/**
 * TaskDetailSheet - Side panel for viewing/editing a task with checklists
 */
import { memo, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/utils';
import { format } from 'date-fns';
import type { ZoneTask, TaskStatus, TaskPriority, TaskRecurrenceRule, ZoneMember, ZoneContact, ZoneDeal } from '@/types/zones';
import { useZoneTaskChecklist } from '@/hooks/zones/useZoneTasks';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import Save from 'lucide-react/dist/esm/icons/save';
import Plus from 'lucide-react/dist/esm/icons/plus';
import X from 'lucide-react/dist/esm/icons/x';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Clock from 'lucide-react/dist/esm/icons/clock';
import User from 'lucide-react/dist/esm/icons/user';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Send from 'lucide-react/dist/esm/icons/send';
import { useZoneTaskComments } from '@/hooks/zones/useZoneTasks';

const STATUS_OPTIONS: { value: TaskStatus; labelKey: string }[] = [
  { value: 'todo', labelKey: 'tasks.status.todo' },
  { value: 'in_progress', labelKey: 'tasks.status.inProgress' },
  { value: 'done', labelKey: 'tasks.status.done' },
  { value: 'cancelled', labelKey: 'tasks.status.cancelled' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; labelKey: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }[] = [
  { value: 'low', labelKey: 'tasks.priority.low', variant: 'outline' },
  { value: 'medium', labelKey: 'tasks.priority.medium', variant: 'secondary' },
  { value: 'high', labelKey: 'tasks.priority.high', variant: 'default' },
  { value: 'urgent', labelKey: 'tasks.priority.urgent', variant: 'destructive' },
];

const RECURRENCE_OPTIONS: { value: TaskRecurrenceRule; labelKey: string }[] = [
  { value: 'none', labelKey: 'common.none', },
  { value: 'daily', labelKey: 'tasks.recurrence.daily' },
  { value: 'weekly', labelKey: 'tasks.recurrence.weekly' },
  { value: 'monthly', labelKey: 'tasks.recurrence.monthly' },
  { value: 'yearly', labelKey: 'tasks.recurrence.yearly' },
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
  const { t } = useTranslation();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState<TaskRecurrenceRule>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [contactId, setContactId] = useState('');
  const [dealId, setDealId] = useState('');
  const [saving, setSaving] = useState(false);

  // Checklist state
  const [newItemTitle, setNewItemTitle] = useState('');
  const { checklist, addItem, toggleItem, removeItem } = useZoneTaskChecklist(task?.zone_id || null, task?.id || null);

  // Comments state
  const { comments, addComment, deleteComment } = useZoneTaskComments(task?.zone_id || null, task?.id || null);
  const [newComment, setNewComment] = useState('');

  const checklistProgress = useMemo(() => {
    if (!checklist.length) return 0;
    const done = checklist.filter(i => i.is_done).length;
    return Math.round((done / checklist.length) * 100);
  }, [checklist]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssignedTo(task.assigned_to || '');
      setDueDate(task.due_date ? task.due_date.split('T')[0] : '');
      setRecurrenceRule(task.recurrence_rule || 'none');
      setRecurrenceEndDate(task.recurrence_end_date ? task.recurrence_end_date.split('T')[0] : '');
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
        recurrence_rule: recurrenceRule === 'none' ? null : recurrenceRule,
        recurrence_end_date: recurrenceRule !== 'none' && recurrenceEndDate ? new Date(recurrenceEndDate).toISOString() : null,
        contact_id: contactId || null,
        deal_id: dealId || null,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    await addItem(newItemTitle.trim());
    setNewItemTitle('');
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment(newComment.trim());
    setNewComment('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-background/95 backdrop-blur-xl">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="text-left font-bold text-xl">{t('tasks.editTitle', 'Edit Task')}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-6 py-4">
            {/* Main Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">{t('tasks.titleLabel', 'Title')}</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-muted/30 focus-visible:ring-primary" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">{t('tasks.descriptionLabel', 'Description')}</Label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t('tasks.descriptionPlaceholder', 'Task details...')}
                  className="bg-muted/30 min-h-[100px] resize-none"
                />
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Checklist
                </Label>
                {checklist.length > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground">{checklistProgress}%</span>
                )}
              </div>

              {checklist.length > 0 && (
                <Progress value={checklistProgress} className="h-1 bg-muted" />
              )}

              <div className="space-y-2">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <Checkbox
                      checked={item.is_done}
                      onCheckedChange={(checked) => toggleItem(item.id, !!checked)}
                      className="h-4 w-4"
                    />
                    <span className={cn("text-sm flex-1 truncate", item.is_done && "text-muted-foreground line-through")}>
                      {item.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <Input
                    value={newItemTitle}
                    onChange={e => setNewItemTitle(e.target.value)}
                    placeholder="Add item..."
                    className="h-8 text-xs bg-muted/20"
                    onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                  />
                  <Button size="sm" variant="ghost" onClick={handleAddItem} disabled={!newItemTitle.trim()} className="h-8">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">{t('tasks.statusLabel', 'Status')}</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-muted/30 px-3 text-sm"
                  value={status}
                  onChange={e => setStatus(e.target.value as TaskStatus)}
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{t(s.labelKey)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">{t('tasks.priorityLabel', 'Priority')}</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-muted/30 px-3 text-sm"
                  value={priority}
                  onChange={e => setPriority(e.target.value as TaskPriority)}
                >
                  {PRIORITY_OPTIONS.map(p => (
                    <option key={p.value} value={p.value}>{t(p.labelKey)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Meta & Links */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    {t('tasks.dueDateLabel', 'Due Date')}
                  </Label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-muted/30 h-9" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                    {t('tasks.recurrenceLabel', 'Повторение')}
                  </Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-muted/30 px-3 text-sm"
                    value={recurrenceRule}
                    onChange={e => setRecurrenceRule(e.target.value as TaskRecurrenceRule)}
                  >
                    {RECURRENCE_OPTIONS.map(r => (
                      <option key={r.value} value={r.value}>{t(r.labelKey, r.value === 'none' ? 'Никогда' : r.value === 'daily' ? 'Каждый день' : r.value === 'weekly' ? 'Каждую неделю' : r.value === 'monthly' ? 'Каждый месяц' : 'Каждый год')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {recurrenceRule !== 'none' && (
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">{t('tasks.recurrenceUntil', 'До какой даты (необязательно)')}</Label>
                  <Input type="date" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} className="bg-muted/30 h-9" />
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-1.5">
                    <User className="h-3 w-3" />
                    {t('tasks.assigneeLabel', 'Assignee')}
                  </Label>
                  <select
                    className="w-full h-9 rounded-md border border-input bg-muted/30 px-3 text-sm"
                    value={assignedTo}
                    onChange={e => setAssignedTo(e.target.value)}
                  >
                    <option value="">{t('tasks.unassigned', 'None')}</option>
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.display_name || m.email || m.user_id.slice(0, 8)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">{t('tasks.dealLabel', 'Related Deal')}</Label>
                <select
                  className="w-full h-9 rounded-md border border-input bg-muted/30 px-3 text-sm"
                  value={dealId}
                  onChange={e => setDealId(e.target.value)}
                >
                  <option value="">None</option>
                  {deals.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 text-[10px] text-muted-foreground space-y-0.5">
                <p>{t('tasks.createdAt', 'Created')}: {format(new Date(task.created_at), 'PPp')}</p>
                {task.updated_at !== task.created_at && (
                  <p>Last update: {format(new Date(task.updated_at), 'PPp')}</p>
                )}
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Comments */}
            <div className="space-y-4">
              <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5" />
                {t('tasks.comments', 'Комментарии')}
              </Label>

              <div className="space-y-3">
                {comments.map(c => (
                  <div key={c.id} className="bg-muted/30 rounded-lg p-3 text-sm group relative">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-xs text-primary">
                        {c.user?.raw_user_meta_data?.display_name || c.user?.email || t('common.unknownUser', 'Unknown')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(c.created_at), 'HH:mm dd.MM')}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{c.content}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                      onClick={() => deleteComment(c.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}

                {comments.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">{t('tasks.noComments', 'Нет комментариев')}</p>
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder={t('tasks.commentPlaceholder', 'Написать комментарий...')}
                  className="min-h-[40px] h-10 resize-none bg-muted/20"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()} className="shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="p-4 bg-muted/20 border-t flex gap-2">
          <Button onClick={handleSave} disabled={saving || !title.trim()} className="flex-1 shadow-lg shadow-primary/20">
            <Save className="h-4 w-4 mr-2" />
            {t('tasks.save', 'Save Changes')}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(task.id).then(() => onOpenChange(false))} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
});


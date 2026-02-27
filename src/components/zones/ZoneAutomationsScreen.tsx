/**
 * ZoneAutomationsScreen - Manage CRM automations for a zone
 */
import { useState } from 'react';
import { useZoneAutomations, type ZoneAutomation } from '@/hooks/zones/useZoneAutomations';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';

const TRIGGERS = [
  { value: 'deal_stage_change', label: 'Сделка перешла на стадию' },
  { value: 'overdue_next_step', label: 'Просрочен следующий шаг' },
  { value: 'new_contact', label: 'Создан новый контакт' },
];

const ACTIONS = [
  { value: 'create_task', label: 'Создать задачу' },
  { value: 'notify_owner', label: 'Уведомить ответственного' },
  { value: 'create_deal', label: 'Создать сделку' },
];

interface Props {
  zoneId: string;
}

export function ZoneAutomationsScreen({ zoneId }: Props) {
  const { automations, loading, create, remove, toggle } = useZoneAutomations(zoneId);
  const { stages } = useZoneDeals(zoneId);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    trigger_type: '',
    action_type: '',
    config: {} as Record<string, any>,
  });

  const handleCreate = async () => {
    if (!form.name || !form.trigger_type || !form.action_type) {
      toast.error('Заполните все поля');
      return;
    }
    try {
      await create(form);
      setShowCreate(false);
      setForm({ name: '', trigger_type: '', action_type: '', config: {} });
      toast.success('Автоматизация создана');
    } catch {
      toast.error('Ошибка создания');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success('Удалено');
    } catch {
      toast.error('Ошибка удаления');
    }
  };

  const getTriggerLabel = (t: string) => TRIGGERS.find(tr => tr.value === t)?.label || t;
  const getActionLabel = (a: string) => ACTIONS.find(ac => ac.value === a)?.label || a;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Автоматизации</h2>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Новая
        </Button>
      </div>

      {loading && <div className="text-muted-foreground text-sm">Загрузка...</div>}

      {!loading && automations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Нет автоматизаций</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Создайте правила для автоматизации рутинных задач</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {automations.map(a => (
          <Card key={a.id} className={cn(!a.is_active && 'opacity-60')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{a.name || 'Без названия'}</span>
                    <Badge variant={a.is_active ? 'default' : 'secondary'} className="text-[10px]">
                      {a.is_active ? 'Активна' : 'Пауза'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{getTriggerLabel(a.trigger_type)}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span>{getActionLabel(a.action_type)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={a.is_active}
                    onCheckedChange={(v) => toggle(a.id, v)}
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новая автоматизация</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Например: Задача при смене стадии"
              />
            </div>
            <div>
              <Label>Триггер (Когда)</Label>
              <Select value={form.trigger_type} onValueChange={v => setForm(f => ({ ...f, trigger_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Выберите триггер" /></SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.trigger_type === 'deal_stage_change' && stages.length > 0 && (
              <div>
                <Label>Стадия</Label>
                <Select
                  value={form.config.stage_id || ''}
                  onValueChange={v => setForm(f => ({ ...f, config: { ...f.config, stage_id: v } }))}
                >
                  <SelectTrigger><SelectValue placeholder="Любая стадия" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Любая</SelectItem>
                    {stages.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Действие (Тогда)</Label>
              <Select value={form.action_type} onValueChange={v => setForm(f => ({ ...f, action_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Выберите действие" /></SelectTrigger>
                <SelectContent>
                  {ACTIONS.map(a => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.action_type === 'create_task' && (
              <div>
                <Label>Название задачи</Label>
                <Input
                  value={form.config.task_title || ''}
                  onChange={e => setForm(f => ({ ...f, config: { ...f.config, task_title: e.target.value } }))}
                  placeholder="Связаться с клиентом"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
            <Button onClick={handleCreate}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

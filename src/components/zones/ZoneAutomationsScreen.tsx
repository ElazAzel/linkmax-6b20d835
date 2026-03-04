/**
 * ZoneAutomationsScreen - Advanced CRM automations with Liquid Glass design
 */
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneAutomations, type ZoneAutomation } from '@/hooks/zones/useZoneAutomations';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import Play from 'lucide-react/dist/esm/icons/play';
import Pause from 'lucide-react/dist/esm/icons/pause';

const TRIGGER_DEFS = [
  { value: 'deal_stage_change', labelKey: 'zones.automations.triggerStageChange', fallback: 'Стадия сделки изменена', icon: '🎯' },
  { value: 'invoice_paid', labelKey: 'zones.automations.triggerInvoicePaid', fallback: 'Инвойс оплачен', icon: '💰' },
  { value: 'task_completed', labelKey: 'zones.automations.triggerTaskCompleted', fallback: 'Задача выполнена', icon: '✅' },
  { value: 'new_contact', labelKey: 'zones.automations.triggerNewContact', fallback: 'Новый контакт создан', icon: '👤' },
  { value: 'overdue_next_step', labelKey: 'zones.automations.triggerOverdueNextStep', fallback: 'Просрочен шаг в сделке', icon: '⏰' },
] as const;

const ACTION_DEFS = [
  { value: 'create_task', labelKey: 'zones.automations.actionCreateTask', fallback: 'Создать задачу', icon: '📝' },
  { value: 'change_deal_stage', labelKey: 'zones.automations.actionChangeStage', fallback: 'Изменить стадию сделки', icon: '🚀' },
  { value: 'notify_owner', labelKey: 'zones.automations.actionNotifyOwner', fallback: 'Уведомить владельца', icon: '🔔' },
  { value: 'create_deal', labelKey: 'zones.automations.actionCreateDeal', fallback: 'Создать новую сделку', icon: '➕' },
] as const;

interface Props {
  zoneId: string;
}

export function ZoneAutomationsScreen({ zoneId }: Props) {
  const { t } = useTranslation();
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
      toast.error(t('zones.automations.fillRequired', 'Пожалуйста, заполните необходимые поля'));
      return;
    }
    try {
      await create({
        ...form,
        is_active: true
      });
      setShowCreate(false);
      setForm({ name: '', trigger_type: '', action_type: '', config: {} });
      toast.success(t('zones.automations.created', 'Автоматизация добавлена'));
    } catch {
      toast.error(t('zones.automations.createError', 'Не удалось создать автоматизацию'));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast.success(t('zones.automations.deleted', 'Правило удалено'));
    } catch {
      toast.error(t('zones.automations.deleteError', 'Ошибка удаления'));
    }
  };

  const getTrigger = (v: string) => TRIGGERS.find(t => t.value === v);
  const getAction = (v: string) => ACTIONS.find(a => a.value === v);

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-warning/10 text-warning shadow-inner">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('zones.automations.title', 'Автоматизации')}</h2>
            <p className="text-sm text-muted-foreground">{t('zones.automations.subtitle', 'Настраивайте правила для вашего CRM')}</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(true)} className="rounded-xl shadow-lg shadow-warning/20 hover:scale-105 transition-transform">
          <Plus className="h-4 w-4 mr-2" /> {t('zones.automations.addRule', 'Добавить правило')}
        </Button>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-2xl border border-border/40" />)}
        </div>
      )}

      {!loading && automations.length === 0 && (
        <Card className="bg-background/20 border-dashed border-2 py-16">
          <CardContent className="text-center">
            <Zap className="h-16 w-16 mx-auto text-muted-foreground/10 mb-6 group-hover:animate-pulse" />
            <h3 className="text-xl font-bold mb-2">{t('zones.automations.emptyTitle', 'Автоматизируйте рутину')}</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
              {t('zones.automations.emptyDesc', 'Создавайте правила, которые будут срабатывать автоматически при определенных событиях.')}
            </p>
            <Button variant="outline" onClick={() => setShowCreate(true)} className="rounded-xl border-dashed">
              {t('zones.automations.tryFirst', 'Попробовать первое правило')}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {automations.map(a => {
          const trigger = getTrigger(a.trigger_type);
          const action = getAction(a.action_type);
          return (
            <Card
              key={a.id}
              className={cn(
                "relative bg-background/40 backdrop-blur-md border-border/40 transition-all hover:border-warning/30 group",
                !a.is_active && "opacity-50 grayscale-[0.5]"
              )}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold truncate tracking-tight">{a.name}</span>
                      <Badge variant={a.is_active ? 'default' : 'secondary'} className="text-[10px] uppercase font-black px-1.5 py-0">
                        {a.is_active ? t('zones.automations.active', 'ACTIVE') : t('zones.automations.paused', 'PAUSED')}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/30 border border-border/40">
                        <span className="text-lg">{trigger?.icon}</span>
                        <span className="font-medium">{trigger?.label}</span>
                      </div>
                      <div className="h-px w-6 bg-border/50 hidden md:block" />
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                        <span className="text-lg">{action?.icon}</span>
                        <span className="font-medium text-primary">{action?.label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0">
                    <div className="flex items-center gap-2 mr-4">
                      {a.is_active ? <Play className="h-3 w-3 text-primary animate-pulse" /> : <Pause className="h-3 w-3 text-muted-foreground" />}
                      <Switch
                        checked={a.is_active}
                        onCheckedChange={(v) => toggle(a.id, v)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </div>
                    <Separator orientation="vertical" className="h-8 hidden md:block" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(a.id)}
                      className="h-10 w-10 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl bg-background/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="h-5 w-5 text-warning" /> {t('zones.automations.newRule', 'Новое правило')}
            </DialogTitle>
            <DialogDescription>{t('zones.automations.ruleDesc', 'Опишите логику автоматизации: когда срабатывает и что делает.')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('zones.automations.ruleName', 'Название правила')}</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder={t('zones.automations.ruleNamePlaceholder', 'Например: Авто-инвойс при закрытии')}
                className="bg-muted/20 border-border/40"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('zones.automations.trigger', 'Триггер (Когда)')}</Label>
                <Select value={form.trigger_type} onValueChange={v => setForm(f => ({ ...f, trigger_type: v, config: {} }))}>
                  <SelectTrigger className="bg-muted/30 h-11"><SelectValue placeholder={t('zones.automations.event', 'Событие')} /></SelectTrigger>
                  <SelectContent>
                    {TRIGGERS.map(t => (
                      <SelectItem key={t.value} value={t.value} className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{t.icon}</span>
                          <span>{t.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase font-black text-muted-foreground tracking-widest">{t('zones.automations.action', 'Действие (Тогда)')}</Label>
                <Select value={form.action_type} onValueChange={v => setForm(f => ({ ...f, action_type: v }))}>
                  <SelectTrigger className="bg-muted/30 h-11"><SelectValue placeholder={t('zones.automations.reaction', 'Реакция')} /></SelectTrigger>
                  <SelectContent>
                    {ACTIONS.map(a => (
                      <SelectItem key={a.value} value={a.value} className="py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{a.icon}</span>
                          <span>{a.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Config Sections */}
            {(form.trigger_type || form.action_type) && (
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/40 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground tracking-widest mb-1">
                  <Settings2 className="h-3 w-3" /> {t('zones.automations.configParams', 'Настройка параметров')}
                </div>

                {form.trigger_type === 'deal_stage_change' && stages.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">{t('zones.automations.dealStage', 'Стадия сделки')}</Label>
                    <Select
                      value={form.config.stage_id || ''}
                      onValueChange={v => setForm(f => ({ ...f, config: { ...f.config, stage_id: v } }))}
                    >
                      <SelectTrigger className="bg-background/50 h-9"><SelectValue placeholder={t('zones.automations.anyStage', 'Любая стадия')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{t('zones.automations.anyStage', 'Любая стадия')}</SelectItem>
                        {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {form.action_type === 'create_task' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">{t('zones.automations.taskText', 'Текст задачи')}</Label>
                    <Input
                      value={form.config.task_title || ''}
                      onChange={e => setForm(f => ({ ...f, config: { ...f.config, task_title: e.target.value } }))}
                      placeholder={t('zones.automations.taskTextPlaceholder', 'Например: Позвонить и подтвердить оплату')}
                      className="bg-background/50 h-9"
                    />
                  </div>
                )}

                {form.action_type === 'change_deal_stage' && stages.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">{t('zones.automations.changeToStage', 'Перевести на стадию')}</Label>
                    <Select
                      value={form.config.target_stage_id || ''}
                      onValueChange={v => setForm(f => ({ ...f, config: { ...f.config, target_stage_id: v } }))}
                    >
                      <SelectTrigger className="bg-background/50 h-9"><SelectValue placeholder={t('zones.automations.selectStage', 'Выберите стадию')} /></SelectTrigger>
                      <SelectContent>
                        {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border/10">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>{t('common.cancel', 'Отмена')}</Button>
            <Button onClick={handleCreate} className="px-8 shadow-lg shadow-warning/20 bg-warning text-warning-foreground hover:bg-warning/90">
              {t('zones.automations.activate', 'Активировать')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

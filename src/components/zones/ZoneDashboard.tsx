import { memo, useState, useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { useZoneTasks } from '@/hooks/zones/useZoneTasks';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { useZoneInvoices } from '@/hooks/zones/useZoneInvoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { addDays, subDays, isAfter } from 'date-fns';

import { formatRelativeTime } from '@/lib/utils/format';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Users from 'lucide-react/dist/esm/icons/users';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Target from 'lucide-react/dist/esm/icons/target';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import History from 'lucide-react/dist/esm/icons/history';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Clock3 from 'lucide-react/dist/esm/icons/clock-3';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import PlusCircle from 'lucide-react/dist/esm/icons/plus-circle';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Zap from 'lucide-react/dist/esm/icons/zap';
import { LoadingSkeleton } from '@/components/dashboard-v2/common/LoadingSkeleton';
import { cn } from '@/lib/utils/utils';

interface Props {
  zoneId: string;
}

type Period = '7d' | '30d' | '90d' | 'all';
type DashboardRoute = `/dashboard/${'zone-deals' | 'zone-contacts' | 'zone-tasks' | 'zone-invoices' | 'zone-automations'}`;
type ActionTone = 'primary' | 'warning' | 'danger' | 'success';

interface NextAction {
  id: string;
  title: string;
  description: string;
  label: string;
  route: DashboardRoute;
  tone: ActionTone;
}

interface QueueItem {
  id: string;
  title: string;
  meta: string;
  route: DashboardRoute;
  tone: ActionTone;
}

interface ActivationStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  route: DashboardRoute;
}

const getPeriodOptions = (t: any): { value: Period; label: string }[] => [
  { value: '7d', label: t('zones.dashboard.period7d', '7 дней') },
  { value: '30d', label: t('zones.dashboard.period30d', '30 дней') },
  { value: '90d', label: t('zones.dashboard.period90d', '90 дней') },
  { value: 'all', label: t('common.allTime', 'Всё время') },
];

const FUNNEL_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];
const ACTION_TONE_CLASS: Record<ActionTone, string> = {
  primary: 'border-primary/25 bg-primary/5',
  warning: 'border-amber-500/25 bg-amber-500/5',
  danger: 'border-destructive/25 bg-destructive/5',
  success: 'border-emerald-500/25 bg-emerald-500/5',
};

export const ZoneDashboard = memo(function ZoneDashboard({ zoneId }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { deals, stages, activities, loading: dealsLoading } = useZoneDeals(zoneId);
  const { tasks, loading: tasksLoading } = useZoneTasks(zoneId);
  const { contacts, loading: contactsLoading } = useZoneContacts(zoneId);
  const { invoices, loading: invoicesLoading } = useZoneInvoices(zoneId);
  const [period, setPeriod] = useState<Period>('30d');

  const periodOptions = useMemo(() => getPeriodOptions(t), [t]);
  const isLoading = dealsLoading || tasksLoading || contactsLoading || invoicesLoading;
  const locale = i18n.language?.split('-')[0] ?? 'ru';

  const cutoffDate = useMemo(() => {
    if (period === 'all') return null;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return subDays(new Date(), days);
  }, [period]);

  const filteredDeals = useMemo(() => {
    if (!cutoffDate) return deals;
    return deals.filter(d => isAfter(new Date(d.created_at), cutoffDate));
  }, [deals, cutoffDate]);

  const filteredInvoices = useMemo(() => {
    if (!cutoffDate) return invoices;
    return invoices.filter(i => isAfter(new Date(i.created_at), cutoffDate));
  }, [invoices, cutoffDate]);

  // Key metrics
  const metrics = useMemo(() => {
    const open = filteredDeals.filter(d => d.status === 'open');
    const won = filteredDeals.filter(d => d.status === 'won');
    const lost = filteredDeals.filter(d => d.status === 'lost');
    const pipelineValue = open.reduce((s, d) => s + Number(d.value_amount || 0), 0);
    const wonValue = won.reduce((s, d) => s + Number(d.value_amount || 0), 0);
    const total = won.length + lost.length;
    const winRate = total > 0 ? Math.round((won.length / total) * 100) : 0;

    const overdueTasks = tasks.filter(t =>
      t.due_date && t.status !== 'done' && t.status !== 'cancelled' && new Date(t.due_date) < new Date()
    ).length;

    const paidAmount = filteredInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
    const pendingAmount = filteredInvoices.filter(i => i.status === 'created').reduce((s, i) => s + Number(i.amount), 0);

    // Trend calculation for paid amount
    let trend = '';
    if (period !== 'all' && cutoffDate) {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const prevCutoff = subDays(cutoffDate, days);
      const prevInvoices = invoices.filter(i =>
        isAfter(new Date(i.created_at), prevCutoff) &&
        !isAfter(new Date(i.created_at), cutoffDate) &&
        i.status === 'paid'
      );
      const prevPaidAmount = prevInvoices.reduce((s, i) => s + Number(i.amount), 0);
      if (prevPaidAmount > 0) {
        const diff = ((paidAmount - prevPaidAmount) / prevPaidAmount) * 100;
        trend = (diff >= 0 ? '+' : '') + Math.round(diff) + '%';
      }
    }

    return {
      open: open.length, won: won.length, lost: lost.length, pipelineValue, wonValue, winRate,
      overdueTasks,
      paidAmount, pendingAmount,
      trend
    };
  }, [filteredDeals, tasks, filteredInvoices, invoices, period, cutoffDate]);

  // Funnel data from stages
  const funnelData = useMemo(() => {
    const sortedStages = [...stages].sort((a, b) => a.order_index - b.order_index);
    return sortedStages.map(stage => {
      const count = filteredDeals.filter(d => d.stage_id === stage.id && d.status === 'open').length;
      return { name: stage.name, value: count, fill: stage.color };
    }).filter(d => d.value > 0);
  }, [stages, filteredDeals]);

  // Deals by stage for bar chart
  const stageBarData = useMemo(() => {
    const sortedStages = [...stages].sort((a, b) => a.order_index - b.order_index);
    return sortedStages.map(stage => {
      const stageDeals = filteredDeals.filter(d => d.stage_id === stage.id && d.status === 'open');
      const value = stageDeals.reduce((s, d) => s + Number(d.value_amount || 0), 0);
      return { name: stage.name, count: stageDeals.length, value, color: stage.color };
    });
  }, [stages, filteredDeals]);

  const operatingModel = useMemo(() => {
    const now = new Date();
    const dueSoonLimit = addDays(now, 2);
    const activeTasks = tasks.filter(task => task.status !== 'done' && task.status !== 'cancelled');
    const overdueTasks = activeTasks
      .filter(task => task.due_date && new Date(task.due_date) < now)
      .sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime());
    const dueSoonTasks = activeTasks
      .filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        return dueDate >= now && dueDate <= dueSoonLimit;
      })
      .sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime());
    const openDeals = deals.filter(deal => deal.status === 'open');
    const dealsWithoutNextStep = openDeals
      .filter(deal => !deal.next_step && !deal.next_step_at)
      .sort((a, b) => new Date(a.updated_at || a.created_at).getTime() - new Date(b.updated_at || b.created_at).getTime());
    const nextStepDeals = openDeals
      .filter(deal => deal.next_step_at && new Date(deal.next_step_at) <= dueSoonLimit)
      .sort((a, b) => new Date(a.next_step_at || 0).getTime() - new Date(b.next_step_at || 0).getTime());
    const pendingInvoices = invoices
      .filter(invoice => invoice.status === 'created')
      .sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
    const failedInvoices = invoices.filter(invoice => invoice.status === 'failed' || invoice.status === 'expired');
    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
    const contactsWithoutDeals = contacts.filter(contact => !deals.some(deal => deal.contact_id === contact.id));

    const activationSteps: ActivationStep[] = [
      {
        id: 'contacts',
        title: t('zones.dashboard.activationContacts', 'Добавить клиента'),
        description: t('zones.dashboard.activationContactsDesc', 'Контакты становятся базой CRM и связаны со сделками, задачами и инвойсами.'),
        done: contacts.length > 0,
        route: '/dashboard/zone-contacts',
      },
      {
        id: 'deals',
        title: t('zones.dashboard.activationDeals', 'Завести сделку'),
        description: t('zones.dashboard.activationDealsDesc', 'Открытая сделка показывает, где находится продажа и какая сумма в работе.'),
        done: deals.length > 0,
        route: '/dashboard/zone-deals',
      },
      {
        id: 'tasks',
        title: t('zones.dashboard.activationTasks', 'Поставить задачу'),
        description: t('zones.dashboard.activationTasksDesc', 'Задачи удерживают следующий шаг по клиенту и срок исполнения.'),
        done: tasks.length > 0,
        route: '/dashboard/zone-tasks',
      },
      {
        id: 'invoices',
        title: t('zones.dashboard.activationInvoices', 'Выставить инвойс'),
        description: t('zones.dashboard.activationInvoicesDesc', 'Финансы связывают оплату с клиентом или сделкой без отдельной таблицы.'),
        done: invoices.length > 0,
        route: '/dashboard/zone-invoices',
      },
      {
        id: 'automations',
        title: t('zones.dashboard.activationAutomations', 'Настроить автоматизацию'),
        description: t('zones.dashboard.activationAutomationsDesc', 'Правила используют существующие события зоны: этап сделки, новый контакт, оплата.'),
        done: activities.some(activity => activity.type?.includes('automation')),
        route: '/dashboard/zone-automations',
      },
    ];

    const completedSteps = activationSteps.filter(step => step.done).length;
    const baseScore =
      (contacts.length > 0 ? 20 : 0) +
      (openDeals.length > 0 ? 25 : 0) +
      (activeTasks.length > 0 ? 20 : 0) +
      (pendingInvoices.length > 0 || paidInvoices.length > 0 ? 20 : 0) +
      (activities.length > 0 ? 15 : 0);
    const riskPenalty = Math.min(35, overdueTasks.length * 6 + dealsWithoutNextStep.length * 3 + failedInvoices.length * 8);
    const healthScore = Math.max(0, Math.min(100, baseScore - riskPenalty));

    const nextActions: NextAction[] = [];
    if (contacts.length === 0) {
      nextActions.push({
        id: 'add-contact',
        title: t('zones.dashboard.actionAddContact', 'Добавьте первого клиента'),
        description: t('zones.dashboard.actionAddContactDesc', 'Без контактов зона не превращается в рабочую CRM.'),
        label: t('zones.dashboard.openContacts', 'Открыть контакты'),
        route: '/dashboard/zone-contacts',
        tone: 'primary',
      });
    }
    if (deals.length === 0) {
      nextActions.push({
        id: 'add-deal',
        title: t('zones.dashboard.actionAddDeal', 'Создайте первую сделку'),
        description: t('zones.dashboard.actionAddDealDesc', 'Сделка связывает клиента, сумму, этап и следующий шаг.'),
        label: t('zones.dashboard.openDeals', 'Открыть сделки'),
        route: '/dashboard/zone-deals',
        tone: 'primary',
      });
    }
    if (tasks.length === 0 && openDeals.length > 0) {
      nextActions.push({
        id: 'add-task',
        title: t('zones.dashboard.actionAddTask', 'Закрепите следующий шаг задачей'),
        description: t('zones.dashboard.actionAddTaskDesc', 'Открытые сделки без задач быстро теряют контекст.'),
        label: t('zones.dashboard.openTasks', 'Открыть задачи'),
        route: '/dashboard/zone-tasks',
        tone: 'warning',
      });
    }
    if (overdueTasks.length > 0) {
      nextActions.push({
        id: 'resolve-overdue',
        title: t('zones.dashboard.actionOverdue', 'Закройте просроченные задачи'),
        description: t('zones.dashboard.actionOverdueDesc', '{{count}} задач требуют решения сегодня.', { count: overdueTasks.length }),
        label: t('zones.dashboard.openTasks', 'Открыть задачи'),
        route: '/dashboard/zone-tasks',
        tone: 'danger',
      });
    }
    if (dealsWithoutNextStep.length > 0) {
      nextActions.push({
        id: 'set-next-step',
        title: t('zones.dashboard.actionNextStep', 'Назначьте следующий шаг'),
        description: t('zones.dashboard.actionNextStepDesc', '{{count}} открытых сделок не имеют понятного продолжения.', { count: dealsWithoutNextStep.length }),
        label: t('zones.dashboard.openDeals', 'Открыть сделки'),
        route: '/dashboard/zone-deals',
        tone: 'warning',
      });
    }
    if (pendingInvoices.length > 0) {
      nextActions.push({
        id: 'collect-payments',
        title: t('zones.dashboard.actionCollectPayments', 'Проверьте оплаты'),
        description: t('zones.dashboard.actionCollectPaymentsDesc', '{{count}} инвойсов ожидают оплату.', { count: pendingInvoices.length }),
        label: t('zones.dashboard.openFinance', 'Открыть финансы'),
        route: '/dashboard/zone-invoices',
        tone: 'success',
      });
    }
    if (invoices.length === 0 && deals.length > 0) {
      nextActions.push({
        id: 'create-invoice',
        title: t('zones.dashboard.actionCreateInvoice', 'Монетизируйте сделку'),
        description: t('zones.dashboard.actionCreateInvoiceDesc', 'Выставьте инвойс из существующего финансового ядра зоны.'),
        label: t('zones.dashboard.openFinance', 'Открыть финансы'),
        route: '/dashboard/zone-invoices',
        tone: 'success',
      });
    }
    if (nextActions.length === 0) {
      nextActions.push({
        id: 'healthy',
        title: t('zones.dashboard.actionHealthy', 'Зона в рабочем режиме'),
        description: t('zones.dashboard.actionHealthyDesc', 'Продолжайте вести сделки и фиксировать следующие шаги.'),
        label: t('zones.dashboard.openDeals', 'Открыть сделки'),
        route: '/dashboard/zone-deals',
        tone: 'success',
      });
    }

    const workQueue: QueueItem[] = [
      ...overdueTasks.slice(0, 3).map(task => ({
        id: `task-overdue-${task.id}`,
        title: task.title,
        meta: t('zones.dashboard.queueOverdue', 'Просрочено: {{date}}', {
          date: task.due_date ? formatRelativeTime(task.due_date, locale) : t('common.unknown', 'неизвестно'),
        }),
        route: '/dashboard/zone-tasks' as DashboardRoute,
        tone: 'danger' as ActionTone,
      })),
      ...dueSoonTasks.slice(0, 3).map(task => ({
        id: `task-due-${task.id}`,
        title: task.title,
        meta: t('zones.dashboard.queueDueSoon', 'Срок: {{date}}', {
          date: task.due_date ? formatRelativeTime(task.due_date, locale) : t('common.unknown', 'неизвестно'),
        }),
        route: '/dashboard/zone-tasks' as DashboardRoute,
        tone: 'warning' as ActionTone,
      })),
      ...nextStepDeals.slice(0, 3).map(deal => ({
        id: `deal-next-${deal.id}`,
        title: deal.title,
        meta: deal.next_step || t('zones.dashboard.queueDealNextStep', 'Следующий шаг по сделке'),
        route: '/dashboard/zone-deals' as DashboardRoute,
        tone: 'primary' as ActionTone,
      })),
      ...dealsWithoutNextStep.slice(0, 3).map(deal => ({
        id: `deal-empty-step-${deal.id}`,
        title: deal.title,
        meta: t('zones.dashboard.queueNoNextStep', 'Нет следующего шага'),
        route: '/dashboard/zone-deals' as DashboardRoute,
        tone: 'warning' as ActionTone,
      })),
      ...pendingInvoices.slice(0, 3).map(invoice => ({
        id: `invoice-${invoice.id}`,
        title: invoice.description || t('zones.dashboard.queueInvoice', 'Инвойс #{{id}}', { id: invoice.invoice_number ?? invoice.id.slice(0, 6) }),
        meta: t('zones.dashboard.queueInvoicePending', 'Ожидает оплату'),
        route: '/dashboard/zone-invoices' as DashboardRoute,
        tone: 'success' as ActionTone,
      })),
    ].slice(0, 6);

    return {
      activeTasks,
      overdueTasks,
      dueSoonTasks,
      dealsWithoutNextStep,
      pendingInvoices,
      failedInvoices,
      contactsWithoutDeals,
      activationSteps,
      completedSteps,
      healthScore,
      nextActions: nextActions.slice(0, 4),
      workQueue,
    };
  }, [tasks, deals, invoices, contacts, activities, t, locale]);

    if (isLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] overflow-y-auto bg-background/5">
        <div className="flex items-center justify-between p-4 border-b border-border/30 sticky top-0 bg-background/80 backdrop-blur-md z-10 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-lg font-bold">{t('zones.dashboard.title', 'Операционный центр')}</h1>
          </div>
        </div>
        <div className="p-4">
          <LoadingSkeleton variant="stats" />
        </div>
      </div>
    );
  }

  const formatCurrencyValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toString();
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat(locale === 'ru' ? 'ru-KZ' : locale, {
      style: 'currency',
      currency: 'KZT',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] overflow-y-auto bg-background/5">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 sticky top-0 bg-background/80 backdrop-blur-md z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-lg font-bold">{t('zones.dashboard.title', 'Операционный центр')}</h1>
        </div>
        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
          {periodOptions.map(p => (
              <Button
                key={p.value}
                size="sm"
                variant={period === p.value ? 'secondary' : 'ghost'}
                className={cn(
                  "text-xs min-h-11 px-3 rounded-md transition-all",
                  period === p.value ? "shadow-sm bg-background" : "text-muted-foreground"
                )}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="grid xl:grid-cols-[1.25fr_0.75fr] gap-4">
          <Card className="bg-gradient-to-br from-primary/10 via-background/60 to-background/40 backdrop-blur-md border-primary/20 overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm uppercase font-black tracking-widest">
                      {t('zones.dashboard.commandCenter', 'Командный центр зоны')}
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {t('zones.dashboard.commandCenterDesc', 'Приоритеты собраны из сделок, задач, контактов и инвойсов. Начинайте день здесь, затем переходите в нужный рабочий экран.')}
                  </p>
                </div>
                <Badge variant={operatingModel.healthScore >= 70 ? 'default' : operatingModel.healthScore >= 40 ? 'secondary' : 'destructive'} className="shrink-0">
                  {t('zones.dashboard.healthBadge', 'Health {{score}}%', { score: operatingModel.healthScore })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    operatingModel.healthScore >= 70 ? 'bg-emerald-500' : operatingModel.healthScore >= 40 ? 'bg-amber-500' : 'bg-destructive'
                  )}
                  style={{ width: `${operatingModel.healthScore}%` }}
                />
              </div>
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <CommandMetric
                  icon={<Clock3 className="h-4 w-4" />}
                  label={t('zones.dashboard.todayFocus', 'Фокус сегодня')}
                  value={(operatingModel.overdueTasks.length + operatingModel.dueSoonTasks.length).toString()}
                  sub={t('zones.dashboard.todayFocusDesc', 'задач со сроком')}
                  tone={operatingModel.overdueTasks.length > 0 ? 'danger' : 'primary'}
                />
                <CommandMetric
                  icon={<Target className="h-4 w-4" />}
                  label={t('zones.dashboard.dealsNeedStep', 'Без шага')}
                  value={operatingModel.dealsWithoutNextStep.length.toString()}
                  sub={t('zones.dashboard.dealsNeedStepDesc', 'открытых сделок')}
                  tone={operatingModel.dealsWithoutNextStep.length > 0 ? 'warning' : 'success'}
                />
                <CommandMetric
                  icon={<Receipt className="h-4 w-4" />}
                  label={t('zones.dashboard.moneyAtWork', 'Деньги в работе')}
                  value={formatCurrency(metrics.pendingAmount)}
                  sub={t('zones.dashboard.moneyAtWorkDesc', 'ожидает оплату')}
                  tone={metrics.pendingAmount > 0 ? 'success' : 'primary'}
                />
                <CommandMetric
                  icon={<Users className="h-4 w-4" />}
                  label={t('zones.dashboard.contactsWithoutDeals', 'Без сделки')}
                  value={operatingModel.contactsWithoutDeals.length.toString()}
                  sub={t('zones.dashboard.contactsWithoutDealsDesc', 'контактов можно развить')}
                  tone={operatingModel.contactsWithoutDeals.length > 0 ? 'primary' : 'success'}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => navigate('/dashboard/zone-deals')}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  {t('zones.dashboard.quickDeal', 'Сделка')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/zone-tasks')}>
                  <ClipboardList className="h-4 w-4 mr-2" />
                  {t('zones.dashboard.quickTask', 'Задача')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => navigate('/dashboard/zone-invoices')}>
                  <Receipt className="h-4 w-4 mr-2" />
                  {t('zones.dashboard.quickInvoice', 'Инвойс')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate('/dashboard/zone-automations')}>
                  <Zap className="h-4 w-4 mr-2" />
                  {t('zones.dashboard.quickAutomation', 'Автоматизации')}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/40 backdrop-blur-md border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm uppercase font-black tracking-widest">
                    {t('zones.dashboard.nextActions', 'Следующие действия')}
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-xs">
                  {operatingModel.completedSteps}/{operatingModel.activationSteps.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {operatingModel.nextActions.map(action => (
                <div key={action.id} className={cn('rounded-xl border p-3 space-y-2', ACTION_TONE_CLASS[action.tone])}>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">{action.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 px-0 hover:bg-transparent" onClick={() => navigate(action.route)}>
                    {action.label}
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-[1fr_0.75fr] gap-4">
          <Card className="bg-background/40 backdrop-blur-sm border-border/40">
            <CardHeader className="pb-3 border-b border-border/10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs uppercase font-bold tracking-widest">
                    {t('zones.dashboard.workQueue', 'Очередь работ')}
                  </CardTitle>
                </div>
                <Button size="sm" variant="ghost" onClick={() => navigate('/dashboard/zone-tasks')} className="text-xs">
                  {t('zones.dashboard.openQueue', 'Открыть доску')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {operatingModel.workQueue.length > 0 ? (
                <div className="divide-y divide-border/10">
                  {operatingModel.workQueue.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.route)}
                      className="w-full text-left p-4 hover:bg-muted/30 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold line-clamp-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.meta}</p>
                      </div>
                      <span className={cn('h-2.5 w-2.5 rounded-full mt-1.5 shrink-0', {
                        'bg-destructive': item.tone === 'danger',
                        'bg-amber-500': item.tone === 'warning',
                        'bg-primary': item.tone === 'primary',
                        'bg-emerald-500': item.tone === 'success',
                      })} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500/70 mb-3" />
                  <p className="text-sm font-semibold">{t('zones.dashboard.queueClear', 'Срочных действий нет')}</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    {t('zones.dashboard.queueClearDesc', 'Добавляйте следующий шаг к каждой сделке, чтобы зона оставалась управляемой.')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-background/40 backdrop-blur-sm border-border/40">
            <CardHeader className="pb-3 border-b border-border/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <CardTitle className="text-xs uppercase font-bold tracking-widest">
                  {t('zones.dashboard.activationMap', 'Карта активации')}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {operatingModel.activationSteps.map(step => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => navigate(step.route)}
                  className="w-full text-left flex gap-3 rounded-xl border border-border/40 p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className={cn('mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0', step.done ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground')}>
                    {step.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<Target className="h-4 w-4 text-primary" />}
            label={t('zones.dashboard.pipeline', 'Воронка')}
            value={`${formatCurrencyValue(metrics.pipelineValue)} ₸`}
            sub={t('zones.dashboard.openDealsCount', '{{count}} открытых сделок', { count: metrics.open })}
          />
          <MetricCard
            icon={<DollarSign className="h-4 w-4 text-green-500" />}
            label={t('zones.dashboard.paid', 'Оплачено')}
            value={`${formatCurrencyValue(metrics.paidAmount)} ₸`}
            sub={t('zones.dashboard.byInvoices', 'по инвойсам')}
            trend={metrics.trend}
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
            label={t('zones.dashboard.winRate', 'Процент побед')}
            value={`${metrics.winRate}%`}
            sub={`${metrics.won}W / ${metrics.lost}L`}
          />
          <MetricCard
            icon={<Users className="h-4 w-4 text-violet-500" />}
            label={t('zones.dashboard.clients', 'Клиенты')}
            value={contacts.length.toString()}
            sub={t('zones.dashboard.inCrmBase', 'в базе CRM')}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Charts Section */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Pipeline by stage */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">{t('zones.dashboard.dealsByStage', 'Сделки по стадиям')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {stageBarData.some(d => d.count > 0) ? (
                    <div style={{ width: '100%', minHeight: 220, minWidth: 0 }}>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={stageBarData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '12px', border: '1px solid hsl(var(--border)/0.5)' }}
                            formatter={(value: number | undefined, name: string | undefined) => [
                              name === 'count' ? t('zones.dashboard.dealsCount', '{{count}} сделок', { count: value ?? 0 }) : `${formatCurrencyValue(value ?? 0)} ₸`,
                              (name === 'count' ? t('common.quantity', 'Количество') : t('common.amount', 'Сумма')) as string
                            ]}
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                            {stageBarData.map((entry, index) => (
                              <Cell key={index} fill={entry.color || 'hsl(var(--primary))'} fillOpacity={0.8} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs italic">
                      {t('zones.dashboard.noDataForPeriod', 'Нет данных за период')}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Funnel */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">{t('zones.dashboard.salesFunnel', 'Воронка продаж')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {funnelData.length > 0 ? (
                    <div className="space-y-3 pt-2">
                      {funnelData.map((stage, i) => {
                        const maxVal = Math.max(...funnelData.map(d => d.value));
                        const widthPct = maxVal > 0 ? (stage.value / maxVal) * 100 : 0;
                        return (
                          <div key={stage.name} className="group">
                            <div className="flex justify-between items-center mb-1 px-1">
                              <span className="text-xs font-medium text-muted-foreground">{stage.name}</span>
                              <span className="text-xs font-bold">{stage.value}</span>
                            </div>
                            <div className="h-6 bg-muted/20 rounded-lg overflow-hidden border border-border/10">
                              <div
                                className="h-full rounded-lg flex items-center px-2 transition-all duration-1000 ease-out"
                                style={{
                                  width: `${Math.max(widthPct, 15)}%`,
                                  backgroundColor: stage.fill || FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                                  opacity: 0.8
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs italic">
                      {t('zones.dashboard.noOpenDeals', 'Нет открытых сделок')}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Finances Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-background/40 backdrop-blur-sm border-border/40">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">{t('zones.dashboard.pendingPayments', 'Ожидаемые платежи')}</CardTitle>
                  <Receipt className="h-4 w-4 text-warning opacity-50" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-warning mb-1">
                    {formatCurrency(metrics.pendingAmount)}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('zones.dashboard.pendingPaymentsDesc', 'Сумма всех активных инвойсов')}</p>
                </CardContent>
              </Card>

              <Card className="bg-background/40 backdrop-blur-sm border-border/40">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">{t('zones.dashboard.overdueTasks', 'Просроченные задачи')}</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive opacity-50" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-destructive mb-1">{metrics.overdueTasks}</div>
                  <p className="text-xs text-muted-foreground">{t('zones.dashboard.overdueTasksDesc', 'Требуют немедленного внимания')}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Activity Sidebar */}
          <div className="space-y-6">
            <Card className="bg-background/40 backdrop-blur-sm border-border/40 h-full">
              <CardHeader className="pb-2 border-b border-border/10">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs uppercase font-bold tracking-widest">{t('zones.dashboard.activity', 'Активность')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {activities.length > 0 ? (
                    <div className="p-4 space-y-6">
                      {activities.slice(0, 15).map((act, i) => (
                        <div key={act.id} className="relative pl-6 pb-2 group">
                          {/* Timeline Line */}
                          {i < activities.length - 1 && (
                            <div className="absolute left-1.5 top-2 bottom-0 w-px bg-border/40" />
                          )}
                          {/* Indicator */}
                          <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background z-10" />

                          <div className="space-y-1">
                            <p className="text-xs font-bold group-hover:text-primary transition-colors line-clamp-2">{act.summary}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(act.happened_at, i18n.language?.split('-')[0] ?? 'en')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-xs italic">
                      {t('zones.dashboard.noRecentActivity', 'Нет недавней активности')}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── Sub-components ───
function MetricCard({ icon, label, value, sub, trend }: { icon: ReactNode; label: string; value: string; sub: string; trend?: string }) {
  return (
    <Card className="bg-background/40 backdrop-blur-md border-border/40 hover:border-primary/20 transition-all border-b-2 border-b-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-xl bg-muted/30">
            {icon}
          </div>
          {trend && (
          <Badge variant="outline" className="text-xs font-bold text-green-500 bg-green-500/5 border-green-500/20">
            {trend}
          </Badge>
          )}
        </div>
        <div className="space-y-0.5">
          <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest">{label}</p>
          <p className="text-2xl font-black">{value}</p>
          <p className="text-xs text-muted-foreground font-medium">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CommandMetric({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: ActionTone;
}) {
  return (
    <div className={cn('rounded-xl border p-3 min-w-0', ACTION_TONE_CLASS[tone])}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-muted-foreground">{icon}</div>
        <span className={cn('h-2 w-2 rounded-full shrink-0', {
          'bg-primary': tone === 'primary',
          'bg-amber-500': tone === 'warning',
          'bg-destructive': tone === 'danger',
          'bg-emerald-500': tone === 'success',
        })} />
      </div>
      <p className="text-xs uppercase font-bold text-muted-foreground tracking-widest">{label}</p>
      <p className="text-xl font-black truncate">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

export default ZoneDashboard;

/**
 * ZoneDashboard - Analytics overview for a business zone
 * Shows pipeline metrics, sales funnel, task overview, and period filtering
 */
import { memo, useState, useMemo } from 'react';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { useZoneTasks } from '@/hooks/zones/useZoneTasks';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from 'recharts';
import { subDays, subMonths, isAfter } from 'date-fns';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Users from 'lucide-react/dist/esm/icons/users';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Target from 'lucide-react/dist/esm/icons/target';
import ListTodo from 'lucide-react/dist/esm/icons/list-todo';

interface Props {
  zoneId: string;
}

type Period = '7d' | '30d' | '90d' | 'all';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: '7d', label: '7 дней' },
  { value: '30d', label: '30 дней' },
  { value: '90d', label: '90 дней' },
  { value: 'all', label: 'Всё время' },
];

const FUNNEL_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export const ZoneDashboard = memo(function ZoneDashboard({ zoneId }: Props) {
  const { deals, stages } = useZoneDeals(zoneId);
  const { tasks } = useZoneTasks(zoneId);
  const { contacts } = useZoneContacts(zoneId);
  const [period, setPeriod] = useState<Period>('30d');

  const cutoffDate = useMemo(() => {
    if (period === 'all') return null;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    return subDays(new Date(), days);
  }, [period]);

  const filteredDeals = useMemo(() => {
    if (!cutoffDate) return deals;
    return deals.filter(d => isAfter(new Date(d.created_at), cutoffDate));
  }, [deals, cutoffDate]);

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
    const openTasks = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length;
    const doneTasks = tasks.filter(t => t.status === 'done').length;

    return { open: open.length, won: won.length, lost: lost.length, pipelineValue, wonValue, winRate, overdueTasks, openTasks, doneTasks };
  }, [filteredDeals, tasks]);

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

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toString();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Аналитика</h1>
        </div>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map(p => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? 'default' : 'outline'}
              className="text-xs h-7"
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon={<Target className="h-4 w-4 text-primary" />}
            label="Pipeline"
            value={`${formatCurrency(metrics.pipelineValue)} ₸`}
            sub={`${metrics.open} сделок`}
          />
          <MetricCard
            icon={<DollarSign className="h-4 w-4 text-green-500" />}
            label="Выиграно"
            value={`${formatCurrency(metrics.wonValue)} ₸`}
            sub={`${metrics.won} сделок`}
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
            label="Win Rate"
            value={`${metrics.winRate}%`}
            sub={`${metrics.won}W / ${metrics.lost}L`}
          />
          <MetricCard
            icon={<Users className="h-4 w-4 text-violet-500" />}
            label="Контакты"
            value={contacts.length.toString()}
            sub="в базе"
          />
        </div>

        {/* Tasks summary */}
        <div className="grid grid-cols-3 gap-3">
          <MiniCard icon={<ListTodo className="h-3.5 w-3.5" />} label="Открытые" value={metrics.openTasks} />
          <MiniCard icon={<CheckCircle2 className="h-3.5 w-3.5 text-green-500" />} label="Выполнено" value={metrics.doneTasks} />
          <MiniCard
            icon={<AlertCircle className="h-3.5 w-3.5 text-destructive" />}
            label="Просрочено"
            value={metrics.overdueTasks}
            destructive={metrics.overdueTasks > 0}
          />
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Pipeline by stage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Сделки по стадиям</CardTitle>
            </CardHeader>
            <CardContent>
              {stageBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stageBarData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === 'count' ? `${value} сделок` : `${formatCurrency(value)} ₸`,
                        name === 'count' ? 'Количество' : 'Сумма'
                      ]}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {stageBarData.map((entry, index) => (
                        <Cell key={index} fill={entry.color || 'hsl(var(--primary))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  Нет данных за выбранный период
                </div>
              )}
            </CardContent>
          </Card>

          {/* Funnel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Воронка продаж</CardTitle>
            </CardHeader>
            <CardContent>
              {funnelData.length > 0 ? (
                <div className="space-y-2">
                  {funnelData.map((stage, i) => {
                    const maxVal = Math.max(...funnelData.map(d => d.value));
                    const widthPct = maxVal > 0 ? (stage.value / maxVal) * 100 : 0;
                    return (
                      <div key={stage.name} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-24 truncate text-right">{stage.name}</span>
                        <div className="flex-1 h-7 bg-muted/50 rounded overflow-hidden">
                          <div
                            className="h-full rounded flex items-center px-2 text-xs font-medium text-primary-foreground transition-all"
                            style={{ width: `${Math.max(widthPct, 8)}%`, backgroundColor: stage.fill || FUNNEL_COLORS[i % FUNNEL_COLORS.length] }}
                          >
                            {stage.value}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  Нет открытых сделок
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
});

// ─── Sub-components ───
function MetricCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

function MiniCard({ icon, label, value, destructive }: { icon: React.ReactNode; label: string; value: number; destructive?: boolean }) {
  return (
    <Card className={destructive ? 'border-destructive/30' : ''}>
      <CardContent className="p-3 flex items-center gap-2">
        {icon}
        <div>
          <p className={`text-lg font-bold ${destructive ? 'text-destructive' : ''}`}>{value}</p>
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ZoneDashboard;

import { memo, useState, useMemo } from 'react';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { useZoneTasks } from '@/hooks/zones/useZoneTasks';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { useZoneInvoices } from '@/hooks/zones/useZoneInvoices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { subDays, isAfter, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { formatRelativeTime } from '@/lib/utils/format';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Users from 'lucide-react/dist/esm/icons/users';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Target from 'lucide-react/dist/esm/icons/target';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import History from 'lucide-react/dist/esm/icons/history';
import { cn } from '@/lib/utils/utils';

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
  const { deals, stages, activities } = useZoneDeals(zoneId);
  const { tasks } = useZoneTasks(zoneId);
  const { contacts } = useZoneContacts(zoneId);
  const { invoices } = useZoneInvoices(zoneId);
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

    return {
      open: open.length, won: won.length, lost: lost.length, pipelineValue, wonValue, winRate,
      overdueTasks,
      paidAmount, pendingAmount
    };
  }, [filteredDeals, tasks, filteredInvoices]);

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

  const formatCurrencyValue = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toString();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] overflow-y-auto bg-background/5">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30 sticky top-0 bg-background/80 backdrop-blur-md z-10 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <h1 className="text-lg font-bold">Аналитика Бизнеса</h1>
        </div>
        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
          {PERIOD_OPTIONS.map(p => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? 'secondary' : 'ghost'}
              className={cn(
                "text-[10px] h-6 px-2 rounded-md transition-all",
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
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon={<Target className="h-4 w-4 text-primary" />}
            label="Pipeline"
            value={`${formatCurrencyValue(metrics.pipelineValue)} ₸`}
            sub={`${metrics.open} открытых сделок`}
          />
          <MetricCard
            icon={<DollarSign className="h-4 w-4 text-green-500" />}
            label="Оплачено"
            value={`${formatCurrencyValue(metrics.paidAmount)} ₸`}
            sub="по инвойсам"
            trend="+12%"
          />
          <MetricCard
            icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
            label="Win Rate"
            value={`${metrics.winRate}%`}
            sub={`${metrics.won}W / ${metrics.lost}L`}
          />
          <MetricCard
            icon={<Users className="h-4 w-4 text-violet-500" />}
            label="Клиенты"
            value={contacts.length.toString()}
            sub="в базе CRM"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Charts Section */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Pipeline by stage */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Сделки по стадиям</CardTitle>
                </CardHeader>
                <CardContent>
                  {stageBarData.some(d => d.count > 0) ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={stageBarData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--background))', borderRadius: '12px', border: '1px solid hsl(var(--border)/0.5)' }}
                          formatter={(value: number, name: string) => [
                            name === 'count' ? `${value} сделок` : `${formatCurrencyValue(value)} ₸`,
                            name === 'count' ? 'Количество' : 'Сумма'
                          ]}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                          {stageBarData.map((entry, index) => (
                            <Cell key={index} fill={entry.color || 'hsl(var(--primary))'} fillOpacity={0.8} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground text-xs italic">
                      Нет данных за период
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Funnel */}
              <Card className="bg-background/40 backdrop-blur-sm border-border/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Воронка продаж</CardTitle>
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
                              <span className="text-[10px] font-medium text-muted-foreground">{stage.name}</span>
                              <span className="text-[10px] font-bold">{stage.value}</span>
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
                      Нет открытых сделок
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Finances Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-background/40 backdrop-blur-sm border-border/40">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Ожидаемые платежи</CardTitle>
                  <Receipt className="h-4 w-4 text-warning opacity-50" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-warning mb-1">
                    {new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(metrics.pendingAmount)}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Сумма всех активных инвойсов</p>
                </CardContent>
              </Card>

              <Card className="bg-background/40 backdrop-blur-sm border-border/40">
                <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Просроченные задачи</CardTitle>
                  <AlertCircle className="h-4 w-4 text-destructive opacity-50" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-destructive mb-1">{metrics.overdueTasks}</div>
                  <p className="text-[10px] text-muted-foreground">Требуют немедленного внимания</p>
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
                  <CardTitle className="text-xs uppercase font-bold tracking-widest">Активность</CardTitle>
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
                            <p className="text-[11px] font-bold group-hover:text-primary transition-colors line-clamp-2">{act.summary}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatRelativeTime(act.happened_at, 'ru')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-xs italic">
                      Нет недавней активности
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
function MetricCard({ icon, label, value, sub, trend }: { icon: React.ReactNode; label: string; value: string; sub: string; trend?: string }) {
  return (
    <Card className="bg-background/40 backdrop-blur-md border-border/40 hover:border-primary/20 transition-all border-b-2 border-b-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 rounded-xl bg-muted/30">
            {icon}
          </div>
          {trend && (
            <Badge variant="outline" className="text-[10px] font-bold text-green-500 bg-green-500/5 border-green-500/20">
              {trend}
            </Badge>
          )}
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{label}</p>
          <p className="text-2xl font-black">{value}</p>
          <p className="text-[10px] text-muted-foreground font-medium">{sub}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default ZoneDashboard;

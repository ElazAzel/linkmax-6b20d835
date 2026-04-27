import { useEffect, useState } from 'react';
import { supabase } from '@/platform/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import Users from 'lucide-react/dist/esm/icons/users';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Activity from 'lucide-react/dist/esm/icons/activity';
import Target from 'lucide-react/dist/esm/icons/target';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

type Metrics = {
  period_days: number;
  generated_at: string;
  users: { total: number; new_period: number; new_prev_period: number; paid: number; mau: number; dau: number; conversion_rate: number };
  pages: { total: number; published: number };
  leads: { total: number; period: number; prev_period: number };
  bookings: { total: number; period: number };
  revenue: { gmv_period: number; gmv_prev_period: number; paid_orders: number; arpu: number };
  trend: Array<{ day: string; new_users: number; leads: number; gmv: number }>;
};

const PERIODS = [7, 30, 90];

function pctDelta(current: number, prev: number): number {
  if (prev === 0) return current > 0 ? 100 : 0;
  return ((current - prev) / prev) * 100;
}

function DeltaBadge({ value }: { value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <Badge variant={positive ? 'default' : 'destructive'} className="gap-1 text-xs">
      <Icon className="h-3 w-3" />
      {positive ? '+' : ''}{value.toFixed(1)}%
    </Badge>
  );
}

function StatCard({
  title, value, subtitle, icon: Icon, delta,
}: { title: string; value: string | number; subtitle?: string; icon: React.ElementType; delta?: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {delta !== undefined && <DeltaBadge value={delta} />}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export function AdminGrowthTab() {
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (period: number) => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.rpc('get_growth_metrics', { p_days: period });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setData(data as unknown as Metrics);
    setLoading(false);
  };

  useEffect(() => { load(days); }, [days]);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Error: {error}</p>
          <Button onClick={() => load(days)} className="mt-4"><RefreshCw className="h-4 w-4 mr-2" />Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const userDelta = pctDelta(data.users.new_period, data.users.new_prev_period);
  const leadDelta = pctDelta(data.leads.period, data.leads.prev_period);
  const gmvDelta = pctDelta(Number(data.revenue.gmv_period), Number(data.revenue.gmv_prev_period));

  // MRR proxy: paid users * average ARPU (rough)
  const estimatedMRR = data.users.paid * (Number(data.revenue.arpu) || 0);

  const chartData = data.trend.map(t => ({
    day: new Date(t.day).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' }),
    Users: t.new_users,
    Leads: t.leads,
    GMV: Number(t.gmv),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Growth Metrics</h2>
          <p className="text-sm text-muted-foreground">Investor-grade KPIs · last {days} days</p>
        </div>
        <div className="flex gap-2 items-center">
          {PERIODS.map(p => (
            <Button
              key={p}
              variant={days === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDays(p)}
            >
              {p}d
            </Button>
          ))}
          <Button variant="ghost" size="sm" onClick={() => load(days)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Top KPIs — North-star metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="GMV (period)"
          value={`${Number(data.revenue.gmv_period).toLocaleString('ru')} ₸`}
          subtitle={`${data.revenue.paid_orders} paid orders · ARPU ${Number(data.revenue.arpu).toLocaleString('ru')} ₸`}
          icon={DollarSign}
          delta={gmvDelta}
        />
        <StatCard
          title="Est. MRR"
          value={`${Math.round(estimatedMRR).toLocaleString('ru')} ₸`}
          subtitle={`${data.users.paid} paid subscribers`}
          icon={TrendingUp}
        />
        <StatCard
          title="MAU / DAU"
          value={`${data.users.mau} / ${data.users.dau}`}
          subtitle={`Stickiness: ${data.users.mau > 0 ? ((data.users.dau / data.users.mau) * 100).toFixed(1) : '0'}%`}
          icon={Activity}
        />
        <StatCard
          title="Free → Paid"
          value={`${data.users.conversion_rate.toFixed(2)}%`}
          subtitle={`${data.users.paid} of ${data.users.total} users`}
          icon={Target}
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="New users"
          value={data.users.new_period}
          subtitle={`Total: ${data.users.total}`}
          icon={Users}
          delta={userDelta}
        />
        <StatCard
          title="Leads (period)"
          value={data.leads.period}
          subtitle={`Total: ${data.leads.total}`}
          icon={Inbox}
          delta={leadDelta}
        />
        <StatCard
          title="Pages published"
          value={data.pages.published}
          subtitle={`Total: ${data.pages.total} · Activation: ${data.pages.total > 0 ? ((data.pages.published / data.pages.total) * 100).toFixed(0) : 0}%`}
          icon={FileText}
        />
        <StatCard
          title="Bookings (period)"
          value={data.bookings.period}
          subtitle={`Total: ${data.bookings.total}`}
          icon={Activity}
        />
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily trend — Users & Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Line type="monotone" dataKey="Users" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Leads" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* GMV Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Daily revenue (GMV, ₸)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="GMV" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Generated: {new Date(data.generated_at).toLocaleString('ru')}
      </p>
    </div>
  );
}

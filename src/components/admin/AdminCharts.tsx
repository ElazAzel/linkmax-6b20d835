import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { useAdminStats } from '@/hooks/admin/useAdminData';

interface DailyData {
  date: string;
  users: number;
  pages: number;
  views: number;
  clicks: number;
  shares: number;
  blocks: number;
  friendships: number;
  collabs: number;
}

interface UserStatusData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface EventTypeData {
  name: string;
  count: number;
  color: string;
}

interface SocialStatsData {
  name: string;
  total: number;
  accepted: number;
}

const COLORS = {
  primary: 'hsl(var(--primary))',
  users: '#8b5cf6',
  pages: '#10b981',
  views: '#06b6d4',
  clicks: '#f97316',
  shares: '#ec4899',
  premium: '#eab308',
  trial: '#3b82f6',
  free: '#6b7280'
};

export function AdminCharts() {
  const { t } = useTranslation();
  const { data: stats, isLoading: loading } = useAdminStats(14);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const {
    dailyGrowth: dailyData,
    userDistribution: userStatusData,
    eventDistribution: eventTypeData,
    cumulativeUsers,
    socialStats,
    blockTypeStats
  } = stats;


  return (
    <div className="space-y-6">
      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('adminCharts.userGrowth', 'Рост пользователей')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeUsers}>
                <defs>
                  <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.users} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.users} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name={t('adminCharts.totalUsers', 'Всего пользователей')}
                  stroke={COLORS.users}
                  fill="url(#userGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Daily Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Registrations */}
        <Card>
          <CardHeader>
            <CardTitle>{t('adminCharts.newRegistrations', 'Новые регистрации (14 дней)')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar
                    dataKey="users"
                    name={t('adminCharts.users', 'Пользователи')}
                    fill={COLORS.users}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="pages"
                    name={t('adminCharts.pages', 'Страницы')}
                    fill={COLORS.pages}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Events Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('adminCharts.eventsTitle', 'События (14 дней)')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="views"
                    name={t('adminCharts.events.views', 'Просмотры')}
                    stroke={COLORS.views}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    name={t('adminCharts.events.clicks', 'Клики')}
                    stroke={COLORS.clicks}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="shares"
                    name={t('adminCharts.events.shares', 'Шейры')}
                    stroke={COLORS.shares}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('adminCharts.userDistribution', 'Распределение пользователей')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {userStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {userStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Event Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('adminCharts.eventTypes', 'Типы событий')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eventTypeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name={t('adminCharts.count', 'Количество')}
                    radius={[0, 4, 4, 0]}
                  >
                    {eventTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Social & Community Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Social Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('adminCharts.socialActivity', 'Социальная активность')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={socialStats}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" name={t('adminCharts.total', 'Всего')} fill={COLORS.users} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="accepted" name={t('adminCharts.accepted', 'Принято')} fill={COLORS.pages} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Block Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('adminCharts.popularBlockTypes', 'Популярные типы блоков')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={blockTypeStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" name={t('adminCharts.count', 'Количество')} radius={[0, 4, 4, 0]}>
                    {blockTypeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Social Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('adminCharts.socialActivity14Days', 'Социальная активность за 14 дней')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="friendsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.pages} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.pages} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="collabsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.trial} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.trial} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="friendships"
                  name={t('adminCharts.social.friendships', 'Дружбы')}
                  stroke={COLORS.pages}
                  fill="url(#friendsGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="collabs"
                  name={t('adminCharts.social.collaborations', 'Коллаборации')}
                  stroke={COLORS.trial}
                  fill="url(#collabsGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Content Creation Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('adminCharts.contentCreation14Days', 'Создание контента за 14 дней')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="blocksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.shares} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.shares} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="pages"
                  name={t('adminCharts.pages', 'Страницы')}
                  stroke={COLORS.pages}
                  fill={COLORS.pages}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="blocks"
                  name={t('adminCharts.blocks', 'Блоки')}
                  stroke={COLORS.shares}
                  fill="url(#blocksGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

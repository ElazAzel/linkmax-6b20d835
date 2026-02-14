import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Crown,
  ShoppingCart,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  PiggyBank,
  BarChart3,
  Users,
  DollarSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import {
  getTokenAnalytics,
  getAllTransactions,
  getAllWithdrawals,
  processWithdrawal,
  TokenTransaction,
  WithdrawalRequest,
} from '@/services/tokens';
import { useAuth } from '@/hooks/useAuth';
import i18n from '@/i18n/config';

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  subtitle 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-muted-foreground',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <div className={`p-2 rounded-lg bg-primary/10 ${trend ? trendColors[trend] : 'text-primary'}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getDateLocale() {
  const lang = i18n.language;
  if (lang === 'ru') return ru;
  if (lang === 'kk') return kk;
  return enUS;
}

export function AdminTokensTab() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Analytics query
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['token-analytics', dateRange],
    queryFn: () => getTokenAnalytics(dateRange.start || undefined, dateRange.end || undefined),
    staleTime: 60000,
  });

  // Transactions query
  const { data: transactions = [], isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery({
    queryKey: ['admin-transactions', transactionFilter],
    queryFn: () => getAllTransactions(100, 0, transactionFilter !== 'all' ? { itemType: transactionFilter } : undefined),
    staleTime: 30000,
  });

  // Withdrawals query
  const { data: withdrawals = [], isLoading: withdrawalsLoading, refetch: refetchWithdrawals } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => getAllWithdrawals(),
    staleTime: 30000,
  });

  const handleProcessWithdrawal = async (id: string, status: 'approved' | 'rejected' | 'completed') => {
    if (!user) return;
    await processWithdrawal(id, status, user.id);
    refetchWithdrawals();
  };

  const formatAmount = (amount: number) => {
    const prefix = amount >= 0 ? '+' : '';
    return `${prefix}${amount.toFixed(2)}`;
  };

  const getTransactionIcon = (transaction: TokenTransaction) => {
    if (transaction.itemType === 'premium') return Crown;
    if (transaction.itemType === 'template') return FileText;
    if (transaction.itemType === 'product') return ShoppingCart;
    if (transaction.type === 'earn') return TrendingUp;
    if (transaction.type === 'spend') return TrendingDown;
    return ArrowRightLeft;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500"><Clock className="h-3 w-3 mr-1" /> {t('adminTokens.status.pending', 'Ожидает')}</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500"><CheckCircle className="h-3 w-3 mr-1" /> {t('adminTokens.status.approved', 'Одобрено')}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500"><CheckCircle className="h-3 w-3 mr-1" /> {t('adminTokens.status.completed', 'Выполнено')}</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500"><XCircle className="h-3 w-3 mr-1" /> {t('adminTokens.status.rejected', 'Отклонено')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (analyticsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          {t('adminTokens.title', 'Экономика токенов')}
        </h2>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="w-auto"
          />
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="w-auto"
          />
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t('adminTokens.stats.inCirculation', 'В обращении')}
          value={`${Number(analytics?.total_tokens_in_circulation || 0).toLocaleString()} ₸`}
          icon={Coins}
          subtitle={t('adminTokens.stats.inCirculationDesc', 'Все токены пользователей')}
        />
        <StatCard
          title={t('adminTokens.stats.totalEarned', 'Заработано всего')}
          value={`${Number(analytics?.total_earned_all_time || 0).toLocaleString()} ₸`}
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title={t('adminTokens.stats.totalSpent', 'Потрачено всего')}
          value={`${Number(analytics?.total_spent_all_time || 0).toLocaleString()} ₸`}
          icon={TrendingDown}
          trend="down"
        />
        <StatCard
          title={t('adminTokens.stats.platformFee', 'Комиссия платформы')}
          value={`${Number(analytics?.platform_fees_earned || 0).toLocaleString()} ₸`}
          icon={PiggyBank}
          subtitle={t('adminTokens.stats.platformFeeDesc', '4% от продаж')}
        />
      </div>

      {/* Purchase Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title={t('adminTokens.stats.premiumPurchases', 'Покупки Premium')}
          value={`${Number(analytics?.premium_purchases || 0).toLocaleString()} ₸`}
          icon={Crown}
        />
        <StatCard
          title={t('adminTokens.stats.templatePurchases', 'Покупки шаблонов')}
          value={`${Number(analytics?.template_purchases || 0).toLocaleString()} ₸`}
          icon={FileText}
        />
        <StatCard
          title={t('adminTokens.stats.productPurchases', 'Покупки товаров')}
          value={`${Number(analytics?.product_purchases || 0).toLocaleString()} ₸`}
          icon={ShoppingCart}
        />
        <StatCard
          title={t('adminTokens.stats.activeUsers', 'Активных пользователей')}
          value={Number(analytics?.active_token_users || 0)}
          icon={Users}
        />
      </div>

      {/* Withdrawal Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          title={t('adminTokens.stats.pendingWithdrawals', 'Ожидающие выводы')}
          value={`${Number(analytics?.pending_withdrawals || 0).toLocaleString()} ₸`}
          icon={Clock}
          trend="neutral"
        />
        <StatCard
          title={t('adminTokens.stats.paidOut', 'Выплачено')}
          value={`${Number(analytics?.completed_withdrawals || 0).toLocaleString()} ₸`}
          icon={Wallet}
          trend="down"
        />
      </div>

      {/* Tabs for detailed views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('adminTokens.tabs.overview', 'Обзор')}
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            {t('adminTokens.tabs.transactions', 'Транзакции')}
          </TabsTrigger>
          <TabsTrigger value="withdrawals">
            <Wallet className="h-4 w-4 mr-2" />
            {t('adminTokens.tabs.withdrawals', 'Выводы')} ({withdrawals.filter(w => w.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('adminTokens.distributionTitle', 'Распределение по типам транзакций')}</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.transactions_by_type ? (
                <div className="space-y-3">
                  {Object.entries(analytics.transactions_by_type as Record<string, number>).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="capitalize">{type.replace(/_/g, ' ')}</span>
                      <Badge variant="secondary">{String(count)}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">{t('adminTokens.noData', 'Нет данных')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{t('adminTokens.historyTitle', 'История транзакций')}</CardTitle>
              <Select value={transactionFilter} onValueChange={setTransactionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t('adminTokens.filter.allTypes', 'Все типы')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('adminTokens.filter.allTypes', 'Все типы')}</SelectItem>
                  <SelectItem value="premium">{t('adminTokens.filter.premium', 'Premium')}</SelectItem>
                  <SelectItem value="template">{t('adminTokens.filter.templates', 'Шаблоны')}</SelectItem>
                  <SelectItem value="product">{t('adminTokens.filter.products', 'Товары')}</SelectItem>
                  <SelectItem value="block_access">{t('adminTokens.filter.paidBlocks', 'Платные блоки')}</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {transactionsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.map(tx => {
                      const Icon = getTransactionIcon(tx);
                      return (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${tx.type === 'earn' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{tx.description || tx.source}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(tx.createdAt), 'dd MMM yyyy HH:mm', { locale: getDateLocale() })}
                              </p>
                              {tx.itemType && (
                                <Badge variant="outline" className="text-xs mt-1">{tx.itemType}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${tx.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {formatAmount(tx.amount)} ₸
                            </p>
                            {tx.platformFee && (
                              <p className="text-xs text-muted-foreground">
                                {t('adminTokens.platformFeeLabel', 'Комиссия')}: {tx.platformFee} ₸
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">{t('adminTokens.noTransactions', 'Нет транзакций')}</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('adminTokens.withdrawalsTitle', 'Заявки на вывод средств')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {withdrawalsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                  </div>
                ) : withdrawals.length > 0 ? (
                  <div className="space-y-3">
                    {withdrawals.map(w => (
                      <div key={w.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{w.amount} ₸</p>
                            <p className="text-xs text-muted-foreground">
                              User ID: {w.userId.slice(0, 8)}...
                            </p>
                          </div>
                          {getStatusBadge(w.status)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{w.paymentMethod || t('adminTokens.notProvided', 'Не указан')}</span>
                          <span>{format(new Date(w.createdAt), 'dd.MM.yyyy HH:mm', { locale: getDateLocale() })}</span>
                        </div>
                        {w.status === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-green-500 hover:text-green-600"
                              onClick={() => handleProcessWithdrawal(w.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {t('adminTokens.actions.approve', 'Одобрить')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-red-500 hover:text-red-600"
                              onClick={() => handleProcessWithdrawal(w.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              {t('adminTokens.actions.reject', 'Отклонить')}
                            </Button>
                          </div>
                        )}
                        {w.status === 'approved' && (
                          <Button
                            size="sm"
                            className="w-full mt-3"
                            onClick={() => handleProcessWithdrawal(w.id, 'completed')}
                          >
                            <Wallet className="h-4 w-4 mr-1" />
                            {t('adminTokens.actions.markPaid', 'Отметить выплаченным')}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">{t('adminTokens.noWithdrawals', 'Нет заявок на вывод')}</p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

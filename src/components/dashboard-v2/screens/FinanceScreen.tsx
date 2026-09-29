import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/user/useAuth';
import { fintechService, WalletOverview, WalletTransaction } from '@/services/fintech';
import { DashboardHeader } from '../layout/DashboardHeader';
import { Card } from '@/components/ui/card';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { useQuery } from '@tanstack/react-query';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import ArrowDownLeft from 'lucide-react/dist/esm/icons/arrow-down-left';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Download from 'lucide-react/dist/esm/icons/download';
import { format } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';
import { getCurrencySymbol } from '@/components/form-fields/CurrencySelect';
import { useHapticFeedback } from '@/hooks/ui/useHapticFeedback';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';

const GET_DATE_LOCALE = (lang: string) => {
    if (lang === 'ru') return ru;
    if (lang === 'kk') return kk;
    return enUS;
};

import { FinanceInsightsWidget } from '../widgets/FinanceInsightsWidget';
import { DigitalGoodsManager } from '../widgets/DigitalGoodsManager';


export const FinanceScreen = memo(function FinanceScreen() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ['walletOverview', user?.id],
        queryFn: () => fintechService.getWalletOverview(user!.id),
        enabled: !!user,
        staleTime: 2 * 60 * 1000,
        retry: 2,
    });

    const balance = data?.wallet?.balance || 0;
    const currency = data?.wallet?.currency || 'KZT';
    const transactions = data?.transactions || [];

    // Group transactions by date
    const groupedTransactions = useMemo(() => {
        const groups: Record<string, WalletTransaction[]> = {};
        transactions.forEach(tx => {
            const dateKey = format(new Date(tx.created_at), 'yyyy-MM-dd');
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(tx);
        });
        return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
    }, [transactions]);

    if (isLoading) return <LoadingState skeleton={<LoadingSkeleton />} />;

    const getGroupTitle = (dateKey: string) => {
        const date = new Date(dateKey);
        if (format(new Date(), 'yyyy-MM-dd') === dateKey) return t('common.today', 'Сегодня');
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (format(yesterday, 'yyyy-MM-dd') === dateKey) return t('common.yesterday', 'Вчера');
        return format(date, 'd MMMM', { locale: GET_DATE_LOCALE(i18n.language) });
    };

    const formatAmount = (val: number | string) => Number(val).toLocaleString();

    return (
        <div className="min-h-screen safe-area-bottom">
            <DashboardHeader
                title={t('finance.title', 'Финансы')}
                subtitle={t('finance.subtitle', 'История транзакций и кошелек')}
            />
            
            <div className="px-4 py-6 space-y-6 pb-24">
                {/* Insights Widget - Q2 Feature */}
                <FinanceInsightsWidget className="min-h-[400px]" />

                {/* Digital goods: sell protected files */}
                <DigitalGoodsManager />


                {/* Wallet Balance Card */}
                <Card className="bg-card p-8 bg-card border border-border shadow-md overflow-hidden relative rounded-card">
                    <div className="flex items-center gap-3 text-primary mb-6">
                        <div className="p-2 rounded-xl bg-primary/10">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.06em] opacity-80">
                            {t('finance.wallet_balance', 'Ваш баланс')}
                        </span>
                    </div>
                    <div className="text-6xl font-bold tracking-tighter mb-4 flex items-baseline gap-2">
                        {formatAmount(balance)} 
                        <span className="text-2xl text-primary/40 font-bold uppercase tracking-[0.06em]">{getCurrencySymbol(currency)}</span>
                    </div>
                    <div className="flex items-center gap-2 group cursor-help">
                        <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.06em] leading-none">
                            {t('finance.withdrawal_hint', 'Доступно для моментального вывода')}
                        </p>
                    </div>
                </Card>

                {/* Transactions History */}
                <div className="space-y-5">
                    <div className="flex items-center justify-between gap-3 px-1">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.06em] flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            {t('finance.transactions', 'История транзакций')}
                        </h3>
                        {transactions.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-1.5 text-xs font-bold uppercase tracking-[0.06em]"
                                onClick={async () => {
                                    try {
                                        const { exportWalletTransactionsToExcel } = await import('@/lib/export/excel-export-wallet');
                                        await exportWalletTransactionsToExcel({ transactions, currency });
                                        toast.success(t('finance.export.success', 'Экспорт готов'));
                                    } catch (e: any) {
                                        toast.error(e?.message || t('finance.export.error', 'Не удалось экспортировать'));
                                    }
                                }}
                            >
                                <Download className="h-3.5 w-3.5" />
                                {t('common.export', 'Экспорт')}
                            </Button>
                        )}
                    </div>

                    {transactions.length === 0 ? (
                        <Card className="bg-card border border-border shadow-sm rounded-card">
                            <EmptyState
                                icon={TrendingUp}
                                title={t('finance.empty.title', 'Транзакций пока нет')}
                                description={t('finance.empty.desc', 'Здесь будет отображаться история ваших доходов и комиссий')}
                                className="py-12"
                            />
                        </Card>
                    ) : (
                        <div className="space-y-8">
                            {groupedTransactions.map(([dateKey, groupTxs]) => (
                                <div key={dateKey} className="space-y-4">
                                    <div className="sticky top-20 z-10 px-2 py-1 flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full border border-border shadow-sm">
                                            {getGroupTitle(dateKey)}
                                        </span>
                                        <div className="bg-border h-px flex-1 ml-4" />
                                    </div>
                                    <div className="space-y-3">
                                        {groupTxs.map((tx) => (
                                            <TransactionItem 
                                                key={tx.id} 
                                                tx={tx} 
                                                currency={currency} 
                                                lang={i18n.language} 
                                                t={t}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

const TransactionItem = ({ tx, currency, lang, t }: { tx: WalletTransaction; currency: string; lang: string; t: any }) => {
    const haptic = useHapticFeedback();
    const isIncome = tx.type === 'payment' || tx.type === 'deposit';
    const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
    
    return (
        <Card 
            className="p-5 bg-card border border-border hover:bg-muted transition-colors cursor-pointer rounded-card active:scale-[0.98]"
            onClick={() => haptic.lightTap()}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-border",
                    isIncome ? "bg-success/12 text-success" : "bg-destructive/10 text-destructive"
                )}>
                    <Icon className="h-6 w-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                                {tx.description}
                            </span>
                            <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground mt-0.5">
                                {tx.type === 'payment' ? t('finance.type.sale', 'Продажа') : t(`finance.type.${tx.type}`, tx.type)}
                            </span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={cn(
                                "font-bold text-lg tracking-tight font-num transition-transform group-hover:scale-110 duration-500",
                                isIncome ? "text-success" : "text-foreground"
                            )}>
                                {isIncome ? '+' : '-'}{Number(tx.net_amount).toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.06em]">
                                {getCurrencySymbol(currency)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground font-bold uppercase tracking-[0.06em]">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {format(new Date(tx.created_at), 'dd MMM, HH:mm', { locale: GET_DATE_LOCALE(lang) })}
                        </div>
                        {tx.fee_amount > 0 && (
                            <div className="text-warning flex items-center gap-1.5 bg-warning/12 px-2 py-0.5 rounded-lg border border-warning/20">
                                <Zap className="h-3 w-3 fill-warning" />
                                <span>{tx.fee_amount} {getCurrencySymbol(currency)}</span>
                                <span className="opacity-60 text-[11px] font-medium">{t('finance.fee', 'Сбор')}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

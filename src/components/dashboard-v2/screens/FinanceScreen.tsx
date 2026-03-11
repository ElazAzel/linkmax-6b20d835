import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/user/useAuth';
import { fintechService, WalletOverview, WalletTransaction } from '@/services/fintech';
import { DashboardHeader } from '../layout/DashboardHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { EmptyState } from '../common/EmptyState';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import ArrowDownLeft from 'lucide-react/dist/esm/icons/arrow-down-left';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import { format } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';
import { getCurrencySymbol } from '@/components/form-fields/CurrencySelect';
import { getTierCommissionRate, type PremiumTier } from '@/domain/entities/User';

const GET_DATE_LOCALE = (lang: string) => {
    if (lang === 'ru') return ru;
    if (lang === 'kk') return kk;
    return enUS;
};

export const FinanceScreen = memo(function FinanceScreen() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [data, setData] = useState<WalletOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        setLoading(true);
        fintechService.getWalletOverview(user.id)
            .then(res => setData(res))
            .catch(err => console.error('Failed to load wallet', err))
            .finally(() => setLoading(false));
    }, [user]);

    if (loading) return <LoadingSkeleton />;

    const balance = data?.wallet?.balance || 0;
    const currency = data?.wallet?.currency || 'KZT';
    const transactions = data?.transactions || [];

    const formatAmount = (val: number | string) => Number(val).toLocaleString();

    return (
        <div className="min-h-screen safe-area-bottom">
            <DashboardHeader
                title={t('finance.title', 'Финансы')}
                subtitle={t('finance.subtitle', 'История транзакций и кошелек')}
            />

            <div className="px-5 py-6 space-y-6">
                {/* Wallet Balance Card */}
                <Card className="glass-card border-white/20 shadow-glass-lg overflow-hidden relative">
                    <div className="absolute inset-0 bg-primary/5 -z-10" />
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Wallet className="h-4 w-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">
                                {t('finance.wallet_balance', 'Ваш баланс')}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black tracking-tighter mb-1">
                            {formatAmount(balance)} {getCurrencySymbol(currency)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {t('finance.withdrawal_hint', 'Средства доступны для вывода на карту')}
                        </p>
                    </CardContent>
                </Card>

                {/* Transactions History */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
                        {t('finance.transactions', 'История транзакций')}
                    </h3>

                    {transactions.length === 0 ? (
                        <EmptyState
                            icon={TrendingUp}
                            title={t('finance.empty.title', 'Транзакций пока нет')}
                            description={t('finance.empty.desc', 'Здесь будет отображаться история ваших доходов и комиссий')}
                        />
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((tx) => (
                                <TransactionItem 
                                    key={tx.id} 
                                    tx={tx} 
                                    currency={currency} 
                                    lang={i18n.language} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

const TransactionItem = ({ tx, currency, lang }: { tx: WalletTransaction; currency: string; lang: string }) => {
    const isIncome = tx.type === 'payment' || tx.type === 'deposit';
    const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
    
    return (
        <Card className="p-4 bg-muted/30 border-border/10">
            <div className="flex items-start gap-4">
                <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                    isIncome ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-bold text-sm truncate">{tx.description}</span>
                        <span className={cn(
                            "font-black text-sm shrink-0",
                            isIncome ? "text-emerald-500" : ""
                        )}>
                            {isIncome ? '+' : '-'}{Number(tx.net_amount).toLocaleString()} {getCurrencySymbol(currency)}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(tx.created_at), 'dd MMM, HH:mm', { locale: GET_DATE_LOCALE(lang) })}
                        </div>
                        {tx.fee_amount > 0 && (
                            <div className="text-destructive/60">
                                Комиссия: {tx.fee_amount} {getCurrencySymbol(currency)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

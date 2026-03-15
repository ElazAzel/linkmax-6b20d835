import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/user/useAuth';
import { fintechService, WalletOverview, WalletTransaction } from '@/services/fintech';
import { DashboardHeader } from '../layout/DashboardHeader';
import { Card } from '@/components/ui/card';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import ArrowDownLeft from 'lucide-react/dist/esm/icons/arrow-down-left';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Zap from 'lucide-react/dist/esm/icons/zap';
import { format } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';
import { getCurrencySymbol } from '@/components/form-fields/CurrencySelect';
import { useHapticFeedback } from '@/hooks/ui/useHapticFeedback';
import { cn } from '@/lib/utils/utils';

const GET_DATE_LOCALE = (lang: string) => {
    if (lang === 'ru') return ru;
    if (lang === 'kk') return kk;
    return enUS;
};

import { FinanceInsightsWidget } from '../widgets/FinanceInsightsWidget';

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
                onMenuClick={() => {}}
            />
            
            <div className="px-4 py-6 space-y-6 pb-24">
                {/* Insights Widget - Q2 Feature */}
                <FinanceInsightsWidget className="min-h-[400px]" />

                {/* Wallet Balance Card */}
                <Card className="p-6 glass-strong border-white/20 shadow-glass-lg overflow-hidden relative rounded-[2.5rem]">
                    <div className="absolute inset-0 bg-primary/5 -z-10" />
                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                        <Wallet className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                            {t('finance.wallet_balance', 'Ваш баланс')}
                        </span>
                    </div>
                    <div className="text-5xl font-black tracking-tighter mb-2">
                        {formatAmount(balance)} <span className="text-2xl text-primary/60">{getCurrencySymbol(currency)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground/80 font-medium">
                        {t('finance.withdrawal_hint', 'Средства доступны для вывода на карту')}
                    </p>
                </Card>

                {/* Transactions History */}
                <div className="space-y-5">
                    <h3 className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] px-1 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        {t('finance.transactions', 'История транзакций')}
                    </h3>

                    {transactions.length === 0 ? (
                        <Card className="p-12 text-center glass border-white/10 shadow-glass rounded-[2.5rem]">
                            <div className="h-16 w-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <TrendingUp className="h-8 w-8 text-muted-foreground opacity-30" />
                            </div>
                            <h3 className="font-bold mb-2">{t('finance.empty.title', 'Транзакций пока нет')}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t('finance.empty.desc', 'Здесь будет отображаться история ваших доходов и комиссий')}
                            </p>
                        </Card>
                    ) : (
                        <div className="space-y-4">
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
    const haptic = useHapticFeedback();
    const isIncome = tx.type === 'payment' || tx.type === 'deposit';
    const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
    
    return (
        <Card 
            className="p-5 glass border-white/10 hover:bg-white/5 transition-colors cursor-pointer rounded-[2rem] active:scale-[0.98]"
            onClick={() => haptic.lightTap()}
        >
            <div className="flex items-center gap-4">
                <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-glass-sm border border-white/10",
                    isIncome ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                )}>
                    <Icon className="h-6 w-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-sm truncate">{tx.description}</span>
                        <span className={cn(
                            "font-black text-base shrink-0",
                            isIncome ? "text-emerald-500" : ""
                        )}>
                            {isIncome ? '+' : '-'}{Number(tx.net_amount).toLocaleString()} {getCurrencySymbol(currency)}
                        </span>
                    </div>

                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {format(new Date(tx.created_at), 'dd MMM, HH:mm', { locale: GET_DATE_LOCALE(lang) })}
                        </div>
                        {tx.fee_amount > 0 && (
                            <div className="text-destructive/50 flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {tx.fee_amount} {getCurrencySymbol(currency)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

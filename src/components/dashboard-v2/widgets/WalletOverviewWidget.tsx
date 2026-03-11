import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/user/useAuth';
import { fintechService, WalletOverview } from '@/services/fintech';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Percent from 'lucide-react/dist/esm/icons/percent';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { cn } from '@/lib/utils/utils';
import { getCurrencySymbol } from '@/components/form-fields/CurrencySelect';

interface WalletOverviewWidgetProps {
    className?: string;
    onViewFinance?: () => void;
}

/**
 * WalletOverviewWidget - "Success-First" Finance dashboard for users
 * Highlights GMV, Fees, and Net Balance (Wallet).
 */
export const WalletOverviewWidget = memo(function WalletOverviewWidget({
    className,
    onViewFinance
}: WalletOverviewWidgetProps) {
    const { t } = useTranslation();
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

    const formatAmount = (val: number | string) => {
        return Number(val).toLocaleString();
    };

    if (loading) {
        return (
            <Card className={cn("flex items-center justify-center p-12", className)}>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </Card>
        );
    }

    const balance = data?.wallet?.balance || 0;
    const currency = data?.wallet?.currency || 'KZT';
    const pendingGMV = data?.pendingGMV || 0;

    return (
        <Card className={cn("overflow-hidden border-border/30", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold">{t('dashboard.fintech.wallet', 'Ваш кошелек')}</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tighter">
                        {formatAmount(balance)} {getCurrencySymbol(currency)}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                        {t('dashboard.fintech.net_balance', 'Доступно к выводу')}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/10 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                            <TrendingUp className="h-3 w-3" />
                            {t('dashboard.fintech.gmv', 'Оборот')}
                        </div>
                        <div className="text-sm font-bold">
                            {formatAmount(pendingGMV + balance)} {getCurrencySymbol(currency)}
                        </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/10 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                            <Percent className="h-3 w-3" />
                            {t('dashboard.fintech.fees', 'Комиссия')}
                        </div>
                        <div className="text-sm font-bold text-destructive/80">
                            {/* Placeholder for total fees if we track them separately, or just 0 for now */}
                            {formatAmount((pendingGMV + balance) * 0.07)} {getCurrencySymbol(currency)}
                        </div>
                    </div>
                </div>

                <Button 
                    variant="secondary" 
                    className="w-full h-11 rounded-xl text-sm font-bold group"
                    onClick={onViewFinance}
                >
                    {t('dashboard.fintech.view_details', 'Детализация финансов')}
                    <ChevronRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </CardContent>
        </Card>
    );
});

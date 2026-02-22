import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Wallet, TrendingUp, Clock, ArrowUpRight, ArrowDownLeft,
    AlertCircle, ChevronRight, Loader2, DollarSign, Banknote
} from 'lucide-react';
import { useAuth } from '@/hooks/user/useAuth';
import { fintechService } from '@/services/fintech';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/utils';
import { useTranslation } from 'react-i18next';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export const WalletWidget = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPayoutOpen, setIsPayoutOpen] = useState(false);
    const [payoutAmount, setPayoutAmount] = useState('');
    const [payoutMethod, setPayoutMethod] = useState('');
    const [submittingPayout, setSubmittingPayout] = useState(false);

    const loadData = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const overview = await fintechService.getWalletOverview(user.id);
            setData(overview);
        } catch (err) {
            console.error('Failed to load wallet data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handlePayoutRequest = async () => {
        if (!user || !payoutAmount || isNaN(Number(payoutAmount))) return;

        const amount = Number(payoutAmount);
        if (amount > (data?.wallet?.balance || 0)) {
            toast.error("Недостаточно средств на балансе");
            return;
        }

        try {
            setSubmittingPayout(true);
            await fintechService.requestPayout({
                userId: user.id,
                amount,
                method: { type: 'card', value: payoutMethod },
                notes: `Запрос выплаты из CRM`
            });
            toast.success("Запрос на выплату успешно отправлен");
            setIsPayoutOpen(false);
            setPayoutAmount('');
            setPayoutMethod('');
            loadData();
        } catch (err: any) {
            toast.error("Ошибка при создании запроса: " + err.message);
        } finally {
            setSubmittingPayout(false);
        }
    };

    if (loading) {
        return (
            <Card className="glass-card border-white/10 overflow-hidden">
                <CardContent className="p-10 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse">Загружаем финансы...</p>
                </CardContent>
            </Card>
        );
    }

    const balance = data?.wallet?.balance || 0;
    const pendingGMV = data?.pendingGMV || 0;
    const transactions = data?.transactions || [];

    return (
        <Card className="glass-card border-white/10 overflow-hidden shadow-glass h-full flex flex-col">
            <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Мой кошелек</CardTitle>
                            <CardDescription className="text-xs">Управление доходами и GMV</CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={loadData} className="h-8 w-8">
                        <TrendingUp className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-5 flex-1 flex flex-col gap-6">
                {/* Balance Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Доступно</p>
                        <p className="text-2xl font-bold text-gradient">{balance.toLocaleString()} ₸</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">В ожидании (GMV)</p>
                        <p className="text-2xl font-bold text-emerald-400">+{pendingGMV.toLocaleString()} ₸</p>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Последние операции</h4>
                        <Button variant="link" className="h-auto p-0 text-xs font-bold text-primary">Все</Button>
                    </div>
                    <ScrollArea className="h-[200px] -mx-1 pr-2">
                        <div className="space-y-3 px-1">
                            {transactions.length === 0 ? (
                                <div className="py-10 text-center space-y-2 opacity-50">
                                    <Clock className="h-8 w-8 mx-auto text-muted-foreground" />
                                    <p className="text-xs font-medium">Транзакций пока нет</p>
                                </div>
                            ) : (
                                transactions.map((tx: any) => (
                                    <div key={tx.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10 group hover:border-primary/30 transition-all cursor-default">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg",
                                                tx.type === 'income' ? "bg-emerald-500/10 text-emerald-500" :
                                                    tx.type === 'fee' ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                                            )}>
                                                {tx.type === 'income' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate">{tx.description}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-medium">
                                                    {format(new Date(tx.created_at), 'dd MMM, HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "text-sm font-bold",
                                                tx.amount > 0 ? "text-emerald-400" : "text-muted-foreground"
                                            )}>
                                                {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} ₸
                                            </p>
                                            <Badge variant="outline" className={cn(
                                                "text-[8px] py-0 h-4 border-none bg-black/40",
                                                tx.status === 'completed' ? "text-emerald-400" : "text-amber-400"
                                            )}>
                                                {tx.status === 'completed' ? 'Успешно' : 'Ожидает'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <Dialog open={isPayoutOpen} onOpenChange={setIsPayoutOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                            Вывести средства
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-white/10 sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl">Запрос выплаты</DialogTitle>
                            <DialogDescription>
                                Укажите сумму и реквизиты для вывода. Мы обработаем запрос в течение 24 часов.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="amount">Сумма (₸)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={payoutAmount}
                                    onChange={(e) => setPayoutAmount(e.target.value)}
                                    placeholder="Например: 5000"
                                    className="bg-white/5 border-white/10"
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Доступно: <span className="text-primary font-bold">{(data?.wallet?.balance || 0).toLocaleString()} ₸</span>
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="method">Реквизиты (Номер карты / Kaspi)</Label>
                                <Input
                                    id="method"
                                    value={payoutMethod}
                                    onChange={(e) => setPayoutMethod(e.target.value)}
                                    placeholder="4400 ...."
                                    className="bg-white/5 border-white/10"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handlePayoutRequest}
                                disabled={submittingPayout || !payoutAmount || !payoutMethod}
                                className="w-full"
                            >
                                {submittingPayout ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Banknote className="h-4 w-4 mr-2" />}
                                Отправить запрос
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
};

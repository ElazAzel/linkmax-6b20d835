import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/platform/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Download from 'lucide-react/dist/esm/icons/download';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { ActionCard } from '../common/ActionCard';
import { cn } from '@/lib/utils/utils';
import { toast } from 'sonner';
import { useAppError } from '@/hooks/useAppError';

interface KaspiQRWidgetProps {
    ownerId: string;
    currency?: string;
    className?: string;
}

/**
 * KaspiQRWidget - Quick payment generator for Dashboard v2
 * Integrates with process-transaction-fee for Q2 automated fee handling.
 */
export const KaspiQRWidget = memo(function KaspiQRWidget({
    ownerId,
    currency = 'KZT',
    className
}: KaspiQRWidgetProps) {
    const { t } = useTranslation();
    const { handleError } = useAppError();
    const [amount, setAmount] = useState<number | ''>('');
    const [comment, setComment] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);

    const kaspiDeeplink = useMemo(() => {
        const params = new URLSearchParams();
        if (amount && amount > 0) params.set('amount', amount.toString());
        if (comment) params.set('comment', comment);
        return `https://kaspi.kz/pay?${params.toString()}`;
    }, [amount, comment]);

    const handleSimulatePayment = async () => {
        if (!ownerId || !amount || amount <= 0) {
            toast.error(t('kaspi.invalidAmount', 'Введите корректную сумму'));
            return;
        }

        try {
            setIsSimulating(true);
            const { data, error } = await supabase.functions.invoke('process-transaction-fee', {
                body: {
                    userId: ownerId,
                    amount: amount,
                    currency: currency,
                    source: 'Kaspi Dashboard',
                    description: comment || 'Kaspi Payment via Dashboard',
                }
            });

            if (error) throw error;

            toast.success(t('kaspi.paymentSimulated', 'Платеж успешно симулирован, комиссия удержана!'));
            setAmount('');
            setComment('');
        } catch (err: any) {
            console.error('Error simulating payment:', err);
            handleError(err, 'Ошибка при симуляции платежа');
        } finally {
            setIsSimulating(false);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(kaspiDeeplink);
        toast.success(t('kaspi.linkCopied', 'Ссылка скопирована'));
    };

    return (
        <Card className={cn("glass border-white/10 shadow-glass overflow-hidden", className)}>
            <CardHeader className="pb-4 border-b border-white/5">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-[#F14635]/10 text-[#F14635] shadow-inner">
                            <Smartphone className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">{t('dashboard.kaspi_qr', 'Kaspi QR')}</span>
                    </div>
                    <Badge variant="secondary" className="bg-[#F14635]/10 text-[#F14635] border-[#F14635]/20 font-bold text-[10px] tracking-wider py-1 px-3 rounded-lg">
                        {t('dashboard.instant', 'МГНОВЕННО')}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
                <div className="space-y-5">
                    <div className="space-y-2.5">
                        <Label htmlFor="qr-amount" className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-70 pl-1">
                            {t('kaspi.amount', 'Сумма')}
                        </Label>
                        <div className="flex gap-2.5">
                            <Input
                                id="qr-amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                                placeholder="0"
                                className="h-12 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-primary/20 transition-all font-bold text-base"
                            />
                            <div className="flex items-center px-4 text-xs font-bold text-muted-foreground bg-white/5 rounded-2xl border border-white/10 opacity-60">
                                {currency}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <Label htmlFor="qr-comment" className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] opacity-70 pl-1">
                            {t('kaspi.comment', 'Комментарий')}
                        </Label>
                        <Input
                            id="qr-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t('kaspi.commentPlaceholder', 'Назначение платежа')}
                            className="h-12 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-primary/20 transition-all"
                        />
                    </div>

                    {amount && amount > 0 ? (
                        <div className="flex flex-col items-center justify-center p-5 rounded-[2rem] bg-white border border-white/10 shadow-glass-lg animate-in fade-in zoom-in duration-500">
                            <div className="p-3 bg-white rounded-2xl shadow-inner border border-stone-100">
                                <QRCodeSVG
                                    value={kaspiDeeplink}
                                    size={150}
                                    level="H"
                                    includeMargin
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                />
                            </div>
                            <div className="mt-5 flex gap-3 w-full">
                                <Button variant="outline" size="lg" onClick={handleCopyLink} className="flex-1 h-12 rounded-2xl border-stone-200 hover:bg-stone-50 font-bold text-sm">
                                    <Copy className="h-4 w-4 mr-2" />
                                    {t('common.copy', 'Link')}
                                </Button>
                                <Button size="lg" onClick={handleSimulatePayment} disabled={isSimulating} className="flex-1 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-lg shadow-primary/20">
                                    {isSimulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4 mr-2" />}
                                    {t('kaspi.pay', 'Pay')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 px-6 rounded-[2rem] bg-white/5 border border-dashed border-white/20 text-center text-muted-foreground group hover:border-primary/30 transition-colors">
                            <Smartphone className="h-10 w-10 mb-4 opacity-20 group-hover:opacity-40 transition-opacity" />
                            <p className="text-xs font-semibold max-w-[160px] leading-relaxed">
                                {t('kaspi.enter_amount', 'Введите сумму для генерации QR')}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});

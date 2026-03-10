import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/integrations/supabase/client';
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
        <Card className={className}>
            <CardHeader className="pb-3 border-b border-white/5">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-[#F14635]/10 text-[#F14635]">
                            <Smartphone className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold">{t('dashboard.kaspi_qr', 'Kaspi QR')}</span>
                    </div>
                    <Badge variant="secondary" className="bg-[#F14635]/5 text-[#F14635] border-transparent font-bold text-[10px]">
                        {t('dashboard.instant', 'МГНОВЕННО')}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="qr-amount" className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                            {t('kaspi.amount', 'Сумма')}
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="qr-amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                                placeholder="0"
                                className="h-10 bg-white/5 border-white/10"
                            />
                            <div className="flex items-center px-3 text-xs font-bold text-muted-foreground bg-white/5 rounded-md border border-white/10">
                                {currency}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="qr-comment" className="text-xs text-muted-foreground uppercase font-bold tracking-wider">
                            {t('kaspi.comment', 'Комментарий')}
                        </Label>
                        <Input
                            id="qr-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t('kaspi.commentPlaceholder', 'Назначение платежа')}
                            className="h-10 bg-white/5 border-white/10"
                        />
                    </div>

                    {amount && amount > 0 ? (
                        <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-white/10 animate-in fade-in zoom-in duration-300">
                            <QRCodeSVG
                                value={kaspiDeeplink}
                                size={140}
                                level="H"
                                includeMargin
                                bgColor="#ffffff"
                                fgColor="#000000"
                            />
                            <div className="mt-3 flex gap-2 w-full">
                                <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-1 h-9 rounded-xl border-white/10">
                                    <Copy className="h-3 w-3 mr-1.5" />
                                    {t('common.copy', 'Link')}
                                </Button>
                                <Button variant="secondary" size="sm" onClick={handleSimulatePayment} disabled={isSimulating} className="flex-1 h-9 rounded-xl">
                                    {isSimulating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wallet className="h-3 w-3 mr-1.5" />}
                                    {t('kaspi.pay', 'Pay')}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 px-6 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center text-muted-foreground">
                            <Smartphone className="h-8 w-8 mb-3 opacity-20" />
                            <p className="text-xs font-medium max-w-[140px]">
                                {t('kaspi.enter_amount', 'Введите сумму для генерации QR')}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});

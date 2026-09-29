import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Copy from 'lucide-react/dist/esm/icons/copy';
import { cn } from '@/lib/utils/utils';
import { toast } from 'sonner';
import { QR_COLORS } from '@/lib/design/brand-colors';

interface KaspiQRWidgetProps {
    ownerId: string;
    currency?: string;
    className?: string;
}

/**
 * KaspiQRWidget - Quick payment QR/link generator for Dashboard v2.
 * The "Pay" button that called process-transaction-fee from the owner's
 * browser was removed: that function is service-only (403 for users) and
 * "simulating" a payment charged the owner a fee for money never received.
 */
export const KaspiQRWidget = memo(function KaspiQRWidget({
    ownerId,
    currency = 'KZT',
    className
}: KaspiQRWidgetProps) {
    const { t } = useTranslation();
    const [amount, setAmount] = useState<number | ''>('');
    const [comment, setComment] = useState('');

    const kaspiDeeplink = useMemo(() => {
        const params = new URLSearchParams();
        if (amount && amount > 0) params.set('amount', amount.toString());
        if (comment) params.set('comment', comment);
        return `https://kaspi.kz/pay?${params.toString()}`;
    }, [amount, comment]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(kaspiDeeplink);
        toast.success(t('kaspi.linkCopied', 'Ссылка скопирована'));
    };

    return (
        <Card className={cn("bg-card border border-border shadow-sm overflow-hidden", className)}>
            <CardHeader className="pb-4 border-b border-border">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-kaspi/10 text-kaspi shadow-inner">
                            <Smartphone className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-bold tracking-tight">{t('dashboard.kaspi_qr', 'Kaspi QR')}</span>
                    </div>
                    <Badge variant="secondary" className="bg-kaspi text-white border-none font-bold text-xs tracking-[0.06em] py-1 px-3 rounded-full">
                        {t('dashboard.instant', 'МГНОВЕННО')}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
                <div className="space-y-5">
                    <div className="space-y-2.5">
                        <Label htmlFor="qr-amount" className="text-xs text-muted-foreground uppercase font-bold tracking-[0.06em] opacity-70 pl-1">
                            {t('kaspi.amount', 'Сумма')}
                        </Label>
                        <div className="flex gap-2.5">
                            <Input
                                id="qr-amount"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                                placeholder="0"
                                className="h-12 bg-muted border-border rounded-2xl focus-visible:ring-primary/20 transition-all font-bold text-base"
                            />
                            <div className="flex items-center px-4 text-xs font-bold text-muted-foreground bg-muted rounded-2xl border border-border opacity-60">
                                {currency}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <Label htmlFor="qr-comment" className="text-xs text-muted-foreground uppercase font-bold tracking-[0.06em] opacity-70 pl-1">
                            {t('kaspi.comment', 'Комментарий')}
                        </Label>
                        <Input
                            id="qr-comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t('kaspi.commentPlaceholder', 'Назначение платежа')}
                            className="h-12 bg-muted border-border rounded-2xl focus-visible:ring-primary/20 transition-all"
                        />
                    </div>

                    {amount && amount > 0 ? (
                        <div className="relative group/qr">
                            {/* Animated backdrop glow */}
                            
                            <div className="relative flex flex-col items-center justify-center p-6 rounded-card bg-card border border-border shadow-md animate-in fade-in zoom-in duration-500 overflow-hidden">
                                {/* Scan line animation overlay */}
                                <div className="absolute top-0 inset-x-0 h-[2px] bg-kaspi/20 animate-scan-line z-10" />

                                <div className="p-4 bg-white rounded-3xl shadow-inner border-4 border-kaspi/5 relative">
                                    <QRCodeSVG
                                        value={kaspiDeeplink}
                                        size={160}
                                        level="H"
                                        includeMargin
                                        bgColor={QR_COLORS.background}
                                        fgColor={QR_COLORS.foreground}
                                    />
                                    {/* Small Kaspi dot in corner */}
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-kaspi rounded-full border-2 border-card" />
                                </div>
                                <div className="mt-6 flex gap-3 w-full">
                                    <Button 
                                        variant="outline" 
                                        onClick={handleCopyLink} 
                                        className="flex-1 h-12 rounded-2xl border-border bg-card border hover:bg-muted font-bold text-xs uppercase tracking-[0.06em] gap-2"
                                    >
                                        <Copy className="h-4 w-4" />
                                        {t('common.copy', 'Link')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 px-6 rounded-card bg-muted/40 border border-dashed border-border text-center group hover:border-kaspi/40 transition-all duration-500">
                            <div className="w-16 h-16 rounded-full bg-kaspi/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-kaspi/10 transition-all duration-500">
                                <Smartphone className="h-8 w-8 text-kaspi opacity-20 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground max-w-[180px] leading-relaxed">
                                {t('kaspi.enter_amount', 'Введите сумму для генерации QR')}
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
});

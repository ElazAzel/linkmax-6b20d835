/**
 * InvoiceDetailSheet - Side panel for viewing and managing an invoice
 */
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { ZoneInvoice, ZoneMember, ZoneContact, ZoneDeal } from '@/types/zones';
import { useZoneInvoiceItems } from '@/hooks/zones/useZoneInvoices';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import LinkIcon from 'lucide-react/dist/esm/icons/link';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Download from 'lucide-react/dist/esm/icons/download';
import { generateRoboKassaUrl } from '@/services/zones/robokassa';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

// Status config moved inside component to use translation hook safely

interface InvoiceDetailSheetProps {
    invoice: ZoneInvoice | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdateStatus: (id: string, status: ZoneInvoice['status']) => Promise<void>;
    members: ZoneMember[];
    contacts: ZoneContact[];
    deals: ZoneDeal[];
}

export const InvoiceDetailSheet = memo(function InvoiceDetailSheet({
    invoice,
    open,
    onOpenChange,
    onUpdateStatus,
    members,
    contacts,
    deals,
}: InvoiceDetailSheetProps) {
    const { t } = useTranslation();
    const { items, loading: itemsLoading } = useZoneInvoiceItems(invoice?.zone_id || null, invoice?.id || null);
    const [generatingUrl, setGeneratingUrl] = useState(false);

    const handleGeneratePayUrl = async () => {
        if (!invoice) return;
        setGeneratingUrl(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const url = await generateRoboKassaUrl({
                type: 'payment',
                amount: Number(invoice.amount),
                userId: user.id,
                zoneId: invoice.zone_id,
                relatedId: invoice.id,
                description: invoice.description || `Invoice #${invoice.invoice_number || invoice.id.slice(0, 8)}`,
            });

            // Update invoice with the new URL
            const { error } = await supabase
                .from('zone_invoices')
                .update({ pay_url: url } as any)
                .eq('id', invoice.id);

            if (error) throw error;
            toast.success(t('zones.invoices.urlGenerated', 'Link generated'));
            // Note: Since we updated DB, the parent should ideally refetch or we should use a shared state.
            // For now, simpler: we just tell useZoneInvoices to refetch if needed, but here we just update DB.
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Failed to generate link');
        } finally {
            setGeneratingUrl(false);
        }
    };

    const contact = useMemo(() => contacts.find(c => c.id === invoice?.contact_id), [contacts, invoice]);
    const deal = useMemo(() => deals.find(d => d.id === invoice?.deal_id), [deals, invoice]);

    const statusMap = useMemo(() => ({
        created: { label: t('zones.invoices.statusCreated', 'Создан'), variant: 'outline' as const, icon: Clock },
        paid: { label: t('zones.invoices.statusPaid', 'Оплачен'), variant: 'default' as const, icon: CheckCircle2 },
        failed: { label: t('zones.invoices.statusFailed', 'Ошибка'), variant: 'destructive' as const, icon: XCircle },
        expired: { label: t('zones.invoices.statusExpired', 'Истёк'), variant: 'secondary' as const, icon: Clock },
    }), [t]);

    if (!invoice) return null;

    const statusCfg = statusMap[invoice.status as keyof typeof statusMap] || statusMap.created;
    const StatusIcon = statusCfg.icon;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: invoice.currency }).format(val);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-background/95 backdrop-blur-xl">
                <SheetHeader className="p-6 pb-2">
                    <div className="flex items-center gap-2 mb-2">
                        <Receipt className="h-5 w-5 text-primary" />
                        <Badge variant="outline" className="text-[10px] font-mono uppercase tracking-widest">
                            #{invoice.invoice_number ? `INV-${invoice.invoice_number.toString().padStart(3, '0')}` : invoice.id.slice(0, 8).toUpperCase()}
                        </Badge>
                    </div>
                    <SheetTitle className="text-left font-bold text-2xl">
                        {formatCurrency(invoice.amount)}
                    </SheetTitle>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={statusCfg.variant} className="flex items-center gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusCfg.label}
                        </Badge>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6">
                    <div className="space-y-6 py-4">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{t('zones.invoices.issueDate', 'Дата выставления')}</p>
                                <p className="text-sm font-medium">{format(new Date(invoice.created_at), 'd MMMM yyyy', { locale: ru })}</p>
                            </div>
                            {invoice.paid_at && (
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{t('zones.invoices.paymentDate', 'Дата оплаты')}</p>
                                    <p className="text-sm font-medium">{format(new Date(invoice.paid_at), 'd MMMM yyyy', { locale: ru })}</p>
                                </div>
                            )}
                        </div>

                        <Separator className="bg-border/50" />

                        {/* Client & Deal */}
                        <div className="space-y-4">
                            {contact && (
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{t('zones.invoices.client', 'Клиент')}</p>
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                            {contact.name[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{contact.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{contact.email || contact.phone || t('zones.invoices.noContactInfo', 'Нет контакта')}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {deal && (
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{t('zones.invoices.deal', 'Сделка')}</p>
                                    <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
                                        <p className="text-sm font-semibold truncate">{deal.title}</p>
                                        <p className="text-xs text-muted-foreground">{t('zones.invoices.dealStatus', 'Статус')}: {deal.status}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator className="bg-border/50" />

                        {/* Items */}
                        <div className="space-y-3">
                            <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{t('zones.invoices.items', 'Позиции')}</p>
                            {itemsLoading ? (
                                <div className="space-y-2">
                                    <div className="h-10 bg-muted/20 animate-pulse rounded" />
                                    <div className="h-10 bg-muted/20 animate-pulse rounded" />
                                </div>
                            ) : items.length > 0 ? (
                                <div className="space-y-2">
                                    {items.map(item => (
                                        <div key={item.id} className="flex items-start justify-between gap-4 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{item.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.quantity} x {formatCurrency(item.unit_price)}
                                                </p>
                                            </div>
                                            <p className="text-sm font-bold whitespace-nowrap">{formatCurrency(item.total)}</p>
                                        </div>
                                    ))}
                                    <div className="pt-2 flex justify-between items-center border-t border-dashed">
                                        <p className="text-sm font-bold">{t('zones.invoices.total', 'Итого')}</p>
                                        <p className="text-lg font-bold text-primary">{formatCurrency(invoice.amount)}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">{t('zones.invoices.noItemsSpecified', 'Позиции не указаны')}</p>
                            )}
                        </div>

                        {invoice.description && (
                            <>
                                <Separator className="bg-border/50" />
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">{t('zones.invoices.noteLabel', 'Примечание')}</p>
                                    <p className="text-sm text-muted-foreground">{invoice.description}</p>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>

                {/* Actions */}
                <div className="p-6 pt-2 bg-muted/20 border-t space-y-3">
                    {invoice.status === 'created' && (
                        <div className="space-y-2">
                            {invoice.pay_url ? (
                                <Button className="w-full shadow-lg shadow-primary/20" asChild>
                                    <a href={invoice.pay_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" /> {t('zones.invoices.payLink', 'Ссылка на оплату')}
                                    </a>
                                </Button>
                            ) : (
                                <Button
                                    className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                    onClick={handleGeneratePayUrl}
                                    disabled={generatingUrl}
                                >
                                    <LinkIcon className="h-4 w-4 mr-2" />
                                    {generatingUrl ? t('common.loading', 'Loading...') : t('zones.invoices.generatePayLink', 'Спегенерировать ссылку')}
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" disabled>
                            <Download className="h-4 w-4 mr-2" /> PDF
                        </Button>
                        {invoice.status === 'created' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-primary hover:text-primary border-primary/20"
                                onClick={() => onUpdateStatus(invoice.id, 'paid')}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" /> {t('zones.invoices.markPaid', 'Оплачен')}
                            </Button>
                        )}
                        {invoice.status === 'paid' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-warning border-warning/20 col-span-2"
                                onClick={() => onUpdateStatus(invoice.id, 'created')}
                            >
                                {t('zones.invoices.cancelPayment', 'Отменить оплату')}
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
});

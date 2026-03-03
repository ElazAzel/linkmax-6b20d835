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
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Download from 'lucide-react/dist/esm/icons/download';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
    created: { label: 'Создан', variant: 'outline', icon: Clock },
    paid: { label: 'Оплачен', variant: 'default', icon: CheckCircle2 },
    failed: { label: 'Ошибка', variant: 'destructive', icon: XCircle },
    expired: { label: 'Истёк', variant: 'secondary', icon: Clock },
};

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

    const contact = useMemo(() => contacts.find(c => c.id === invoice?.contact_id), [contacts, invoice]);
    const deal = useMemo(() => deals.find(d => d.id === invoice?.deal_id), [deals, invoice]);

    if (!invoice) return null;

    const statusCfg = STATUS_MAP[invoice.status] || STATUS_MAP.created;
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
                            Invoice #{invoice.invoice_number || invoice.id.slice(0, 8)}
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
                                <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Дата выставления</p>
                                <p className="text-sm font-medium">{format(new Date(invoice.created_at), 'd MMMM yyyy', { locale: ru })}</p>
                            </div>
                            {invoice.paid_at && (
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Дата оплаты</p>
                                    <p className="text-sm font-medium">{format(new Date(invoice.paid_at), 'd MMMM yyyy', { locale: ru })}</p>
                                </div>
                            )}
                        </div>

                        <Separator className="bg-border/50" />

                        {/* Client & Deal */}
                        <div className="space-y-4">
                            {contact && (
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Клиент</p>
                                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                            {contact.name[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{contact.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{contact.email || contact.phone || 'Нет контакта'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {deal && (
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Сделка</p>
                                    <div className="p-2 rounded-lg bg-muted/30 border border-border/40">
                                        <p className="text-sm font-semibold truncate">{deal.title}</p>
                                        <p className="text-xs text-muted-foreground">Статус: {deal.status}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Separator className="bg-border/50" />

                        {/* Items */}
                        <div className="space-y-3">
                            <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Позиции</p>
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
                                        <p className="text-sm font-bold">Итого</p>
                                        <p className="text-lg font-bold text-primary">{formatCurrency(invoice.amount)}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Позиции не указаны</p>
                            )}
                        </div>

                        {invoice.description && (
                            <>
                                <Separator className="bg-border/50" />
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Примечание</p>
                                    <p className="text-sm text-muted-foreground">{invoice.description}</p>
                                </div>
                            </>
                        )}
                    </div>
                </ScrollArea>

                {/* Actions */}
                <div className="p-6 pt-2 bg-muted/20 border-t space-y-3">
                    {invoice.pay_url && invoice.status === 'created' && (
                        <Button className="w-full shadow-lg shadow-primary/20" asChild>
                            <a href={invoice.pay_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" /> Ссылка на оплату
                            </a>
                        </Button>
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
                                <CheckCircle2 className="h-4 w-4 mr-2" /> Оплачен
                            </Button>
                        )}
                        {invoice.status === 'paid' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-warning border-warning/20 col-span-2"
                                onClick={() => onUpdateStatus(invoice.id, 'created')}
                            >
                                Отменить оплату
                            </Button>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
});

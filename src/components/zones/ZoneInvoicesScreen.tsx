/**
 * ZoneInvoicesScreen - Modern invoice management for a zone
 */
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneInvoices } from '@/hooks/zones/useZoneInvoices';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { useZoneContext } from '@/contexts/ZoneContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { InvoiceDetailSheet } from './invoices/InvoiceDetailSheet';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils/utils';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import type { ZoneInvoice, ZoneInvoiceItem } from '@/types/zones';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  created: { label: 'Создан', variant: 'outline' },
  paid: { label: 'Оплачен', variant: 'default' },
  failed: { label: 'Ошибка', variant: 'destructive' },
  expired: { label: 'Истёк', variant: 'secondary' },
};

interface Props {
  zoneId: string;
}

interface NewInvoiceItem {
  id: string; // temp id for UI
  name: string;
  quantity: number;
  unit_price: number;
}

export function ZoneInvoicesScreen({ zoneId }: Props) {
  const { t } = useTranslation();
  const { invoices, loading, createWithItems, updateStatus } = useZoneInvoices(zoneId);
  const { contacts } = useZoneContacts(zoneId);
  const { deals } = useZoneDeals(zoneId);
  const { members } = useZoneContext();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ZoneInvoice | null>(null);

  // Form state
  const [form, setForm] = useState({
    currency: 'KZT',
    description: '',
    contact_id: '',
    deal_id: '',
  });
  const [items, setItems] = useState<NewInvoiceItem[]>([
    { id: '1', name: '', quantity: 1, unit_price: 0 }
  ]);

  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0), [items]);

  const handleAddItem = () => {
    setItems([...items, { id: Math.random().toString(), name: '', quantity: 1, unit_price: 0 }]);
  };

  const handleUpdateItem = (id: string, updates: Partial<NewInvoiceItem>) => {
    setItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id));
    }
  };

  const handleCreate = async () => {
    if (totalAmount <= 0) {
      toast.error('Сумма инвойса должна быть больше нуля');
      return;
    }
    const validItems = items.filter(i => i.name.trim() && i.unit_price > 0);
    if (validItems.length === 0) {
      toast.error('Добавьте хотя бы одну позицию с названием и ценой');
      return;
    }

    try {
      const invoiceData = {
        amount: totalAmount,
        currency: form.currency,
        description: form.description || null,
        contact_id: form.contact_id && form.contact_id !== 'none' ? form.contact_id : null,
        deal_id: form.deal_id && form.deal_id !== 'none' ? form.deal_id : null,
        status: 'created' as ZoneInvoice['status'],
      };

      const invoiceItems = validItems.map(i => ({
        name: i.name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.quantity * i.unit_price,
      }));

      await createWithItems(invoiceData as any, invoiceItems as any);
      setShowCreate(false);
      resetForm();
      toast.success('Инвойс успешно создан');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка при создании инвойса');
    }
  };

  const resetForm = () => {
    setForm({ currency: 'KZT', description: '', contact_id: '', deal_id: '' });
    setItems([{ id: '1', name: '', quantity: 1, unit_price: 0 }]);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  };

  const formatInvoiceNumber = (num: number | null, id: string) => {
    if (!num) return id.slice(0, 8).toUpperCase();
    return `INV-${num.toString().padStart(3, '0')}`;
  };

  const totalPaid = useMemo(() => invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0), [invoices]);
  const totalPending = useMemo(() => invoices.filter(i => i.status === 'created').reduce((s, i) => s + Number(i.amount), 0), [invoices]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Receipt className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Финансы</h2>
        </div>
        <Button onClick={() => setShowCreate(true)} className="rounded-xl shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" /> Выставить инвойс
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-background/40 backdrop-blur-sm border-border/40 overflow-hidden group">
          <CardContent className="p-5">
            <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Оплачено</p>
            <div className="text-2xl font-black text-primary transition-transform group-hover:scale-105 origin-left duration-300">
              {formatAmount(totalPaid, 'KZT')}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background/40 backdrop-blur-sm border-border/40 overflow-hidden group">
          <CardContent className="p-5">
            <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Ожидает оплаты</p>
            <div className="text-2xl font-black text-warning transition-transform group-hover:scale-105 origin-left duration-300">
              {formatAmount(totalPending, 'KZT')}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-background/40 backdrop-blur-sm border-border/40 overflow-hidden group col-span-2 lg:col-span-1 border-dashed">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-muted-foreground font-bold tracking-wider mb-1">Всего инвойсов</p>
              <div className="text-2xl font-black">{invoices.length}</div>
            </div>
            <Receipt className="h-8 w-8 text-muted-foreground opacity-10" />
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted/20 animate-pulse rounded-2xl" />)}
        </div>
      )}

      {!loading && invoices.length === 0 && (
        <Card className="bg-background/20 border-dashed border-2">
          <CardContent className="py-20 text-center">
            <Receipt className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="text-lg font-semibold">Инвойсов пока нет</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
              Нажмите кнопку "Выставить инвойс", чтобы отправить запрос на оплату клиенту.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invoice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {invoices.map(inv => {
          const st = STATUS_MAP[inv.status] || STATUS_MAP.created;
          return (
            <Card
              key={inv.id}
              className="bg-background/40 backdrop-blur-md border-border/40 hover:border-primary/30 transition-all cursor-pointer group"
              onClick={() => setSelectedInvoice(inv)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={st.variant} className="text-[10px] uppercase font-bold tracking-wider rounded-md">
                        {st.label}
                      </Badge>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase mr-auto">
                        #{formatInvoiceNumber(inv.invoice_number, inv.id)}
                      </span>
                    </div>
                    <div className="text-xl font-black group-hover:text-primary transition-colors">
                      {formatAmount(Number(inv.amount), inv.currency)}
                    </div>
                    {inv.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{inv.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/10">
                      <div className="text-[10px] text-muted-foreground">
                        {format(new Date(inv.created_at), 'd MMM yyyy', { locale: ru })}
                      </div>
                      {inv.contact_id && (
                        <div className="text-[10px] font-bold text-primary max-w-[100px] truncate">
                          ID: {inv.contact_id.slice(0, 8)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-3 rounded-full bg-muted/20 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                    <ExternalLink className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => { setShowCreate(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl bg-background/95 backdrop-blur-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Выставить инвойс</DialogTitle>
            <DialogDescription>Добавьте позиции и выберите клиента для формирования счета.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-2">
              {/* Items Section */}
              <div className="space-y-3">
                <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Позиции</Label>
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 p-3 rounded-xl bg-muted/30 border border-border/20 group">
                      <div className="col-span-6">
                        <Input
                          placeholder="Название услуги или товара"
                          value={item.name}
                          onChange={e => handleUpdateItem(item.id, { name: e.target.value })}
                          className="bg-muted/10"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Кол"
                          value={item.quantity}
                          onChange={e => handleUpdateItem(item.id, { quantity: Number(e.target.value) })}
                          className="bg-muted/10 px-2"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          placeholder="Цена"
                          value={item.unit_price}
                          onChange={e => handleUpdateItem(item.id, { unit_price: Number(e.target.value) })}
                          className="bg-muted/10 pr-2"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.id)}
                          className="h-8 w-8 text-destructive opacity-40 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={handleAddItem} className="w-full h-8 border-dashed rounded-xl">
                    <Plus className="h-3 w-3 mr-1" /> Добавить позицию
                  </Button>
                </div>
              </div>

              <Separator className="bg-border/50" />

              {/* Client & Deal Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-1.5 block">Клиент</Label>
                    <Select value={form.contact_id} onValueChange={v => setForm(f => ({ ...f, contact_id: v }))}>
                      <SelectTrigger className="bg-muted/30"><SelectValue placeholder="Выберите контакт" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без привязки</SelectItem>
                        {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-1.5 block">Сделка</Label>
                    <Select value={form.deal_id} onValueChange={v => setForm(f => ({ ...f, deal_id: v }))}>
                      <SelectTrigger className="bg-muted/30"><SelectValue placeholder="Связать со сделкой" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без привязки</SelectItem>
                        {deals.filter(d => d.status === 'open').map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase font-bold text-muted-foreground tracking-widest mb-1.5 block">Примечание</Label>
                    <Textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Условия или комментарий..."
                      className="resize-none h-[106px] bg-muted/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t pt-4 px-6 -mx-6">
            <div className="flex items-center justify-between w-full">
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Итоговая сумма</p>
                <p className="text-2xl font-black text-primary">{formatAmount(totalAmount, form.currency)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowCreate(false)}>Отмена</Button>
                <Button onClick={handleCreate} size="lg" className="px-8 shadow-lg shadow-primary/20">Выставить инвойс</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <InvoiceDetailSheet
        invoice={selectedInvoice}
        open={!!selectedInvoice}
        onOpenChange={(o) => { if (!o) setSelectedInvoice(null); }}
        onUpdateStatus={updateStatus}
        members={members}
        contacts={contacts}
        deals={deals}
      />
    </div>
  );
}

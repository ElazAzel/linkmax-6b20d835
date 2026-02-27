/**
 * ZoneInvoicesScreen - Invoice management for a zone
 */
import { useState } from 'react';
import { useZoneInvoices } from '@/hooks/zones/useZoneInvoices';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils/utils';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import Plus from 'lucide-react/dist/esm/icons/plus';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  created: { label: 'Создан', variant: 'outline' },
  paid: { label: 'Оплачен', variant: 'default' },
  failed: { label: 'Ошибка', variant: 'destructive' },
  expired: { label: 'Истёк', variant: 'secondary' },
};

interface Props {
  zoneId: string;
}

export function ZoneInvoicesScreen({ zoneId }: Props) {
  const { invoices, loading, create } = useZoneInvoices(zoneId);
  const { contacts } = useZoneContacts(zoneId);
  const { deals } = useZoneDeals(zoneId);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    currency: 'KZT',
    description: '',
    contact_id: '',
    deal_id: '',
  });

  const handleCreate = async () => {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) {
      toast.error('Укажите сумму');
      return;
    }
    try {
      await create({
        amount,
        currency: form.currency,
        description: form.description || null,
        contact_id: form.contact_id || null,
        deal_id: form.deal_id || null,
      } as any);
      setShowCreate(false);
      setForm({ amount: '', currency: 'KZT', description: '', contact_id: '', deal_id: '' });
      toast.success('Инвойс создан');
    } catch {
      toast.error('Ошибка создания');
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-KZ', { style: 'currency', currency }).format(amount);
  };

  const totalCreated = invoices.filter(i => i.status === 'created').reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Инвойсы</h2>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Новый
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{invoices.length}</div>
            <div className="text-xs text-muted-foreground">Всего</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{formatAmount(totalPaid, 'KZT')}</div>
            <div className="text-xs text-muted-foreground">Оплачено</div>
          </CardContent>
        </Card>
        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-warning">{formatAmount(totalCreated, 'KZT')}</div>
            <div className="text-xs text-muted-foreground">Ожидает оплаты</div>
          </CardContent>
        </Card>
      </div>

      {loading && <div className="text-muted-foreground text-sm">Загрузка...</div>}

      {!loading && invoices.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Нет инвойсов</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Создайте инвойс для клиента</p>
          </CardContent>
        </Card>
      )}

      {/* Invoice List */}
      <div className="space-y-2">
        {invoices.map(inv => {
          const st = STATUS_MAP[inv.status] || STATUS_MAP.created;
          return (
            <Card key={inv.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{formatAmount(Number(inv.amount), inv.currency)}</span>
                      <Badge variant={st.variant} className="text-[10px]">{st.label}</Badge>
                    </div>
                    {inv.description && (
                      <p className="text-sm text-muted-foreground truncate">{inv.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(inv.created_at), 'd MMM yyyy', { locale: ru })}
                    </p>
                  </div>
                  {inv.pay_url && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={inv.pay_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" /> Оплатить
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Новый инвойс</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Сумма</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="10000"
                />
              </div>
              <div>
                <Label>Валюта</Label>
                <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KZT">KZT</SelectItem>
                    <SelectItem value="RUB">RUB</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="За консультацию..."
                rows={2}
              />
            </div>
            {contacts.length > 0 && (
              <div>
                <Label>Контакт</Label>
                <Select value={form.contact_id} onValueChange={v => setForm(f => ({ ...f, contact_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Не указан" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не указан</SelectItem>
                    {contacts.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {deals.length > 0 && (
              <div>
                <Label>Сделка</Label>
                <Select value={form.deal_id} onValueChange={v => setForm(f => ({ ...f, deal_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Не указана" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Не указана</SelectItem>
                    {deals.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Отмена</Button>
            <Button onClick={handleCreate}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

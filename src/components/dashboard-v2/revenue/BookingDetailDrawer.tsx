import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BellRing from 'lucide-react/dist/esm/icons/bell-ring';
import CalendarClock from 'lucide-react/dist/esm/icons/calendar-clock';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import History from 'lucide-react/dist/esm/icons/history';
import UserRound from 'lucide-react/dist/esm/icons/user-round';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatMoney, parseMoney } from '@/domain/revenue/money';
import type {
  BookingOwnerDetail,
  BookingPaymentMethod,
} from '@/services/booking-lifecycle';

interface BookingDetailDrawerProps {
  open: boolean;
  detail: BookingOwnerDetail | null;
  loading?: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmDeposit: (amount: string, method: BookingPaymentMethod) => void | Promise<void>;
  onWaivePayment: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
  onComplete: (amount: string, method: BookingPaymentMethod) => void | Promise<void>;
  onNoShow: () => void | Promise<void>;
}

const SHEET_SIDE = 'right';
const DECIMAL_INPUT_MODE = 'decimal';
const CURRENCY_SYMBOL = '₸';
const DETAIL_SEPARATOR = ' · ';
const PAYMENT_METHODS = {
  cash: 'cash',
  kaspiManual: 'kaspi_manual',
  card: 'manual_card',
  transfer: 'bank_transfer',
  other: 'other',
} as const satisfies Record<string, BookingPaymentMethod>;

function remainingAmount(target: string, paid: string): string {
  const remaining = parseMoney(target) - parseMoney(paid);
  return formatMoney(remaining > 0n ? remaining : 0n);
}

export function BookingDetailDrawer({
  open,
  detail,
  loading = false,
  pending = false,
  onOpenChange,
  onConfirmDeposit,
  onWaivePayment,
  onCancel,
  onComplete,
  onNoShow,
}: BookingDetailDrawerProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('0.00');
  const [method, setMethod] = useState<BookingPaymentMethod>('cash');

  useEffect(() => {
    if (!detail) return;
    setAmount(detail.status === 'pending_payment'
      ? remainingAmount(detail.payment.depositRequiredAmount, detail.payment.paidAmount)
      : remainingAmount(detail.payment.totalAmount, detail.payment.paidAmount));
  }, [detail]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={SHEET_SIDE} className="w-full overflow-y-auto p-5 sm:max-w-lg">
        <SheetHeader className="pr-10">
          <SheetTitle>{detail?.serviceName ?? t('bookingDetail.title', 'Запись')}</SheetTitle>
          <SheetDescription>
            {detail
              ? `${detail.localStart.replace('T', ' ')} · ${detail.timezone}`
              : t('bookingDetail.loading', 'Загружаем факты записи…')}
          </SheetDescription>
        </SheetHeader>

        {loading && !detail && <div className="mt-8 h-32 animate-pulse rounded-2xl bg-muted" />}

        {detail && (
          <div className="mt-6 space-y-5" data-testid="booking-detail-drawer">
            <div className="flex items-center justify-between rounded-2xl bg-muted/60 p-4">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <div className="font-bold">{detail.localStart.replace('T', ' ')}</div>
                  <div className="text-xs text-muted-foreground">{detail.timezone}</div>
                </div>
              </div>
              <Badge variant="outline">{t(`bookings.status.${detail.status}`, detail.status)}</Badge>
            </div>

            <section className="rounded-2xl border border-border/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-black">
                <UserRound className="h-4 w-4 text-primary" aria-hidden="true" />
                {t('bookingDetail.client', 'Клиент')}
              </h3>
              <p className="font-bold">{detail.client.name}</p>
              {detail.client.phone && <a className="block text-sm text-primary" href={`tel:${detail.client.phone}`}>{detail.client.phone}</a>}
              {detail.client.email && <a className="block text-sm text-primary" href={`mailto:${detail.client.email}`}>{detail.client.email}</a>}
              {detail.client.notes && <p className="mt-2 text-sm text-muted-foreground">{detail.client.notes}</p>}
              <p className="mt-3 text-xs text-muted-foreground">
                {t('bookingDetail.source', 'Источник')}: {detail.attribution.source}
              </p>
            </section>

            <section className="rounded-2xl border border-border/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-black">
                <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
                {t('bookingDetail.payment', 'Оплата')}
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">{t('bookingDetail.total', 'Стоимость')}</span><div className="font-bold">{detail.payment.totalAmount} {CURRENCY_SYMBOL}</div></div>
                <div><span className="text-muted-foreground">{t('bookingDetail.paid', 'Получено')}</span><div className="font-bold">{detail.payment.paidAmount} {CURRENCY_SYMBOL}</div></div>
                <div><span className="text-muted-foreground">{t('bookingDetail.deposit', 'Предоплата')}</span><div className="font-bold">{detail.payment.depositRequiredAmount} {CURRENCY_SYMBOL}</div></div>
                <div><span className="text-muted-foreground">{t('bookingDetail.refunded', 'Возвращено')}</span><div className="font-bold">{detail.payment.refundedAmount} {CURRENCY_SYMBOL}</div></div>
              </div>
            </section>

            {(detail.status === 'pending_payment' || (detail.status === 'confirmed' && detail.slotStarted)) && (
              <section className="space-y-3 rounded-2xl bg-primary/[0.04] p-4">
                <div className="grid grid-cols-[1fr_150px] gap-2">
                  <Input
                    aria-label={t('bookingDetail.amount', 'Полученная сумма')}
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    inputMode={DECIMAL_INPUT_MODE}
                  />
                  <select
                    aria-label={t('bookingDetail.method', 'Способ оплаты')}
                    className="rounded-xl border border-input bg-background px-3 text-sm"
                    value={method}
                    onChange={(event) => setMethod(event.target.value as BookingPaymentMethod)}
                  >
                    <option value={PAYMENT_METHODS.cash}>{t('bookingDetail.methods.cash', 'Наличные')}</option>
                    <option value={PAYMENT_METHODS.kaspiManual}>{t('bookingDetail.methods.kaspi', 'Kaspi')}</option>
                    <option value={PAYMENT_METHODS.card}>{t('bookingDetail.methods.card', 'Карта')}</option>
                    <option value={PAYMENT_METHODS.transfer}>{t('bookingDetail.methods.transfer', 'Перевод')}</option>
                    <option value={PAYMENT_METHODS.other}>{t('bookingDetail.methods.other', 'Другое')}</option>
                  </select>
                </div>
                {detail.status === 'pending_payment' ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button disabled={pending} onClick={() => onConfirmDeposit(amount, method)}>
                      {t('bookingDetail.actions.confirmDeposit', 'Подтвердить предоплату')}
                    </Button>
                    <Button disabled={pending} variant="secondary" onClick={onWaivePayment}>
                      {t('bookingDetail.actions.waive', 'Без предоплаты')}
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button disabled={pending} onClick={() => onComplete(amount, method)}>
                      {t('bookingDetail.actions.complete', 'Завершить визит')}
                    </Button>
                    <Button disabled={pending} variant="secondary" onClick={onNoShow}>
                      {t('bookingDetail.actions.noShow', 'Клиент не пришёл')}
                    </Button>
                  </div>
                )}
              </section>
            )}

            {(detail.status === 'pending_payment' || detail.status === 'confirmed') && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={pending} variant="destructive" className="w-full">
                    {t('bookingDetail.actions.cancel', 'Отменить запись')}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {t('bookingDetail.cancelConfirm.title', 'Отменить эту запись?')}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('bookingDetail.cancelConfirm.description', 'Статус изменится на «Отменена». История операции сохранится.')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel', 'Не отменять')}</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={onCancel}
                    >
                      {t('bookingDetail.cancelConfirm.action', 'Да, отменить')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <section className="rounded-2xl border border-border/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-black">
                <History className="h-4 w-4 text-primary" aria-hidden="true" />
                {t('bookingDetail.history', 'История статусов')}
              </h3>
              <div className="space-y-2">
                {detail.transitions.map((transition, index) => (
                  <div key={`${transition.occurredAt}:${index}`} className="flex justify-between gap-3 text-sm">
                    <span>{transition.toStatus}{DETAIL_SEPARATOR}{transition.reasonCode}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{transition.occurredAt.slice(0, 16).replace('T', ' ')}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-black">
                <BellRing className="h-4 w-4 text-primary" aria-hidden="true" />
                {t('bookingDetail.notifications', 'Уведомления')}
              </h3>
              {detail.notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('bookingDetail.notificationsEmpty', 'Доставок пока нет')}</p>
              ) : detail.notifications.map((notification, index) => (
                <div key={`${notification.occurredAt}:${index}`} className="flex items-center justify-between gap-3 py-1 text-sm">
                  <span>{notification.channel}{DETAIL_SEPARATOR}{notification.recipientRole}</span>
                  <Badge variant={notification.eventKind === 'delivered' ? 'secondary' : 'destructive'}>
                    {notification.eventKind === 'delivered'
                      ? t('bookingDetail.delivered', 'Доставлено')
                      : t('bookingDetail.failed', 'Ошибка')}
                  </Badge>
                </div>
              ))}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

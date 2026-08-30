import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BookingLifecycleError,
  loadBookingManagementAvailability,
  loadBookingManagementContext,
  manageBookingWithToken,
  type BookingManagementContext,
  type ManageBookingWithTokenInput,
  type ManagedBookingResult,
  type PublicAvailabilitySlot,
} from '@/services/booking-lifecycle';

export interface BookingManagementAdapter {
  loadContext: (token: string) => Promise<BookingManagementContext>;
  loadAvailability: (input: {
    token: string;
    fromDate: string;
    toDate: string;
  }) => Promise<PublicAvailabilitySlot[]>;
  manage: (input: ManageBookingWithTokenInput) => Promise<ManagedBookingResult>;
}

interface BookingManagementProps {
  tokenOverride?: string;
  adapter?: BookingManagementAdapter;
  initialDate?: string;
}

const DEFAULT_ADAPTER: BookingManagementAdapter = {
  loadContext: loadBookingManagementContext,
  loadAvailability: loadBookingManagementAvailability,
  manage: manageBookingWithToken,
};

const STATUS_FALLBACKS: Record<BookingManagementContext['status'], string> = {
  pending_payment: 'Ожидает предоплаты',
  confirmed: 'Подтверждена',
  completed: 'Завершена',
  cancelled: 'Отменена',
  no_show: 'Клиент не пришёл',
};

function mutationId(): string {
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `manage-booking:${id}`;
}

function todayIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function formatDate(value: string, locale: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
  })
    .format(new Date(Date.UTC(year, month - 1, day)));
}

export function BookingManagement({
  tokenOverride,
  adapter = DEFAULT_ADAPTER,
  initialDate,
}: BookingManagementProps) {
  const params = useParams<{ token: string }>();
  const token = tokenOverride ?? params.token ?? '';
  const { t, i18n } = useTranslation();
  const [booking, setBooking] = useState<BookingManagementContext | null>(null);
  const [error, setError] = useState<BookingLifecycleError | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [date, setDate] = useState(initialDate ?? todayIso());
  const [slots, setSlots] = useState<PublicAvailabilitySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<PublicAvailabilitySlot | null>(null);
  const mutationRef = useRef(mutationId());

  const locale = i18n.language || 'ru';
  const activeSlots = useMemo(() => slots.filter((slot) => slot.available), [slots]);

  const refresh = async () => {
    const next = await adapter.loadContext(token);
    setBooking(next);
    setError(null);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    adapter.loadContext(token)
      .then((next) => {
        if (active) setBooking(next);
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof BookingLifecycleError
          ? reason
          : new BookingLifecycleError('request_failed', true));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [adapter, token]);

  useEffect(() => {
    if (!rescheduling || !date) return;
    let active = true;
    setSlots([]);
    setSelectedSlot(null);
    adapter.loadAvailability({ token, fromDate: date, toDate: date })
      .then((next) => {
        if (active) setSlots(next);
      })
      .catch((reason) => {
        if (!active) return;
        setError(reason instanceof BookingLifecycleError
          ? reason
          : new BookingLifecycleError('request_failed', true));
      });
    return () => { active = false; };
  }, [adapter, date, rescheduling, token]);

  const runAction = async (
    action: ManageBookingWithTokenInput['action'],
    slot: PublicAvailabilitySlot | null = null,
  ) => {
    if (!booking) return;
    setBusy(true);
    setError(null);
    try {
      await adapter.manage({
        token,
        action,
        expectedVersion: booking.version,
        idempotencyKey: mutationRef.current,
        slotDate: slot?.date ?? null,
        slotTime: slot?.time ?? null,
        slotEndTime: slot?.endTime ?? null,
      });
      mutationRef.current = mutationId();
      await refresh();
      setRescheduling(false);
    } catch (reason) {
      mutationRef.current = mutationId();
      setError(reason instanceof BookingLifecycleError
        ? reason
        : new BookingLifecycleError('request_failed', true));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <main className="mx-auto min-h-[70vh] max-w-xl px-4 py-16" aria-busy="true" />;
  }

  if (!booking) {
    const expired = error?.code === 'token_expired';
    const ownerPath = error?.details.ownerPagePath ?? '/';
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg items-center px-4 py-16">
        <section className="w-full space-y-4 rounded-2xl border bg-card p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">
            {expired
              ? t('bookingManagement.expired.title', 'Ссылка устарела')
              : t('bookingManagement.invalid.title', 'Запись недоступна')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {expired
              ? t('bookingManagement.expired.description', 'Свяжитесь со специалистом, чтобы получить актуальную информацию.')
              : t('bookingManagement.invalid.description', 'Проверьте ссылку или запросите новую у специалиста.')}
          </p>
          <Button asChild className="w-full">
            <a href={ownerPath}>{t('bookingManagement.contactOwner', 'Связаться со специалистом')}</a>
          </Button>
        </section>
      </main>
    );
  }

  const statusLabel = t(`bookingManagement.status.${booking.status}`, STATUS_FALLBACKS[booking.status]);

  return (
    <main className="mx-auto min-h-[70vh] max-w-xl px-4 py-12 sm:py-16">
      <section className="space-y-6 rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">{t('bookingManagement.eyebrow', 'Ваша запись')}</p>
          <h1 className="text-2xl font-semibold">{booking.serviceName}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(booking.slotDate, locale)} · {booking.slotTime.slice(0, 5)}
            {booking.slotEndTime ? `–${booking.slotEndTime.slice(0, 5)}` : ''}
          </p>
          <p className="text-xs text-muted-foreground">{booking.timezone}</p>
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            {statusLabel}
          </span>
        </header>

        {error && (
          <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            {t(`bookingManagement.errors.${error.code}`, 'Не удалось обновить запись. Повторите попытку.')}
          </p>
        )}

        {rescheduling && (
          <div className="space-y-4 rounded-xl border p-4">
            <div className="space-y-2">
              <Label htmlFor="booking-management-date">{t('bookingManagement.reschedule.date', 'Новая дата')}</Label>
              <Input
                id="booking-management-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {activeSlots.map((slot) => {
                const selected = selectedSlot?.date === slot.date && selectedSlot.time === slot.time;
                return (
                  <Button
                    key={`${slot.date}:${slot.time}`}
                    type="button"
                    variant={selected ? 'default' : 'outline'}
                    aria-selected={selected}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot.time.slice(0, 5)}{slot.endTime ? `–${slot.endTime.slice(0, 5)}` : ''}
                  </Button>
                );
              })}
            </div>
            <Button
              type="button"
              className="w-full"
              disabled={!selectedSlot || busy}
              onClick={() => void runAction('reschedule', selectedSlot)}
            >
              {t('bookingManagement.reschedule.save', 'Сохранить новое время')}
            </Button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {booking.allowedActions.includes('reschedule') && !rescheduling && (
            <Button type="button" variant="outline" disabled={busy} onClick={() => setRescheduling(true)}>
              {t('bookingManagement.actions.reschedule', 'Перенести')}
            </Button>
          )}
          {booking.allowedActions.includes('confirm') && (
            <Button type="button" variant="outline" disabled={busy} onClick={() => void runAction('confirm')}>
              {t('bookingManagement.actions.confirm', 'Подтвердить участие')}
            </Button>
          )}
          {booking.allowedActions.includes('cancel') && (
            <Button type="button" variant="destructive" disabled={busy} onClick={() => void runAction('cancel')}>
              {t('bookingManagement.actions.cancel', 'Отменить запись')}
            </Button>
          )}
        </div>

        {booking.ownerPagePath && (
          <a className="block text-center text-sm text-primary underline-offset-4 hover:underline" href={booking.ownerPagePath}>
            {t('bookingManagement.contactOwner', 'Связаться со специалистом')}
          </a>
        )}
      </section>
    </main>
  );
}

export default BookingManagement;

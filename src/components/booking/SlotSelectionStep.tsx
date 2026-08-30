import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PublicBookingSlot } from './public-booking-machine';

interface SlotSelectionStepProps {
  date: string;
  slots: PublicBookingSlot[];
  selectedSlot: PublicBookingSlot | null;
  loading: boolean;
  error: string | null;
  errorRef: RefObject<HTMLDivElement>;
  onDateChange: (date: string) => void;
  onSelect: (slot: PublicBookingSlot) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function SlotSelectionStep({
  date,
  slots,
  selectedSlot,
  loading,
  error,
  errorRef,
  onDateChange,
  onSelect,
  onContinue,
  onBack,
}: SlotSelectionStepProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-4" aria-labelledby="public-booking-slot-title">
      <div>
        <h3 id="public-booking-slot-title" className="text-xl font-semibold">
          {t('publicBooking.slot.title', 'Выберите дату и время')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('publicBooking.slot.timezone', 'Время указано в часовом поясе специалиста.')}
        </p>
      </div>

      {error && (
        <div ref={errorRef} role="alert" tabIndex={-1} className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive outline-none">
          {error === 'slot_unavailable'
            ? t('publicBooking.errors.slotUnavailable', 'Это время уже занято. Выберите обновлённый слот.')
            : t('publicBooking.errors.slotRequired', 'Выберите время для продолжения.')}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="public-booking-date">{t('publicBooking.slot.date', 'Дата')}</Label>
        <Input
          id="public-booking-date"
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label={t('publicBooking.slot.available', 'Доступное время')}>
        {loading && <p className="col-span-full text-sm text-muted-foreground">{t('common.loading', 'Загрузка…')}</p>}
        {!loading && slots.filter((slot) => slot.available).map((slot) => {
          const selected = selectedSlot?.date === slot.date && selectedSlot.time === slot.time;
          const label = `${slot.time.slice(0, 5)}${slot.endTime ? `–${slot.endTime.slice(0, 5)}` : ''}`;
          return (
            <Button
              key={`${slot.date}:${slot.time}`}
              type="button"
              aria-selected={selected}
              variant={selected ? 'default' : 'outline'}
              onClick={() => onSelect(slot)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelect(slot);
                }
              }}
            >
              {label}
            </Button>
          );
        })}
        {!loading && slots.every((slot) => !slot.available) && (
          <p className="col-span-full text-sm text-muted-foreground">
            {t('publicBooking.slot.empty', 'На эту дату свободного времени нет.')}
          </p>
        )}
      </div>

      <div className="flex justify-between gap-3 border-t pt-4">
        <Button type="button" variant="ghost" onClick={onBack}>{t('common.back', 'Назад')}</Button>
        <Button type="button" onClick={onContinue}>{t('common.continue', 'Продолжить')}</Button>
      </div>
    </section>
  );
}

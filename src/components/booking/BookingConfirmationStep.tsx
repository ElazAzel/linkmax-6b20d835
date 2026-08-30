import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import type { PublicBookingCreated } from '@/services/booking-lifecycle';

interface BookingConfirmationStepProps {
  booking: PublicBookingCreated;
}

export function BookingConfirmationStep({ booking }: BookingConfirmationStepProps) {
  const { t } = useTranslation();
  const managementUrl = booking.accessToken ? `/booking/manage/${booking.accessToken}` : null;

  return (
    <section className="space-y-4 text-center" aria-labelledby="public-booking-confirmed-title">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-2xl">✓</div>
      <div>
        <h3 id="public-booking-confirmed-title" className="text-xl font-semibold">
          {t('publicBooking.confirmed.title', 'Запись подтверждена')}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('publicBooking.confirmed.description', 'Сохраните ссылку, чтобы подтвердить участие, перенести или отменить запись.')}
        </p>
      </div>
      {managementUrl && (
        <Button asChild className="w-full">
          <a href={managementUrl}>{t('publicBooking.manage', 'Управление записью')}</a>
        </Button>
      )}
    </section>
  );
}

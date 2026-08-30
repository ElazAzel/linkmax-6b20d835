import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import type { PublicBookingCreated } from '@/services/booking-lifecycle';

interface DepositStateStepProps {
  booking: PublicBookingCreated;
  instructions: string | null | undefined;
}

export function DepositStateStep({ booking, instructions }: DepositStateStepProps) {
  const { t } = useTranslation();
  const managementUrl = booking.accessToken ? `/booking/manage/${booking.accessToken}` : null;

  return (
    <section className="space-y-4 text-center" aria-labelledby="public-booking-deposit-title">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-2xl">⌛</div>
      <div>
        <h3 id="public-booking-deposit-title" className="text-xl font-semibold">
          {t('publicBooking.deposit.pendingTitle', 'Ожидает подтверждения предоплаты')}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('publicBooking.deposit.pendingDescription', 'Время станет подтверждённым после проверки оплаты специалистом.')}
        </p>
      </div>
      <div className="rounded-xl bg-muted/60 p-4 text-left">
        <p className="font-semibold">
          {booking.depositRequiredAmount} {booking.currency === 'KZT' ? '₸' : booking.currency}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm">
          {instructions || t('publicBooking.deposit.contactOwner', 'Свяжитесь со специалистом, чтобы получить реквизиты оплаты.')}
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

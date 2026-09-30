import { useTranslation } from 'react-i18next';
import { formatInTimeZone } from 'date-fns-tz';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import { Card } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { bookingName, getBookingInstant, type OfficeBooking } from '@/domain/office/workspace';

const tones = { confirmed: 'success', completed: 'info', pending_payment: 'warning', cancelled: 'destructive', no_show: 'warning' } as const;

export function OfficeBookingList({ bookings, timezone, onOpen }: {
  bookings: OfficeBooking[]; timezone: string; onOpen: (booking: OfficeBooking) => void;
}) {
  const { t, i18n } = useTranslation();
  return <Card className="divide-y divide-border overflow-hidden">
    {bookings.map((booking) => {
      let time = `${booking.slot_date} ${booking.slot_time.slice(0, 5)}`;
      try { time = formatInTimeZone(getBookingInstant(booking), timezone, 'dd.MM · HH:mm'); } catch { /* Show stored local time for legacy invalid zones. */ }
      const statusKey = booking.status === 'completed' ? 'completedStatus' : booking.status;
      return <button key={booking.id} type="button" onClick={() => onOpen(booking)}
        className="flex min-h-16 w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        aria-label={t('digitalOffice.open', 'Открыть запись') + ': ' + booking.client_name}>
        <Calendar className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{booking.client_name}</p>
          <p className="truncate text-sm text-muted-foreground">{bookingName(booking, i18n.language) || t('digitalOffice.unnamed', 'Встреча')}</p>
          <p className="mt-1 text-xs font-num text-muted-foreground">{time}</p>
        </div>
        <StatusBadge tone={tones[booking.status]} className="max-w-[40%] text-wrap text-right">
          {t(`digitalOffice.${statusKey}`, booking.status)}
        </StatusBadge>
      </button>;
    })}
  </Card>;
}

/**
 * BookingCard - Compact booking card for unified activity feed
 */
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { ru, kk, enUS } from 'date-fns/locale';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

interface BookingCardProps {
  booking: {
    id: string;
    client_name: string;
    client_phone: string | null;
    slot_date: string;
    slot_time: string;
    slot_end_time: string | null;
    status: string;
    created_at: string;
  };
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onClick?: () => void;
  compact?: boolean;
}

const localeMap: Record<string, typeof enUS> = { ru, kk, en: enUS };

export const BookingCard = memo(function BookingCard({
  booking,
  onConfirm,
  onCancel,
  onClick,
  compact = false,
}: BookingCardProps) {
  const { t, i18n } = useTranslation();
  const locale = localeMap[i18n.language] || enUS;
  const isPending = booking.status === 'pending';
  const isCompleted = booking.status === 'completed';

  const dateLabel = (() => {
    try {
      return format(parseISO(booking.slot_date), 'd MMM', { locale });
    } catch {
      return booking.slot_date;
    }
  })();

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-2xl glass-card border-white/10 transition-all duration-300',
        isPending && 'border-amber-500/30 ring-1 ring-amber-500/20',
        onClick && 'cursor-pointer hover:bg-primary/5 active:scale-[0.98]',
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10 rounded-xl shrink-0">
          <AvatarFallback className={cn(
            'rounded-xl text-sm font-bold',
            isPending ? 'bg-amber-500 text-white' : isCompleted ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'
          )}>
            {booking.client_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-sm truncate">{booking.client_name}</span>
            <Badge className={cn(
              'text-[10px] font-bold h-5 px-1.5 border-0 shrink-0',
              isPending ? 'bg-amber-500 text-white' : isCompleted ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'
            )}>
              {isPending ? t('crm.bookingStatus.pending', 'Ожидает') : isCompleted ? t('crm.bookingStatus.completed', 'Выполнено') : t('crm.bookingStatus.confirmed', 'Подтв.')}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {dateLabel}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {booking.slot_time}{booking.slot_end_time ? `–${booking.slot_end_time}` : ''}
            </span>
          </div>

          {/* Quick actions for pending bookings */}
          {isPending && !compact && (
            <div className="flex gap-2 mt-2">
              {onConfirm && (
                <Button
                  size="sm"
                  className="h-7 px-3 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={(e) => { e.stopPropagation(); onConfirm(booking.id); }}
                >
                  <Check className="h-3 w-3 mr-1" />
                  {t('crm.booking.confirm', 'Подтвердить')}
                </Button>
              )}
              {onCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 rounded-lg text-xs font-bold"
                  onClick={(e) => { e.stopPropagation(); onCancel(booking.id); }}
                >
                  <X className="h-3 w-3 mr-1" />
                  {t('crm.booking.cancel', 'Отклонить')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

import { memo, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale } from 'date-fns';
import { useZoneBookings, ZoneBooking } from '@/hooks/zones/useZoneBookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils/utils';
import {
  addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  format, isSameDay, isWithinInterval, eachDayOfInterval, getDay,
  addMonths, subMonths, addWeeks, subWeeks, parseISO
} from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import CalendarIcon from 'lucide-react/dist/esm/icons/calendar';
import Clock from 'lucide-react/dist/esm/icons/clock';
import User from 'lucide-react/dist/esm/icons/user';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

interface Props {
  zoneId: string;
}

type CalendarView = 'day' | 'week' | 'month';

const STATUS_COLORS: Record<string, string> = {
  confirmed: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  pending: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
  cancelled: 'bg-destructive/20 text-destructive',
};

function getDateLocale(lang: string) {
  if (lang === 'ru') return ru;
  if (lang === 'kk') return kk;
  return enUS;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 - 21:00

export const ZoneBookingsCalendarScreen = memo(function ZoneBookingsCalendarScreen({ zoneId }: Props) {
  const { t, i18n } = useTranslation();
  const { bookings, loading } = useZoneBookings(zoneId);
  const [view, setView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<ZoneBooking | null>(null);
  const locale = getDateLocale(i18n.language);

  // Navigation
  const navigate = useCallback((dir: 1 | -1) => {
    setCurrentDate(prev => {
      if (view === 'day') return dir === 1 ? addDays(prev, 1) : subDays(prev, 1);
      if (view === 'week') return dir === 1 ? addWeeks(prev, 1) : subWeeks(prev, 1);
      return dir === 1 ? addMonths(prev, 1) : subMonths(prev, 1);
    });
  }, [view]);

  const goToday = useCallback(() => setCurrentDate(new Date()), []);

  // Days in current view
  const viewDays = useMemo(() => {
    if (view === 'day') return [currentDate];
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start, end: endOfWeek(currentDate, { weekStartsOn: 1 }) });
    }
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const monthStart = startOfWeek(start, { weekStartsOn: 1 });
    const monthEnd = endOfWeek(end, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentDate, view]);

  // Bookings by date
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, ZoneBooking[]>();
    for (const b of bookings) {
      const key = b.slot_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    // Sort by time
    for (const [, arr] of map) {
      arr.sort((a, b) => a.slot_time.localeCompare(b.slot_time));
    }
    return map;
  }, [bookings]);

  // Header title
  const headerTitle = useMemo(() => {
    if (view === 'day') return format(currentDate, 'd MMMM yyyy', { locale });
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, 'd MMM', { locale })} — ${format(end, 'd MMM yyyy', { locale })}`;
    }
    return format(currentDate, 'LLLL yyyy', { locale });
  }, [currentDate, view, locale]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayBookings = bookingsByDate.get(todayStr) || [];
    const upcoming = bookings.filter(b => b.slot_date >= todayStr && b.status !== 'cancelled');
    return {
      today: todayBookings.length,
      upcoming: upcoming.length,
      total: bookings.length,
    };
  }, [bookings, bookingsByDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{t('zones.calendar.title', 'Календарь записей')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('zones.calendar.subtitle', 'Все записи из блоков Booking ваших страниц')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{t('zones.calendar.today', 'Сегодня')}: {stats.today}</Badge>
          <Badge variant="outline">{t('zones.calendar.upcoming', 'Предстоящие')}: {stats.upcoming}</Badge>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            {t('zones.calendar.todayBtn', 'Сегодня')}
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium ml-2 capitalize">{headerTitle}</span>
        </div>
        <Tabs value={view} onValueChange={v => setView(v as CalendarView)}>
          <TabsList>
            <TabsTrigger value="day">{t('zones.calendar.day', 'День')}</TabsTrigger>
            <TabsTrigger value="week">{t('zones.calendar.week', 'Неделя')}</TabsTrigger>
            <TabsTrigger value="month">{t('zones.calendar.month', 'Месяц')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Calendar Grid */}
      {view === 'month' ? (
        <MonthView
          days={viewDays}
          bookingsByDate={bookingsByDate}
          currentDate={currentDate}
          locale={locale}
          onSelectBooking={setSelectedBooking}
          t={t}
        />
      ) : (
        <WeekDayView
          days={viewDays}
          bookingsByDate={bookingsByDate}
          locale={locale}
          onSelectBooking={setSelectedBooking}
          t={t}
        />
      )}

      {/* Booking Detail Sheet */}
      <Sheet open={!!selectedBooking} onOpenChange={open => !open && setSelectedBooking(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{t('zones.calendar.bookingDetail', 'Детали записи')}</SheetTitle>
          </SheetHeader>
          {selectedBooking && <BookingDetail booking={selectedBooking} t={t} />}
        </SheetContent>
      </Sheet>
    </div>
  );
});

// ============ Month View ============
function MonthView({
  days, bookingsByDate, currentDate, locale, onSelectBooking, t,
}: {
  days: Date[];
  bookingsByDate: Map<string, ZoneBooking[]>;
  currentDate: Date;
  locale: Locale;
  onSelectBooking: (b: ZoneBooking) => void;
  t: any;
}) {
  const today = new Date();
  const currentMonth = currentDate.getMonth();

  return (
    <Card>
      <CardContent className="p-0">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => (
            <div key={i} className="p-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0">
              {t(`zones.calendar.weekdays.${i}`, d)}
            </div>
          ))}
        </div>
        {/* Days grid */}
        <div className="grid grid-cols-7">
          {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayBookings = bookingsByDate.get(dateStr) || [];
            const isToday = isSameDay(day, today);
            const isCurrentMonth = day.getMonth() === currentMonth;

            return (
              <div
                key={i}
                className={cn(
                  'min-h-[80px] md:min-h-[100px] border-r border-b last:border-r-0 p-1',
                  !isCurrentMonth && 'bg-muted/30'
                )}
              >
                <div className={cn(
                  'text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full',
                  isToday && 'bg-primary text-primary-foreground',
                  !isCurrentMonth && 'text-muted-foreground'
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {dayBookings.slice(0, 3).map(b => (
                    <button
                      key={b.id}
                      onClick={() => onSelectBooking(b)}
                      className={cn(
                        'w-full text-left text-[10px] px-1 py-0.5 rounded truncate cursor-pointer transition-colors',
                        STATUS_COLORS[b.status] || 'bg-muted'
                      )}
                    >
                      {b.slot_time?.slice(0, 5)} {b.client_name}
                    </button>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{dayBookings.length - 3} {t('common.more', 'ещё')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============ Week/Day View (time grid) ============
function WeekDayView({
  days, bookingsByDate, locale, onSelectBooking, t,
}: {
  days: Date[];
  bookingsByDate: Map<string, ZoneBooking[]>;
  locale: Locale;
  onSelectBooking: (b: ZoneBooking) => void;
  t: any;
}) {
  const today = new Date();

  return (
    <Card>
      <CardContent className="p-0 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header row */}
          <div className="grid border-b" style={{ gridTemplateColumns: `60px repeat(${days.length}, 1fr)` }}>
            <div className="p-2 border-r text-xs text-muted-foreground" />
            {days.map((day, i) => {
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={i}
                  className={cn(
                    'p-2 text-center border-r last:border-r-0',
                    isToday && 'bg-primary/5'
                  )}
                >
                  <div className="text-xs text-muted-foreground capitalize">
                    {format(day, 'EEE', { locale })}
                  </div>
                  <div className={cn(
                    'text-sm font-semibold w-7 h-7 mx-auto flex items-center justify-center rounded-full',
                    isToday && 'bg-primary text-primary-foreground'
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <ScrollArea className="h-[500px] md:h-[600px]">
            <div className="relative">
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="grid border-b"
                  style={{
                    gridTemplateColumns: `60px repeat(${days.length}, 1fr)`,
                    minHeight: '48px',
                  }}
                >
                  <div className="p-1 border-r text-[10px] text-muted-foreground text-right pr-2 pt-0">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {days.map((day, di) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayBookings = bookingsByDate.get(dateStr) || [];
                    const hourBookings = dayBookings.filter(b => {
                      const bHour = parseInt(b.slot_time?.split(':')[0] || '0', 10);
                      return bHour === hour;
                    });

                    return (
                      <div key={di} className="border-r last:border-r-0 relative p-0.5">
                        {hourBookings.map(b => (
                          <button
                            key={b.id}
                            onClick={() => onSelectBooking(b)}
                            className={cn(
                              'w-full text-left text-[10px] px-1.5 py-1 rounded mb-0.5 cursor-pointer transition-all hover:scale-[1.02]',
                              STATUS_COLORS[b.status] || 'bg-muted'
                            )}
                          >
                            <div className="font-medium truncate">{b.client_name}</div>
                            <div className="opacity-70">{b.slot_time?.slice(0, 5)}{b.slot_end_time ? ` — ${b.slot_end_time.slice(0, 5)}` : ''}</div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

// ============ Booking Detail ============
function BookingDetail({ booking, t }: { booking: ZoneBooking; t: any }) {
  return (
    <div className="mt-4 space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{booking.client_name}</span>
        </div>
        {booking.client_email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{booking.client_email}</span>
          </div>
        )}
        {booking.client_phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{booking.client_phone}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{booking.slot_date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            {booking.slot_time?.slice(0, 5)}
            {booking.slot_end_time && ` — ${booking.slot_end_time.slice(0, 5)}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn(STATUS_COLORS[booking.status])}>
            {t(`zones.calendar.status.${booking.status}`, booking.status)}
          </Badge>
        </div>
        {booking.client_notes && (
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">{booking.client_notes}</p>
          </div>
        )}
        {booking.page_title && (
          <div className="text-xs text-muted-foreground border-t pt-3">
            {t('zones.calendar.fromPage', 'Со страницы')}: {booking.page_title}
          </div>
        )}
      </div>
    </div>
  );
}

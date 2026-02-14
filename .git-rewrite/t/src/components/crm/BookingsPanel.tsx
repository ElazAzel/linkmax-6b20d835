import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  MessageSquare,
  Check,
  X,
  RefreshCw,
  CalendarDays,
  Download,
  CalendarPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { ru, kk, enUS } from 'date-fns/locale';

interface Booking {
  id: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  client_notes: string | null;
  slot_date: string;
  slot_time: string;
  slot_end_time: string | null;
  status: string;
  created_at: string;
  block_id: string;
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-green-500/20 text-green-500 border-green-500/30',
  pending: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  cancelled: 'bg-red-500/20 text-red-500 border-red-500/30',
  completed: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
};

export function BookingsPanel() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const locale = i18n.language === 'ru' ? ru : i18n.language === 'kk' ? kk : enUS;

  const fetchBookings = async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('owner_id', user.id)
      .order('slot_date', { ascending: true })
      .order('slot_time', { ascending: true });

    if (error) {
      console.error('Error fetching bookings:', error);
      toast.error(t('bookings.fetchError', 'Failed to load bookings'));
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_by: 'owner' })
      .eq('id', selectedBooking.id);

    if (error) {
      toast.error(t('bookings.cancelError', 'Failed to cancel booking'));
    } else {
      toast.success(t('bookings.cancelSuccess', 'Booking cancelled'));
      fetchBookings();
    }

    setCancelDialogOpen(false);
    setSelectedBooking(null);
  };

  const handleConfirmBooking = async (booking: Booking) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', booking.id);

    if (error) {
      toast.error(t('bookings.confirmError', 'Failed to confirm booking'));
    } else {
      toast.success(t('bookings.confirmSuccess', 'Booking confirmed'));
      fetchBookings();
    }
  };

  const handleCompleteBooking = async (booking: Booking) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .eq('id', booking.id);

    if (error) {
      toast.error(t('bookings.completeError', 'Failed to complete booking'));
    } else {
      toast.success(t('bookings.completeSuccess', 'Booking marked as completed'));
      fetchBookings();
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = parseISO(booking.slot_date);
    const isBookingPast = isPast(bookingDate) && !isToday(bookingDate);

    if (statusFilter === 'upcoming') {
      return !isBookingPast && booking.status !== 'cancelled' && booking.status !== 'completed';
    }
    if (statusFilter === 'past') {
      return isBookingPast || booking.status === 'cancelled' || booking.status === 'completed';
    }
    return true;
  });

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => {
      const d = parseISO(b.slot_date);
      return (!isPast(d) || isToday(d)) && b.status !== 'cancelled' && b.status !== 'completed';
    }).length,
    today: bookings.filter(b => isToday(parseISO(b.slot_date)) && b.status !== 'cancelled').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
  };

  const formatBookingDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return t('bookings.today', 'Today');
    if (isTomorrow(date)) return t('bookings.tomorrow', 'Tomorrow');
    return format(date, 'd MMMM', { locale });
  };

  const formatTime = (time: string, endTime?: string | null) => {
    const formatted = time.slice(0, 5);
    if (endTime) {
      return `${formatted} - ${endTime.slice(0, 5)}`;
    }
    return formatted;
  };

  // Export bookings to CSV
  const exportToCSV = () => {
    if (filteredBookings.length === 0) {
      toast.error(t('bookings.noBookingsToExport', 'No bookings to export'));
      return;
    }

    const headers = ['Date', 'Time', 'Name', 'Phone', 'Email', 'Notes', 'Status', 'Created'];
    const rows = filteredBookings.map(booking => [
      booking.slot_date,
      booking.slot_time.slice(0, 5),
      booking.client_name,
      booking.client_phone || '',
      booking.client_email || '',
      booking.client_notes || '',
      booking.status,
      new Date(booking.created_at).toISOString().split('T')[0],
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success(t('bookings.exportSuccess', 'Bookings exported successfully'));
  };

  // Generate ICS file for calendar
  const generateICS = (booking: Booking) => {
    const startDate = parseISO(booking.slot_date);
    const [hours, minutes] = booking.slot_time.split(':').map(Number);
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate);
    if (booking.slot_end_time) {
      const [endHours, endMinutes] = booking.slot_end_time.split(':').map(Number);
      endDate.setHours(endHours, endMinutes, 0, 0);
    } else {
      endDate.setHours(hours + 1, minutes, 0, 0);
    }

    const formatICSDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//LinkMAX//Booking//EN
BEGIN:VEVENT
UID:${booking.id}@linkmax
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${formatICSDate(startDate)}
DTEND:${formatICSDate(endDate)}
SUMMARY:${t('bookings.appointmentWith', 'Appointment with')} ${booking.client_name}
DESCRIPTION:${booking.client_notes ? booking.client_notes.replace(/\n/g, '\\n') : ''}\\n${booking.client_phone ? `Tel: ${booking.client_phone}` : ''}\\n${booking.client_email ? `Email: ${booking.client_email}` : ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `booking-${booking.client_name.replace(/\s+/g, '-')}-${booking.slot_date}.ics`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success(t('bookings.calendarExported', 'Added to calendar'));
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
        {t('messages.loading', 'Loading...')}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 p-3 border-b">
        <div className="text-center p-2 rounded-lg bg-primary/10">
          <div className="text-lg font-bold text-primary">{stats.total}</div>
          <div className="text-[10px] text-muted-foreground">{t('bookings.total', 'Total')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-green-500/10">
          <div className="text-lg font-bold text-green-500">{stats.upcoming}</div>
          <div className="text-[10px] text-muted-foreground">{t('bookings.upcoming', 'Upcoming')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-yellow-500/10">
          <div className="text-lg font-bold text-yellow-500">{stats.today}</div>
          <div className="text-[10px] text-muted-foreground">{t('bookings.today', 'Today')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-blue-500/10">
          <div className="text-lg font-bold text-blue-500">{stats.confirmed}</div>
          <div className="text-[10px] text-muted-foreground">{t('bookings.confirmed', 'Confirmed')}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mx-0 rounded-none border-b bg-transparent h-10">
          <TabsTrigger value="upcoming" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs">
            {t('bookings.upcoming', 'Upcoming')}
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs">
            {t('bookings.past', 'Past')}
          </TabsTrigger>
          <TabsTrigger value="all" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs">
            {t('bookings.all', 'All')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Bookings List */}
      <ScrollArea className="flex-1">
        {filteredBookings.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('bookings.noBookings', 'No bookings yet')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="m-3 p-3 border rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {/* Date & Time */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatBookingDate(booking.slot_date)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTime(booking.slot_time, booking.slot_end_time)}
                      </Badge>
                    </div>

                    {/* Client Info */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        {booking.client_name}
                      </div>
                      {booking.client_phone && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <a href={`tel:${booking.client_phone}`} className="hover:text-primary">
                            {booking.client_phone}
                          </a>
                        </div>
                      )}
                      {booking.client_email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <a href={`mailto:${booking.client_email}`} className="hover:text-primary truncate">
                            {booking.client_email}
                          </a>
                        </div>
                      )}
                      {booking.client_notes && (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2">
                          <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{booking.client_notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className={`${statusColors[booking.status]} text-[10px]`}>
                      {t(`bookings.status.${booking.status}`, booking.status)}
                    </Badge>

                    {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                      <div className="flex gap-1">
                        {/* Add to Calendar */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-primary hover:text-primary/80 hover:bg-primary/10"
                          onClick={() => generateICS(booking)}
                          title={t('bookings.addToCalendar', 'Add to Calendar')}
                        >
                          <CalendarPlus className="h-4 w-4" />
                        </Button>
                        {booking.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                            onClick={() => handleConfirmBooking(booking)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                            onClick={() => handleCompleteBooking(booking)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => {
                            setSelectedBooking(booking);
                            setCancelDialogOpen(true);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Actions Row */}
      <div className="p-3 border-t flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={exportToCSV}>
          <Download className="h-4 w-4 mr-2" />
          {t('bookings.exportCSV', 'CSV')}
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={fetchBookings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('bookings.refresh', 'Refresh')}
        </Button>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bookings.cancelTitle', 'Cancel Booking?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bookings.cancelDescription', 'Are you sure you want to cancel this booking? The client will be notified.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelBooking} className="bg-destructive text-destructive-foreground">
              {t('bookings.confirmCancel', 'Yes, Cancel Booking')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

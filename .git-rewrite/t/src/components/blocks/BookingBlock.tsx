import { memo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Clock, CalendarDays, User, Phone, Mail, Check, Loader2, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrencySymbol } from '@/components/form-fields/CurrencySelect';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { ru, kk } from 'date-fns/locale';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import type { BookingBlock as BookingBlockType } from '@/types/page';

interface BookingBlockProps {
  block: BookingBlockType;
  pageOwnerId?: string;
  pageId?: string;
}

interface TimeSlot {
  time: string;
  endTime?: string;
  available: boolean;
  bookingId?: string;
}

interface BookingFormData {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

export const BookingBlock = memo(function BookingBlockComponent({ 
  block, 
  pageOwnerId,
  pageId 
}: BookingBlockProps) {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<BookingFormData>({
    name: '',
    phone: '',
    email: '',
    notes: ''
  });

  const locale = i18n.language === 'ru' ? ru : i18n.language === 'kk' ? kk : undefined;

  // Fetch available slots for selected date
  const fetchSlots = useCallback(async (date: Date) => {
    if (!pageId || !block.id) return;
    
    setLoading(true);
    try {
      const dayOfWeek = date.getDay();
      const dateStr = format(date, 'yyyy-MM-dd');

      // Fetch slot templates for this day
      const { data: slotTemplates } = await supabase
        .from('booking_slots')
        .select('*')
        .eq('page_id', pageId)
        .eq('block_id', block.id)
        .eq('is_available', true)
        .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${dateStr}`);

      // Fetch existing bookings for this date
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('page_id', pageId)
        .eq('block_id', block.id)
        .eq('slot_date', dateStr)
        .neq('status', 'cancelled');

      // Generate slots from templates
      const generatedSlots: TimeSlot[] = [];
      
      // If block has custom slots defined
      if (block.slots && block.slots.length > 0) {
        block.slots.forEach(slot => {
          const isBooked = bookings?.some(b => 
            b.slot_time === slot.startTime
          );
          generatedSlots.push({
            time: slot.startTime,
            endTime: slot.endTime,
            available: !isBooked,
            bookingId: bookings?.find(b => b.slot_time === slot.startTime)?.id
          });
        });
      } else if (slotTemplates && slotTemplates.length > 0) {
        slotTemplates.forEach(template => {
          const isBooked = bookings?.some(b => 
            b.slot_time === template.start_time
          );
          generatedSlots.push({
            time: template.start_time,
            endTime: template.end_time,
            available: !isBooked,
            bookingId: bookings?.find(b => b.slot_time === template.start_time)?.id
          });
        });
      } else {
        // Generate default slots from block settings
        const startHour = block.workingHoursStart || 9;
        const endHour = block.workingHoursEnd || 18;
        const duration = block.slotDuration || 60;

        for (let hour = startHour; hour < endHour; hour++) {
          for (let min = 0; min < 60; min += duration) {
            if (hour + min / 60 >= endHour) break;
            
            const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
            const endMinutes = min + duration;
            const endHourCalc = hour + Math.floor(endMinutes / 60);
            const endMinCalc = endMinutes % 60;
            const endTimeStr = `${endHourCalc.toString().padStart(2, '0')}:${endMinCalc.toString().padStart(2, '0')}:00`;

            const isBooked = bookings?.some(b => b.slot_time === timeStr);
            
            generatedSlots.push({
              time: timeStr,
              endTime: endTimeStr,
              available: !isBooked,
              bookingId: bookings?.find(b => b.slot_time === timeStr)?.id
            });
          }
        }
      }

      setSlots(generatedSlots.sort((a, b) => a.time.localeCompare(b.time)));
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  }, [pageId, block.id, block.slots, block.workingHoursStart, block.workingHoursEnd, block.slotDuration]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate, fetchSlots]);

  const handleSelectSlot = (slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot || !pageId || !pageOwnerId) return;

    setSubmitting(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('bookings')
        .insert({
          page_id: pageId,
          block_id: block.id,
          owner_id: pageOwnerId,
          user_id: session?.session?.user?.id || null,
          slot_date: format(selectedDate, 'yyyy-MM-dd'),
          slot_time: selectedSlot.time,
          slot_end_time: selectedSlot.endTime || null,
          client_name: formData.name,
          client_phone: formData.phone || null,
          client_email: formData.email || null,
          client_notes: formData.notes || null,
        });

      if (error) throw error;

      // Send notification to owner
      try {
        await supabase.functions.invoke('send-booking-notification', {
          body: {
            ownerId: pageOwnerId,
            clientName: formData.name,
            clientPhone: formData.phone,
            clientEmail: formData.email,
            date: format(selectedDate, 'dd.MM.yyyy'),
            time: selectedSlot.time.substring(0, 5),
          }
        });
      } catch {
        // Notification failed but booking succeeded
      }

      toast.success(t('booking.success', 'Вы успешно записались!'));
      setShowForm(false);
      setSelectedSlot(null);
      
      // If prepayment is required, redirect to WhatsApp
      if (block.requirePrepayment && block.prepaymentPhone) {
        const phone = block.prepaymentPhone.replace(/[^0-9]/g, '');
        const amount = block.prepaymentAmount || 0;
        const currency = getCurrencySymbol(block.prepaymentCurrency || 'KZT');
        const message = encodeURIComponent(
          `Здравствуйте! Я записался(ась) на ${format(selectedDate, 'd MMMM', { locale })} в ${selectedSlot.time.substring(0, 5)}.\n` +
          `Имя: ${formData.name}\n` +
          `${amount > 0 ? `Сумма предоплаты: ${amount} ${currency}` : 'Хочу оплатить запись.'}`
        );
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
      }
      
      setFormData({ name: '', phone: '', email: '', notes: '' });
      
      // Refresh slots
      fetchSlots(selectedDate);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(t('booking.error', 'Ошибка при записи. Попробуйте снова.'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const disabledDays = (date: Date) => {
    // Disable past dates
    if (isBefore(startOfDay(date), startOfDay(new Date()))) return true;
    
    // Disable dates beyond max booking days
    const maxDays = block.maxBookingDays || 30;
    if (isBefore(addDays(new Date(), maxDays), date)) return true;
    
    // Disable specific weekdays if configured
    if (block.disabledWeekdays?.includes(date.getDay())) return true;
    
    return false;
  };

  const blockTitle = typeof block.title === 'object' 
    ? getTranslatedString(block.title, i18n.language as SupportedLanguage)
    : block.title;
  
  const blockDescription = typeof block.description === 'object'
    ? getTranslatedString(block.description, i18n.language as SupportedLanguage)
    : block.description;

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-primary" />
          {blockTitle || t('booking.title', 'Записаться')}
        </CardTitle>
        {blockDescription && (
          <p className="text-sm text-muted-foreground">{blockDescription}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={disabledDays}
            locale={locale}
            className="rounded-md border"
          />
        </div>

        {/* Time slots */}
        {selectedDate && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4" />
              {t('booking.availableSlots', 'Доступное время')} - {format(selectedDate, 'd MMMM', { locale })}
            </div>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('booking.noSlots', 'Нет доступных слотов на эту дату')}
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map((slot, idx) => (
                  <Button
                    key={idx}
                    variant={slot.available ? "outline" : "ghost"}
                    size="sm"
                    disabled={!slot.available}
                    onClick={() => handleSelectSlot(slot)}
                    className={`${
                      slot.available 
                        ? 'hover:bg-primary hover:text-primary-foreground' 
                        : 'opacity-50 cursor-not-allowed line-through'
                    }`}
                  >
                    {formatTime(slot.time)}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border bg-background" />
            <span>{t('booking.available', 'Свободно')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-muted opacity-50" />
            <span>{t('booking.booked', 'Занято')}</span>
          </div>
        </div>
      </CardContent>

      {/* Booking Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              {t('booking.confirmBooking', 'Подтверждение записи')}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && selectedSlot && (
                <span className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">
                    {format(selectedDate, 'd MMMM', { locale })}
                  </Badge>
                  <Badge variant="secondary">
                    {formatTime(selectedSlot.time)}
                    {selectedSlot.endTime && ` - ${formatTime(selectedSlot.endTime)}`}
                  </Badge>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('booking.name', 'Ваше имя')} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder={t('booking.namePlaceholder', 'Введите имя')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t('booking.phone', 'Телефон')}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 (___) ___-__-__"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('booking.email', 'Email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t('booking.notes', 'Комментарий')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('booking.notesPlaceholder', 'Дополнительная информация...')}
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                {t('common.cancel', 'Отмена')}
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : block.requirePrepayment ? (
                  <MessageCircle className="h-4 w-4 mr-2" />
                ) : null}
                {block.requirePrepayment 
                  ? t('booking.confirmAndPay', 'Записаться и оплатить')
                  : t('booking.confirm', 'Записаться')
                }
              </Button>
            </div>

            {block.requirePrepayment && block.prepaymentAmount && (
              <p className="text-xs text-muted-foreground text-center">
                {t('booking.prepaymentNote', 'После записи вы будете перенаправлены в WhatsApp для оплаты')}
                {' '}({block.prepaymentAmount} {getCurrencySymbol(block.prepaymentCurrency || 'KZT')})
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
});

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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, CalendarDays, User, Phone, Mail, Check, Loader2, MessageCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrencySymbol } from '@/components/form-fields/CurrencySelect';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfDay, isToday, isTomorrow } from 'date-fns';
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

  // Calculate stats for the selected date
  const availableCount = slots.filter(s => s.available).length;
  const bookedCount = slots.filter(s => !s.available).length;
  const totalCount = slots.length;

  // Format date label
  const getDateLabel = (date: Date) => {
    if (isToday(date)) return t('booking.today', 'Сегодня');
    if (isTomorrow(date)) return t('booking.tomorrow', 'Завтра');
    return format(date, 'd MMMM, EEEE', { locale });
  };

  // Get working hours display
  const getWorkingHours = () => {
    const start = block.workingHoursStart || 9;
    const end = block.workingHoursEnd || 18;
    return `${start.toString().padStart(2, '0')}:00 — ${end.toString().padStart(2, '0')}:00`;
  };

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarDays className="h-5 w-5 text-primary" />
          {blockTitle || t('booking.title', 'Записаться')}
        </CardTitle>
        {blockDescription && (
          <p className="text-sm text-muted-foreground">{blockDescription}</p>
        )}
        {/* Working hours info */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
          <Clock className="h-3 w-3" />
          <span>{t('booking.workingHours', 'Приём')}: {getWorkingHours()}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-2">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
            selectedDate ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <span className="text-muted-foreground">{t('booking.step1', 'Выберите дату')}</span>
          {selectedDate && (
            <>
              <div className="h-px flex-1 bg-border" />
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                selectedSlot ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <span className="text-muted-foreground">{t('booking.step2', 'Время')}</span>
            </>
          )}
        </div>

        {/* Calendar */}
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={disabledDays}
            locale={locale}
            className="rounded-xl border bg-card"
          />
        </div>

        {/* Time slots section */}
        {selectedDate && (
          <div className="space-y-3">
            {/* Date header with stats */}
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">{getDateLabel(selectedDate)}</span>
              </div>
              {!loading && totalCount > 0 && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {availableCount} {t('booking.free', 'свободно')}
                  </span>
                  {bookedCount > 0 && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="h-3.5 w-3.5" />
                      {bookedCount} {t('booking.taken', 'занято')}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">
                  {t('booking.loadingSlots', 'Загружаем расписание...')}
                </span>
              </div>
            ) : slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <Info className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {t('booking.noSlotsTitle', 'Нет доступных слотов')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('booking.noSlotsHint', 'Попробуйте выбрать другую дату')}
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="max-h-[200px]">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pr-3">
                  {slots.map((slot, idx) => (
                    <Button
                      key={idx}
                      variant={selectedSlot?.time === slot.time ? "default" : slot.available ? "outline" : "ghost"}
                      size="default"
                      disabled={!slot.available}
                      onClick={() => handleSelectSlot(slot)}
                      className={`relative h-auto py-3 flex flex-col items-center gap-0.5 transition-all ${
                        slot.available 
                          ? selectedSlot?.time === slot.time
                            ? 'ring-2 ring-primary ring-offset-2'
                            : 'hover:bg-primary/10 hover:border-primary'
                          : 'opacity-40 cursor-not-allowed bg-muted/30'
                      }`}
                    >
                      <span className={`text-base font-semibold ${
                        slot.available ? '' : 'line-through'
                      }`}>
                        {formatTime(slot.time)}
                      </span>
                      {slot.endTime && (
                        <span className="text-[10px] text-muted-foreground">
                          — {formatTime(slot.endTime)}
                        </span>
                      )}
                      {!slot.available && (
                        <Badge variant="secondary" className="absolute -top-1 -right-1 text-[9px] px-1 py-0">
                          {t('booking.occupied', 'занято')}
                        </Badge>
                      )}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Quick action after slot selection */}
            {selectedSlot && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">
                      {t('booking.selectedTime', 'Выбрано')}: <strong>{formatTime(selectedSlot.time)}</strong>
                      {selectedSlot.endTime && ` — ${formatTime(selectedSlot.endTime)}`}
                    </span>
                  </div>
                  <Button size="sm" onClick={() => setShowForm(true)}>
                    {t('booking.continue', 'Далее')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend - more compact */}
        <div className="flex items-center justify-center gap-6 text-[11px] text-muted-foreground pt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-primary/30 bg-background" />
            <span>{t('booking.available', 'Свободно')}</span>
          </div>
          <div className="flex items-center gap-1.5">
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
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {t('booking.confirmBooking', 'Оформление записи')}
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-col gap-2 mt-2">
                {selectedDate && selectedSlot && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {format(selectedDate, 'd MMMM, EEEE', { locale })}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {formatTime(selectedSlot.time)}
                      {selectedSlot.endTime && ` — ${formatTime(selectedSlot.endTime)}`}
                    </span>
                  </div>
                )}
              </div>
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
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t('booking.phone', 'Телефон')}
                {block.requirePhone && ' *'}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 (___) ___-__-__"
                required={block.requirePhone}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t('booking.email', 'Email')}
                {block.requireEmail && ' *'}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
                required={block.requireEmail}
                className="h-12"
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

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1 h-12"
              >
                {t('common.cancel', 'Отмена')}
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 h-12">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : block.requirePrepayment ? (
                  <MessageCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
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

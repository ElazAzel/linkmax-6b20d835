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
import { supabase } from '@/platform/supabase/client';
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
        const startHour = block.workingHoursStart ?? 9;
        const endHour = block.workingHoursEnd ?? 18;
        const duration = block.slotDuration || 60;

        // Calculate total minutes from start to end
        const startMinutes = startHour * 60;
        const endMinutes = endHour * 60;
        
        // Generate slots based on duration
        for (let slotStart = startMinutes; slotStart + duration <= endMinutes; slotStart += duration) {
          const slotEnd = slotStart + duration;
          
          const startHr = Math.floor(slotStart / 60);
          const startMin = slotStart % 60;
          const endHr = Math.floor(slotEnd / 60);
          const endMin = slotEnd % 60;
          
          const timeStr = `${startHr.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}:00`;
          const endTimeStr = `${endHr.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;

          const isBooked = bookings?.some(b => b.slot_time === timeStr);
          
          generatedSlots.push({
            time: timeStr,
            endTime: endTimeStr,
            available: !isBooked,
            bookingId: bookings?.find(b => b.slot_time === timeStr)?.id
          });
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
    <div className="w-full rounded-xl overflow-hidden bg-card border border-border shadow-sm">
      {/* Header */}
      <div className="p-4 sm:p-5 pb-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-base">
            {blockTitle || t('booking.title', 'Записаться')}
          </h3>
        </div>
        {blockDescription && (
          <p className="text-sm text-muted-foreground mt-1">{blockDescription}</p>
        )}
        {/* Working hours - compact */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
          <Clock className="h-3 w-3" />
          <span>{getWorkingHours()}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 pt-2 space-y-4">
        {/* Step indicator - compact */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`flex items-center justify-center w-5 h-5 rounded-full font-medium ${
            selectedDate ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <span className={selectedDate ? 'text-foreground' : 'text-muted-foreground'}>
            {t('booking.step1', 'Дата')}
          </span>
          {selectedDate && (
            <>
              <div className="h-px flex-1 bg-border" />
              <div className={`flex items-center justify-center w-5 h-5 rounded-full font-medium ${
                selectedSlot ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <span className={selectedSlot ? 'text-foreground' : 'text-muted-foreground'}>
                {t('booking.step2', 'Время')}
              </span>
            </>
          )}
        </div>

        {/* Calendar - optimized for mobile */}
        <div className="flex justify-center -mx-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={disabledDays}
            locale={locale}
            className="rounded-xl border-0 w-full max-w-[320px]"
            classNames={{
              months: "w-full",
              month: "w-full space-y-2",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              table: "w-full border-collapse",
              head_row: "flex w-full",
              head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.7rem]",
              row: "flex w-full mt-1",
              cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1 aspect-square",
              day: "h-full w-full p-0 font-normal hover:bg-accent rounded-lg transition-colors text-sm flex items-center justify-center",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_disabled: "text-muted-foreground opacity-50",
              day_outside: "text-muted-foreground opacity-50",
            }}
          />
        </div>

        {/* Time slots section - mobile optimized */}
        {selectedDate && (
          <div className="space-y-3">
            {/* Date header with stats */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 min-w-0">
                <CalendarDays className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="font-medium text-sm truncate">{getDateLabel(selectedDate)}</span>
              </div>
              {!loading && totalCount > 0 && (
                <div className="flex items-center gap-2 text-xs flex-shrink-0">
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    {availableCount}
                  </span>
                  {bookedCount > 0 && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="h-3 w-3" />
                      {bookedCount}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">
                  {t('booking.loadingSlots', 'Загружаем...')}
                </span>
              </div>
            ) : slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                <Info className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {t('booking.noSlotsTitle', 'Нет слотов')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t('booking.noSlotsHint', 'Выберите другую дату')}
                  </p>
                </div>
              </div>
            ) : (
              /* Time slots grid - mobile optimized with 3 columns */
              <div className="grid grid-cols-3 gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                {slots.map((slot, idx) => (
                  <button
                    key={idx}
                    disabled={!slot.available}
                    onClick={() => handleSelectSlot(slot)}
                    className={`
                      relative py-2.5 px-1 rounded-lg text-center transition-all
                      ${slot.available 
                        ? selectedSlot?.time === slot.time
                          ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-1'
                          : 'bg-background border border-border hover:border-primary hover:bg-primary/5 active:scale-95'
                        : 'bg-muted/30 opacity-40 cursor-not-allowed'
                      }
                    `}
                  >
                    <span className={`text-sm font-medium ${!slot.available ? 'line-through' : ''}`}>
                      {formatTime(slot.time)}
                    </span>
                    {slot.endTime && (
                      <span className="block text-[9px] text-muted-foreground mt-0.5">
                        – {formatTime(slot.endTime)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Selected slot confirmation - compact */}
            {selectedSlot && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm truncate">
                      <strong>{formatTime(selectedSlot.time)}</strong>
                      {selectedSlot.endTime && ` – ${formatTime(selectedSlot.endTime)}`}
                    </span>
                  </div>
                  <Button size="sm" onClick={() => setShowForm(true)} className="h-8 px-3 text-xs">
                    {t('booking.continue', 'Далее')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend - compact */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pt-1">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded border border-primary/30 bg-background" />
            <span>{t('booking.available', 'Свободно')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-muted opacity-50" />
            <span>{t('booking.booked', 'Занято')}</span>
          </div>
        </div>
      </div>

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
                  ? (getTranslatedString(block.buttonText, i18n.language as SupportedLanguage) || t('booking.confirmAndPay', 'Записаться и оплатить'))
                  : (getTranslatedString(block.buttonText, i18n.language as SupportedLanguage) || t('booking.confirm', 'Записаться'))
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
    </div>
  );
});

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
import Clock from 'lucide-react/dist/esm/icons/clock';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import User from 'lucide-react/dist/esm/icons/user';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Check from 'lucide-react/dist/esm/icons/check';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import XCircle from 'lucide-react/dist/esm/icons/x-circle';
import Info from 'lucide-react/dist/esm/icons/info';
import Copy from 'lucide-react/dist/esm/icons/copy';
import CalendarPlus from 'lucide-react/dist/esm/icons/calendar-plus';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import { supabase } from '@/platform/supabase/client';
import { fintechService } from '@/services/fintech';
import { getCurrencySymbol } from '@/components/form-fields/CurrencySelect';
import { cn } from '@/lib/utils/utils';
import { toast } from 'sonner';
import { format, addDays, isBefore, startOfDay, isToday, isTomorrow } from 'date-fns';
import { ru, kk } from 'date-fns/locale';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
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

interface BookingConfirmation {
  date: string;
  time: string;
  endTime?: string;
  name: string;
  bookingId: string;
  requiresPrepayment: boolean;
  prepaymentAmount?: number;
  prepaymentCurrency?: string;
  prepaymentMethod?: string;
  ownerPhone?: string;
  kaspiPhone?: string;
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
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);
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

      const { data: slotTemplates } = await supabase
        .from('booking_slots')
        .select('*')
        .eq('page_id', pageId)
        .eq('block_id', block.id)
        .eq('is_available', true)
        .or(`day_of_week.eq.${dayOfWeek},specific_date.eq.${dateStr}`);

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('page_id', pageId)
        .eq('block_id', block.id)
        .eq('slot_date', dateStr)
        .neq('status', 'cancelled');

      const generatedSlots: TimeSlot[] = [];

      let gcalBlockedSlots: string[] = [];
      if (block.gcalSyncEnabled && pageOwnerId) {
        try {
          const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
            body: { action: 'check_availability', owner_id: pageOwnerId, date: dateStr }
          });
          if (!error && data?.blocked_slots) gcalBlockedSlots = data.blocked_slots;
        } catch (err) {
          console.error('Failed to sync with Google Calendar:', err);
        }
      }

      if (block.slots && block.slots.length > 0) {
        block.slots.forEach(slot => {
          const isBookedLocally = bookings?.some(b => b.slot_time === slot.startTime);
          const isBookedGcal = gcalBlockedSlots.includes(slot.startTime);
          generatedSlots.push({
            time: slot.startTime,
            endTime: slot.endTime,
            available: !isBookedLocally && !isBookedGcal,
            bookingId: bookings?.find(b => b.slot_time === slot.startTime)?.id
          });
        });
      } else if (slotTemplates && slotTemplates.length > 0) {
        slotTemplates.forEach(template => {
          const isBookedLocally = bookings?.some(b => b.slot_time === template.start_time);
          const isBookedGcal = gcalBlockedSlots.includes(template.start_time);
          generatedSlots.push({
            time: template.start_time,
            endTime: template.end_time,
            available: !isBookedLocally && !isBookedGcal,
            bookingId: bookings?.find(b => b.slot_time === template.start_time)?.id
          });
        });
      } else {
        const startHour = block.workingHoursStart ?? 9;
        const endHour = block.workingHoursEnd ?? 18;
        const duration = block.slotDuration || 60;
        const startMinutes = startHour * 60;
        const endMinutes = endHour * 60;

        for (let slotStart = startMinutes; slotStart + duration <= endMinutes; slotStart += duration) {
          const slotEnd = slotStart + duration;
          const startHr = Math.floor(slotStart / 60);
          const startMin = slotStart % 60;
          const endHr = Math.floor(slotEnd / 60);
          const endMin = slotEnd % 60;

          const timeStr = `${startHr.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}:00`;
          const endTimeStr = `${endHr.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}:00`;

          const isBookedLocally = bookings?.some(b => b.slot_time === timeStr);
          const isBookedGcal = gcalBlockedSlots.includes(timeStr);

          generatedSlots.push({
            time: timeStr,
            endTime: endTimeStr,
            available: !isBookedLocally && !isBookedGcal,
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

      const hasPrepayment = block.requirePrepayment && block.prepaymentAmount && block.prepaymentAmount > 0;
      const paymentStatus = hasPrepayment ? 'pending' : 'none';
      const paymentMethod = hasPrepayment ? (block.prepaymentMethod || 'whatsapp') : null;

      const { data: fnResponse, error: fnError } = await supabase.functions.invoke('submit-booking', {
        body: {
          pageId,
          blockId: block.id,
          slotDate: format(selectedDate, 'yyyy-MM-dd'),
          slotTime: selectedSlot.time,
          slotEndTime: selectedSlot.endTime || null,
          clientName: formData.name,
          clientPhone: formData.phone || null,
          clientEmail: formData.email || null,
          clientNotes: formData.notes || null,
          paymentStatus,
          paymentAmount: hasPrepayment ? block.prepaymentAmount : 0,
          paymentMethod,
          userId: session?.session?.user?.id || null,
        }
      });

      if (fnError) throw fnError;

      // Handle inbound limit reached
      if (fnResponse && !fnResponse.success && fnResponse.error === 'inbound_limit_reached') {
        toast.error(t('booking.limitReached.customer', 'Запись временно недоступна. Свяжитесь напрямую.'));
        setSubmitting(false);
        return;
      }

      if (fnResponse && !fnResponse.success) throw new Error(fnResponse.error);

      const bookingData = fnResponse?.booking;

      // Record in Fintech Ledger
      if (hasPrepayment) {
        try {
          await fintechService.recordPendingIncome({
            userId: pageOwnerId,
            amount: block.prepaymentAmount || 0,
            description: `Бронирование: ${formData.name} (${format(selectedDate, 'dd.MM.yyyy')} ${selectedSlot.time.substring(0, 5)})`,
            relatedEntityId: block.id,
            relatedEntityType: 'booking',
            metadata: {
              client_name: formData.name,
              slot_date: format(selectedDate, 'yyyy-MM-dd'),
              slot_time: selectedSlot.time
            }
          });
        } catch (fintechErr) {
          console.error('Failed to record fintech transaction', fintechErr);
        }
      }

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

      // Google Calendar sync
      if (block.gcalSyncEnabled && pageOwnerId) {
        try {
          await supabase.functions.invoke('google-calendar-sync', {
            body: {
              action: 'create_event',
              owner_id: pageOwnerId,
              date: format(selectedDate, 'yyyy-MM-dd'),
              start_time: selectedSlot.time,
              end_time: selectedSlot.endTime || null,
              client_name: formData.name,
              client_phone: formData.phone || '',
              client_email: formData.email || '',
              client_notes: formData.notes || '',
              block_title: blockTitle
            }
          });
        } catch (err) {
          console.error('Failed to create event in Google Calendar:', err);
        }
      }

      // Show confirmation screen instead of toast
      setConfirmation({
        date: format(selectedDate, 'd MMMM, EEEE', { locale }),
        time: selectedSlot.time.substring(0, 5),
        endTime: selectedSlot.endTime?.substring(0, 5),
        name: formData.name,
        bookingId: bookingData?.id || '',
        requiresPrepayment: !!hasPrepayment,
        prepaymentAmount: block.prepaymentAmount,
        prepaymentCurrency: block.prepaymentCurrency || 'KZT',
        prepaymentMethod: block.prepaymentMethod || 'whatsapp',
        ownerPhone: block.prepaymentPhone,
        kaspiPhone: block.kaspiPhone,
      });

      setShowForm(false);
      setFormData({ name: '', phone: '', email: '', notes: '' });
      fetchSlots(selectedDate);
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(t('booking.error', 'Ошибка при записи. Попробуйте снова.'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (time: string) => time.substring(0, 5);

  const disabledDays = (date: Date) => {
    if (isBefore(startOfDay(date), startOfDay(new Date()))) return true;
    const maxDays = block.maxBookingDays || 30;
    if (isBefore(addDays(new Date(), maxDays), date)) return true;
    if (block.disabledWeekdays?.includes(date.getDay())) return true;
    return false;
  };

  const blockTitle = typeof block.title === 'object'
    ? getI18nText(block.title, i18n.language as SupportedLanguage)
    : block.title;

  const blockDescription = typeof block.description === 'object'
    ? getI18nText(block.description, i18n.language as SupportedLanguage)
    : block.description;

  const availableCount = slots.filter(s => s.available).length;
  const bookedCount = slots.filter(s => !s.available).length;
  const totalCount = slots.length;

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return t('booking.today', 'Сегодня');
    if (isTomorrow(date)) return t('booking.tomorrow', 'Завтра');
    return format(date, 'd MMMM, EEEE', { locale });
  };

  const getWorkingHours = () => {
    const start = block.workingHoursStart || 9;
    const end = block.workingHoursEnd || 18;
    return `${start.toString().padStart(2, '0')}:00 — ${end.toString().padStart(2, '0')}:00`;
  };

  const handleWhatsAppPrepayment = () => {
    if (!block.prepaymentPhone || !confirmation) return;
    const phone = block.prepaymentPhone.replace(/\D/g, '');
    const message = t('booking.whatsapp.greeting', 'Здравствуйте! Я записался(ась) на {{date}} в {{time}}.', { date: confirmation.date, time: confirmation.time })
      + '\n' + t('booking.whatsapp.name', 'Имя: {{name}}', { name: confirmation.name })
      + '\n' + t('booking.whatsapp.prepayment', 'Сумма предоплаты: {{amount}} {{currency}}', { amount: confirmation.prepaymentAmount, currency: getCurrencySymbol(confirmation.prepaymentCurrency || 'KZT') })
      + '\n' + t('booking.whatsapp.pay', 'Хочу оплатить запись.');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleKaspiPrepayment = () => {
    if (!block.kaspiPhone || !confirmation) return;
    const phone = block.kaspiPhone.replace(/\D/g, '');
    const amount = confirmation.prepaymentAmount || 0;
    window.open(`https://kaspi.kz/pay/${phone}?amount=${amount}`, '_blank');
  };

  const handleCopyBookingId = () => {
    if (!confirmation) return;
    navigator.clipboard.writeText(confirmation.bookingId.substring(0, 8).toUpperCase());
    toast.success(t('booking.confirmation.copied', 'Скопировано'));
  };

  // Reset confirmation when user wants to book again
  const handleBookAgain = () => {
    setConfirmation(null);
    setSelectedSlot(null);
    setSelectedDate(undefined);
  };

  // If we have a confirmation, show it
  if (confirmation) {
    return (
      <div className="w-full rounded-2xl overflow-hidden glass-card backdrop-blur-md border-white/10 shadow-glass">
        <div className="p-6 text-center space-y-5">
          {/* Success icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center animate-in zoom-in duration-300">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gradient">
              {t('booking.confirmation.title', 'Вы записаны!')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('booking.confirmation.subtitle', 'Детали вашей записи')}
            </p>
          </div>

          {/* Booking details card */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-left space-y-3">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-bold">{confirmation.date}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-bold">
                {confirmation.time}
                {confirmation.endTime && ` — ${confirmation.endTime}`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm">{confirmation.name}</span>
            </div>
            {/* Booking reference */}
            <div className="flex items-center justify-between pt-2 border-t border-primary/10">
              <span className="text-xs text-muted-foreground">{t('booking.confirmation.ref', 'Номер записи')}</span>
              <button onClick={handleCopyBookingId} className="flex items-center gap-1 text-xs font-mono font-bold text-primary hover:underline">
                {confirmation.bookingId.substring(0, 8).toUpperCase()}
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Prepayment section */}
          {confirmation.requiresPrepayment && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-bold text-amber-700">
                    {t('booking.confirmation.prepaymentRequired', 'Предоплата для подтверждения')}
                  </span>
                </div>
                <p className="text-lg font-black text-amber-700">
                  {confirmation.prepaymentAmount} {getCurrencySymbol(confirmation.prepaymentCurrency || 'KZT')}
                </p>
                <p className="text-xs text-amber-600/70 mt-1">
                  {t('booking.confirmation.prepaymentHint', 'Оплатите для гарантии записи. Возвращается при отмене за 24ч.')}
                </p>
              </div>

              {/* Payment buttons */}
              <div className="space-y-2">
                {(confirmation.prepaymentMethod === 'whatsapp' || !confirmation.prepaymentMethod) && confirmation.ownerPhone && (
                  <Button
                    onClick={handleWhatsAppPrepayment}
                    className="w-full h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25"
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    {t('booking.confirmation.payWhatsApp', 'Оплатить через WhatsApp')}
                  </Button>
                )}
                {(confirmation.prepaymentMethod === 'kaspi' || (confirmation.kaspiPhone && confirmation.prepaymentMethod !== 'robokassa')) && confirmation.kaspiPhone && (
                  <Button
                    onClick={handleKaspiPrepayment}
                    variant="outline"
                    className="w-full h-12 rounded-xl font-bold border-red-500/30 text-red-600 hover:bg-red-500/5"
                  >
                    <Wallet className="h-5 w-5 mr-2" />
                    {t('booking.confirmation.payKaspi', 'Оплатить через Kaspi')}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Non-prepayment confirmation */}
          {!confirmation.requiresPrepayment && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm text-emerald-700 font-medium">
                {t('booking.confirmation.awaitConfirm', 'Ожидайте подтверждения от специалиста')}
              </p>
            </div>
          )}

          {/* Book again button */}
          <Button
            variant="ghost"
            onClick={handleBookAgain}
            className="w-full h-10 rounded-xl text-sm font-medium"
          >
            {t('booking.confirmation.bookAgain', 'Записаться ещё раз')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden glass-card backdrop-blur-md border-white/10 shadow-glass">
      {/* Header */}
      <div className="p-5 sm:p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-sm shadow-primary/20">
            <CalendarDays className="h-5 w-5" />
          </div>
          <h3 className="font-bold text-lg text-gradient">
            {blockTitle || t('booking.title', 'Записаться')}
          </h3>
        </div>
        {blockDescription && (
          <p className="text-sm text-muted-foreground/80 mt-2 line-clamp-2">{blockDescription}</p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/5 w-fit px-2 py-1 rounded-lg">
            <Clock className="h-3 w-3" />
            <span>{getWorkingHours()}</span>
          </div>
          {/* Price badge visible upfront */}
          {block.requirePrepayment && block.prepaymentAmount && block.prepaymentAmount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-500/10 w-fit px-2.5 py-1 rounded-lg border border-amber-500/20">
              <Wallet className="h-3 w-3" />
              <span>{t('booking.prepaymentBadge', 'Предоплата {{amount}} {{currency}}', {
                amount: block.prepaymentAmount,
                currency: getCurrencySymbol(block.prepaymentCurrency || 'KZT')
              })}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-6 pt-2 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          <div className={cn(
            "flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300",
            selectedDate ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-primary/5 text-primary/50"
          )}>
            1
          </div>
          <span className={selectedDate ? 'text-foreground' : 'text-muted-foreground'}>
            {t('booking.step1', 'Дата')}
          </span>
          {selectedDate && (
            <>
              <div className="h-0.5 flex-1 bg-primary/10 rounded-full mx-1" />
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300",
                selectedSlot ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-primary/5 text-primary/50"
              )}>
                2
              </div>
              <span className={selectedSlot ? 'text-foreground' : 'text-muted-foreground'}>
                {t('booking.step2', 'Время')}
              </span>
            </>
          )}
        </div>

        {/* Calendar */}
        <div className="flex justify-center -mx-2 bg-primary/5 rounded-2xl p-2 border border-white/5">
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
              caption: "flex justify-center pt-1 relative items-center mb-2",
              caption_label: "text-sm font-bold text-gradient",
              nav: "space-x-1 flex items-center",
              nav_button: "h-8 w-8 bg-white/5 p-0 opacity-50 hover:opacity-100 rounded-lg hover:bg-white/10 transition-colors",
              table: "w-full border-collapse",
              head_row: "flex w-full",
              head_cell: "text-primary/60 rounded-md w-full font-bold text-[0.7rem] uppercase tracking-wider",
              row: "flex w-full mt-1",
              cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1 aspect-square",
              day: "h-full w-full p-0 font-medium hover:bg-primary/10 rounded-xl transition-all text-sm flex items-center justify-center",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-lg shadow-primary/30 scale-110 z-10",
              day_today: "bg-primary/10 text-primary font-bold",
              day_disabled: "text-muted-foreground/30 opacity-50",
              day_outside: "text-muted-foreground/20 opacity-50",
            }}
          />
        </div>

        {/* Time slots section */}
        {selectedDate && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <CalendarDays className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm truncate">{getDateLabel(selectedDate)}</span>
              </div>
              {!loading && totalCount > 0 && (
                <div className="flex items-center gap-2.5 text-xs font-bold px-2 py-1 rounded-lg bg-black/20">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    {availableCount}
                  </span>
                  {bookedCount > 0 && (
                    <span className="flex items-center gap-1 text-white/40">
                      <XCircle className="h-3 w-3" />
                      {bookedCount}
                    </span>
                  )}
                </div>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs font-medium text-muted-foreground animate-pulse">
                  {t('booking.loadingSlots', 'Загружаем...')}
                </span>
              </div>
            ) : slots.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                <div className="p-3 rounded-full bg-white/5 text-muted-foreground/50">
                  <Info className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-bold">{t('booking.noSlotsTitle', 'Нет доступных окон')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('booking.noSlotsHint', 'Попробуйте выбрать другую дату')}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {slots.map((slot, idx) => (
                  <button
                    key={idx}
                    disabled={!slot.available}
                    onClick={() => handleSelectSlot(slot)}
                    className={cn(
                      "relative py-3 px-1 rounded-xl text-center transition-all duration-300",
                      slot.available
                        ? selectedSlot?.time === slot.time
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40 scale-105 z-10 border-transparent font-bold"
                          : "glass-card hover:border-primary/50 hover:bg-primary/5 active:scale-95 border-white/10"
                        : "bg-white/5 opacity-20 cursor-not-allowed border-transparent"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-bold tracking-tight",
                      !slot.available && 'line-through opacity-50'
                    )}>
                      {formatTime(slot.time)}
                    </span>
                    {slot.endTime && (
                      <span className="block text-[10px] opacity-40 mt-1 font-medium">
                        – {formatTime(slot.endTime)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Selected slot confirmation with price */}
            {selectedSlot && (
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-md">
                      <Check className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider">{t('booking.selectedTime', 'Выбрано время')}</p>
                      <p className="text-sm font-bold truncate">
                        {formatTime(selectedSlot.time)}
                        {selectedSlot.endTime && ` – ${formatTime(selectedSlot.endTime)}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setShowForm(true)}
                    className="h-10 px-5 text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                  >
                    {t('booking.continue', 'Далее')}
                  </Button>
                </div>
                {/* Inline prepayment info */}
                {block.requirePrepayment && block.prepaymentAmount && block.prepaymentAmount > 0 && (
                  <p className="text-xs text-primary/70 mt-2 flex items-center gap-1.5">
                    <Wallet className="h-3 w-3" />
                    {t('booking.slotPrepaymentHint', 'Предоплата {{amount}} {{currency}} · гарантирует бронь', {
                      amount: block.prepaymentAmount,
                      currency: getCurrencySymbol(block.prepaymentCurrency || 'KZT')
                    })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 py-4 px-6 bg-black/5 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full border border-primary/40 bg-white/5" />
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t('booking.available', 'Свободно')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">{t('booking.booked', 'Занято')}</span>
        </div>
      </div>

      {/* Booking Form Dialog — Reduced friction */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md glass-card backdrop-blur-xl border-white/10 shadow-2xl p-0 overflow-hidden">
          <div className="p-6 pb-4 border-b border-white/5">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gradient">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                {t('booking.confirmBooking', 'Оформление записи')}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="mt-4">
                  {selectedDate && selectedSlot && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner">
                      <div className="flex items-center gap-2 min-w-0">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold truncate">
                          {format(selectedDate, 'd MMMM, EEEE', { locale })}
                        </span>
                      </div>
                      <div className="w-px h-4 bg-primary/20" />
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold">
                          {formatTime(selectedSlot.time)}
                          {selectedSlot.endTime && ` — ${formatTime(selectedSlot.endTime)}`}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Prepayment callout in form */}
                  {block.requirePrepayment && block.prepaymentAmount && block.prepaymentAmount > 0 && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold text-amber-700">
                        {t('booking.formPrepaymentNote', 'Предоплата {{amount}} {{currency}} после записи', {
                          amount: block.prepaymentAmount,
                          currency: getCurrencySymbol(block.prepaymentCurrency || 'KZT')
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Required fields: Name + Phone */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider ml-1">
                <User className="h-3.5 w-3.5" />
                {t('booking.name', 'Ваше имя')} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder={t('booking.namePlaceholder', 'Введите имя')}
                className="h-12 rounded-xl glass-input border-white/5 focus:border-primary/50 transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider ml-1">
                <Phone className="h-3.5 w-3.5" />
                {t('booking.phone', 'Телефон')} *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+7 (___) ___-__-__"
                required
                className="h-12 rounded-xl glass-input border-white/5 focus:border-primary/50 transition-all font-medium"
              />
            </div>

            {/* Optional fields — collapsed by default */}
            {!showOptionalFields ? (
              <button
                type="button"
                onClick={() => setShowOptionalFields(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                <ChevronDown className="h-3.5 w-3.5" />
                {t('booking.addDetails', 'Добавить email или комментарий')}
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider ml-1">
                    <Mail className="h-3.5 w-3.5" />
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
                    className="h-12 rounded-xl glass-input border-white/5 focus:border-primary/50 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                    {t('booking.notes', 'Комментарий')}
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder={t('booking.notesPlaceholder', 'Дополнительная информация...')}
                    rows={2}
                    className="rounded-xl glass-input border-white/5 focus:border-primary/50 transition-all font-medium resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowForm(false)}
                className="flex-1 h-12 rounded-xl font-bold hover:bg-white/5"
              >
                {t('common.cancel', 'Отмена')}
              </Button>
              <Button type="submit" disabled={submitting} className="flex-[2] h-12 rounded-xl font-bold shadow-lg shadow-primary/30 hover:scale-[1.02] transition-transform">
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Check className="h-5 w-5 mr-2" />
                )}
                {block.requirePrepayment
                  ? (getI18nText(block.buttonText, i18n.language as SupportedLanguage) || t('booking.confirmAndPay', 'Записаться и оплатить'))
                  : (getI18nText(block.buttonText, i18n.language as SupportedLanguage) || t('booking.confirm', 'Записаться'))
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
});

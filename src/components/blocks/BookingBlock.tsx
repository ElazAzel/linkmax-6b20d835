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
import { useTimezone } from '@/hooks/useTimezone';
import { format, addDays, isBefore, startOfDay, isToday, isTomorrow } from 'date-fns';
import { fromZonedTime, toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { ru, kk } from 'date-fns/locale';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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
  const { userTimezone, getFriendlyTZName } = useTimezone();
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

      let gcalBlockedSlots: { start: string, end: string }[] = [];
      const tz = block.timezone || userTimezone || 'UTC';
      if (block.gcalSyncEnabled && pageOwnerId) {
        try {
          // Send ISO strings for full day in block.timezone or userTimezone
          const timeMin = fromZonedTime(`${dateStr}T00:00:00`, tz).toISOString();
          const timeMax = fromZonedTime(`${dateStr}T23:59:59`, tz).toISOString();

          const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
            body: {
              action: 'check_availability',
              owner_id: pageOwnerId,
              time_min: timeMin,
              time_max: timeMax
            }
          });
          if (!error && data?.blocked_slots) {
            gcalBlockedSlots = data.blocked_slots;
          }
        } catch (err) {
          console.error('Failed to sync with Google Calendar:', err);
          // Don't toast here to avoid annoying visitor, but log it
        }
      }

      const checkGcalConflict = (timeStr: string, endTimeStr?: string) => {
        if (!gcalBlockedSlots.length) return false;

        let endTStr = endTimeStr;
        if (!endTStr) {
          // Add default duration if no end time
          const durationMins = block.slotDuration || 60;
          const [h, m] = timeStr.split(':').map(Number);
          const endTotalMins = h * 60 + m + durationMins;
          const endH = Math.floor(endTotalMins / 60) % 24;
          const endM = endTotalMins % 60;
          endTStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}:00`;
        }

        const start = fromZonedTime(`${dateStr}T${timeStr}`, tz).getTime();
        const end = fromZonedTime(`${dateStr}T${endTStr}`, tz).getTime();

        return gcalBlockedSlots.some(busy => {
          const busyStart = new Date(busy.start).getTime();
          const busyEnd = new Date(busy.end).getTime();
          return start < busyEnd && end > busyStart; // Overlap check
        });
      };

      if (block.slots && block.slots.length > 0) {
        block.slots.forEach(slot => {
          const isBookedLocally = bookings?.some(b => b.slot_time === slot.startTime);
          const isBookedGcal = checkGcalConflict(slot.startTime, slot.endTime);
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
          const isBookedGcal = checkGcalConflict(template.start_time, template.end_time ?? undefined);
          generatedSlots.push({
            time: template.start_time,
            endTime: template.end_time ?? undefined,
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
          const isBookedGcal = checkGcalConflict(timeStr, endTimeStr);

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

      // Note: Auto-push is now handled on the server via submit-booking edge function
      // to ensure atomicity and reliability. Client-side push is removed to avoid duplicates.

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

      // Trigger WOW effect
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#ffffff']
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
      <AnimatePresence mode="wait">
        <motion.div 
          key="confirmation"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05 }}
          className="w-full rounded-2xl overflow-hidden glass-card backdrop-blur-md border-white/10 shadow-glass"
        >
          <div className="p-6 text-center space-y-5 relative overflow-hidden">
            {/* Background glow Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-emerald-500/20 blur-[80px] -z-10 rounded-full" />
            
            {/* Success icon */}
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.2 }}
              className="mx-auto w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner"
            >
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            </motion.div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-gradient tracking-tight">
                {t('booking.confirmation.title', 'Вы записаны!')}
              </h3>
              <p className="text-sm font-medium text-muted-foreground/80">
                {t('booking.confirmation.subtitle', 'Детали вашей записи')}
              </p>
            </div>

            {/* Booking details card */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-5 rounded-3xl bg-emerald-500/[0.03] border border-emerald-500/10 text-left space-y-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('booking.step1', 'Дата')}</span>
                  <span className="text-sm font-bold">{confirmation.date}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('booking.step2', 'Время')}</span>
                  <span className="text-sm font-bold">
                    {confirmation.time}
                    {confirmation.endTime && ` — ${confirmation.endTime}`}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{t('booking.name', 'Клиент')}</span>
                   <span className="text-sm font-bold">{confirmation.name}</span>
                </div>
              </div>

              {/* Booking reference */}
              <div className="flex items-center justify-between pt-4 border-t border-emerald-500/10">
                <span className="text-xs text-muted-foreground font-medium">{t('booking.confirmation.ref', 'Код подтверждения')}</span>
                <button onClick={handleCopyBookingId} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 text-xs font-mono font-black text-primary hover:bg-primary/10 transition-colors border border-primary/10">
                  {confirmation.bookingId.substring(0, 8).toUpperCase()}
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            </motion.div>

            {/* Prepayment section */}
            {confirmation.requiresPrepayment && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-3xl bg-amber-500/[0.07] border border-amber-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Wallet className="h-12 w-12 text-amber-600 rotate-12" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-amber-500/20">
                      <Wallet className="h-4 w-4 text-amber-700" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-tight text-amber-800">
                      {t('booking.confirmation.prepaymentRequired', 'Требуется предоплата')}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-amber-900 tracking-tighter">
                       {confirmation.prepaymentAmount}
                    </span>
                    <span className="text-lg font-bold text-amber-800/70">
                       {getCurrencySymbol(confirmation.prepaymentCurrency || 'KZT')}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800/60 mt-2 font-medium leading-tight">
                    {t('booking.confirmation.prepaymentHint', 'Пожалуйста, внесите предоплату для подтверждения записи.')}
                  </p>
                </div>

                {/* Payment buttons */}
                <div className="space-y-2">
                  {(confirmation.prepaymentMethod === 'whatsapp' || !confirmation.prepaymentMethod) && confirmation.ownerPhone && (
                    <Button
                      onClick={handleWhatsAppPrepayment}
                      className="w-full h-14 rounded-2xl font-black text-base bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/30 hover:scale-[1.02] active:scale-95 transition-all text-white border-0"
                    >
                      <MessageCircle className="h-6 w-6 mr-3" />
                      {t('booking.confirmation.payWhatsApp', 'Оплатить через WhatsApp')}
                    </Button>
                  )}
                  {(confirmation.prepaymentMethod === 'kaspi' || (confirmation.kaspiPhone && confirmation.prepaymentMethod !== 'robokassa')) && confirmation.kaspiPhone && (
                    <Button
                      onClick={handleKaspiPrepayment}
                      variant="outline"
                      className="w-full h-14 rounded-2xl font-black text-base border-red-500/20 text-red-600 hover:bg-red-500/5 hover:border-red-500/40 hover:scale-[1.02] active:scale-95 transition-all bg-white/40"
                    >
                      <Wallet className="h-6 w-6 mr-3" />
                      {t('booking.confirmation.payKaspi', 'Оплатить через Kaspi')}
                    </Button>
                  )}
                </div>
              </motion.div>
            )}

            {/* Non-prepayment confirmation */}
            {!confirmation.requiresPrepayment && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center gap-3"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm text-emerald-800 font-bold">
                  {t('booking.confirmation.awaitConfirm', 'Ожидайте подтверждения специалистом')}
                </p>
              </motion.div>
            )}

            {/* Book again button */}
            <Button
              variant="ghost"
              onClick={handleBookAgain}
              className="w-full h-12 rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all"
            >
              {t('booking.confirmation.bookAgain', 'Записаться ещё раз')}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
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
          {block.requirePrepayment && block.prepaymentAmount && block.prepaymentAmount > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-500/10 w-fit px-2.5 py-1 rounded-lg border border-amber-500/20">
              <Wallet className="h-3 w-3" />
              <span>{t('booking.prepaymentBadge', 'Предоплата {{amount}} {{currency}}', {
                amount: block.prepaymentAmount,
                currency: getCurrencySymbol(block.prepaymentCurrency || 'KZT')
              })}</span>
            </div>
          )}
          {block.timezone && (
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-tighter font-bold text-muted-foreground bg-muted/20 w-fit px-2 py-0.5 rounded-full border border-border/50">
              {getFriendlyTZName(block.timezone)}
            </div>
          )}
          {userTimezone && userTimezone !== block.timezone && (
             <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-tighter font-bold text-primary bg-primary/5 w-fit px-2 py-0.5 rounded-full border border-primary/20">
               {t('booking.yourTimezone', 'Ваш пояс')}: {getFriendlyTZName(userTimezone)}
             </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={selectedDate ? 'date-selected' : 'calendars'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className="p-5 sm:p-6 pt-2 space-y-6"
        >
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className={cn(
              "flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300",
              selectedDate ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-primary/5 text-primary/50"
            )}>
              1
            </div>
            <span className={selectedDate ? 'text-foreground font-black' : 'text-muted-foreground'}>
              {t('booking.step1', 'Дата')}
            </span>
            {selectedDate && (
              <>
                <motion.div initial={{ width: 0 }} animate={{ width: "auto" }} className="h-0.5 flex-1 bg-primary/10 rounded-full mx-1" />
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300",
                  selectedSlot ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-primary/5 text-primary/50"
                )}>
                  2
                </div>
                <span className={selectedSlot ? 'text-foreground font-black' : 'text-muted-foreground'}>
                  {t('booking.step2', 'Время')}
                </span>
              </>
            )}
          </div>

          {/* Calendar */}
          <div className="flex justify-center -mx-2 bg-primary/5 rounded-3xl p-3 border border-white/5 shadow-inner">
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
                caption_label: "text-sm font-black text-gradient uppercase tracking-widest",
                nav: "space-x-1 flex items-center",
                nav_button: "h-9 w-9 bg-white/10 p-0 opacity-50 hover:opacity-100 rounded-xl hover:bg-white/20 transition-all active:scale-95",
                table: "w-full border-collapse",
                head_row: "flex w-full mb-2",
                head_cell: "text-primary/70 rounded-md w-full font-black text-[0.65rem] uppercase tracking-widest",
                row: "flex w-full mt-1.5",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1 aspect-square",
                day: "h-full w-full p-0 font-bold hover:bg-primary/20 rounded-2xl transition-all text-sm flex items-center justify-center",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-xl shadow-primary/40 scale-110 z-10 border-0",
                day_today: "bg-primary/10 text-primary font-black border border-primary/20",
                day_disabled: "text-muted-foreground/30 opacity-30 select-none",
                day_outside: "text-muted-foreground/10 opacity-30 invisible",
              }}
            />
          </div>

          {/* Time slots section */}
          {selectedDate && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-sm truncate">{getDateLabel(selectedDate)}</span>
                </div>
                {!loading && totalCount > 0 && (
                  <div className="flex items-center gap-2.5 text-[10px] font-black px-2.5 py-1.5 rounded-xl bg-black/20 uppercase tracking-tight">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {availableCount}
                    </span>
                    {bookedCount > 0 && (
                      <span className="flex items-center gap-1 text-white/40">
                        {bookedCount}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-14 gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                    <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
                  </div>
                  <span className="text-xs font-black text-muted-foreground/60 animate-pulse tracking-widest uppercase">
                    {t('booking.loadingSlots', 'Синхронизация...')}
                  </span>
                </div>
              ) : slots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <div className="p-4 rounded-full bg-white/5 text-muted-foreground/30 shadow-inner">
                    <Info className="h-10 w-10" />
                  </div>
                  <div>
                    <p className="text-sm font-black tracking-tight">{t('booking.noSlotsTitle', 'Окон нет')}</p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{t('booking.noSlotsHint', 'Попробуйте другую дату')}</p>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial="hidden"
                  animate="show"
                  variants={{
                    show: { transition: { staggerChildren: 0.03 } }
                  }}
                  className="grid grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto pr-3 custom-scrollbar p-1"
                >
                  {slots.map((slot, idx) => (
                    <motion.button
                      key={idx}
                      variants={{
                        hidden: { opacity: 0, scale: 0.9 },
                        show: { opacity: 1, scale: 1 }
                      }}
                      disabled={!slot.available}
                      onClick={() => handleSelectSlot(slot)}
                      className={cn(
                        "relative py-3.5 px-1 rounded-2xl text-center transition-all duration-300 border",
                        slot.available
                          ? selectedSlot?.time === slot.time
                            ? "bg-primary text-primary-foreground shadow-xl shadow-primary/40 scale-105 z-10 border-transparent font-black ring-2 ring-primary/20"
                            : "glass-card hover:border-primary/40 hover:bg-primary/5 active:scale-95 border-white/5 font-bold"
                          : "bg-white/5 opacity-10 cursor-not-allowed border-transparent grayscale"
                      )}
                    >
                      <span className={cn(
                        "text-sm tracking-tight",
                        !slot.available && 'line-through'
                      )}>
                        {formatTime(slot.time)}
                      </span>
                      {slot.endTime && (
                        <span className="block text-[10px] opacity-40 mt-0.5 font-bold">
                          {formatTime(slot.endTime)}
                        </span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}

              {/* Selected slot confirmation with price */}
              <AnimatePresence>
                {selectedSlot && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-3xl bg-primary/10 border border-primary/20 shadow-xl shadow-primary/10"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30 shrink-0">
                          <Check className="h-7 w-7" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1.5">{t('booking.selectedTime', 'Выбрано')}</p>
                          <p className="text-base font-black truncate leading-none">
                            {formatTime(selectedSlot.time)}
                            {selectedSlot.endTime && ` — ${formatTime(selectedSlot.endTime)}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setShowForm(true)}
                        className="h-12 px-6 text-sm font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-white"
                      >
                        {t('booking.continue', 'Далее')}
                      </Button>
                    </div>
                    {/* Inline prepayment info */}
                    {block.requirePrepayment && block.prepaymentAmount && block.prepaymentAmount > 0 && (
                      <div className="mt-3.5 pt-3 border-t border-primary/10 flex items-center gap-2">
                        <div className="p-1 rounded bg-amber-500/20">
                           <Wallet className="h-3 w-3 text-amber-700" />
                        </div>
                        <p className="text-[10px] text-primary/70 font-bold uppercase tracking-tight">
                          {t('booking.slotPrepaymentHint', 'Предоплата {{amount}} {{currency}} · Гарантия брони', {
                            amount: block.prepaymentAmount,
                            currency: getCurrencySymbol(block.prepaymentCurrency || 'KZT')
                          })}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 py-4 px-6 bg-black/5 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full border border-primary/40 bg-white/5" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('booking.available', 'Свободно')}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">{t('booking.booked', 'Занято')}</span>
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
    </div >
  );
});

import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import type { AppDatabase } from '@/platform/supabase/extended-types';
import { getI18nText } from '@/lib/i18n-helpers';

type BookingRow = AppDatabase['public']['Tables']['bookings']['Row'];
export type OfficeBooking = Pick<BookingRow,
  'id' | 'page_id' | 'owner_id' | 'block_id' | 'client_name' | 'client_email' |
  'client_phone' | 'client_notes' | 'user_id' | 'client_identity_hash' | 'slot_date' |
  'slot_time' | 'slot_end_time' | 'booking_timezone' | 'status' | 'version' |
  'payment_status' | 'paid_amount' | 'refunded_amount' | 'total_price_amount' |
  'service_snapshot' | 'created_at'>;

export interface OfficeClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bookings: OfficeBooking[];
  completedCount: number;
  pendingPaymentCount: number;
}

export function getBookingInstant(booking: OfficeBooking): Date {
  try {
    return fromZonedTime(`${booking.slot_date}T${booking.slot_time}`, booking.booking_timezone);
  } catch {
    return new Date(NaN);
  }
}

export function getBookingEndInstant(booking: OfficeBooking): Date {
  const start = getBookingInstant(booking);
  if (booking.slot_end_time) {
    try {
      let day = booking.slot_date;
      if (booking.slot_end_time <= booking.slot_time) {
        const nextDay = new Date(`${day}T00:00:00Z`);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        day = nextDay.toISOString().slice(0, 10);
      }
      return fromZonedTime(`${day}T${booking.slot_end_time}`, booking.booking_timezone);
    } catch {
      return new Date(NaN);
    }
  }
  const snapshot = booking.service_snapshot;
  const duration = snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)
    ? snapshot.durationMinutes : null;
  return typeof duration === 'number' && duration > 0
    ? new Date(start.getTime() + duration * 60_000) : new Date(NaN);
}

export function bookingDay(booking: OfficeBooking, timezone: string): string | null {
  try {
    return formatInTimeZone(getBookingInstant(booking), timezone, 'yyyy-MM-dd');
  } catch {
    return null;
  }
}

export function bookingName(booking: OfficeBooking, language: string): string {
  const snapshot = booking.service_snapshot;
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return '';
  const name = snapshot.name;
  if (typeof name === 'string') return name;
  if (!name || typeof name !== 'object' || Array.isArray(name)) return '';
  const translations = Object.fromEntries(Object.entries(name)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  return getI18nText(translations, language.split('-')[0]);
}

export function buildOfficeToday(bookings: OfficeBooking[], now: Date, timezone: string) {
  const today = formatInTimeZone(now, timezone, 'yyyy-MM-dd');
  const byTime = (a: OfficeBooking, b: OfficeBooking) =>
    getBookingInstant(a).getTime() - getBookingInstant(b).getTime() || a.id.localeCompare(b.id);
  const active = bookings.filter((item) => item.status !== 'cancelled' && item.status !== 'no_show');
  return {
    today: active.filter((item) => bookingDay(item, timezone) === today).sort(byTime),
    pendingPayments: bookings.filter((item) => item.status === 'pending_payment').sort(byTime),
    needsCompletion: bookings.filter((item) => item.status === 'confirmed' &&
      getBookingEndInstant(item).getTime() <= now.getTime()).sort(byTime),
    unscheduled: active.filter((item) => !Number.isFinite(getBookingInstant(item).getTime())),
  };
}

/** Exact contact identity only; same names and family phone numbers are not enough. */
export function buildOfficeClients(bookings: OfficeBooking[]): OfficeClient[] {
  const clients = new Map<string, OfficeClient>();
  const newestFirst = [...bookings].sort((a, b) => b.created_at.localeCompare(a.created_at));
  for (const booking of newestFirst) {
    const email = booking.client_email?.trim().toLowerCase() || null;
    const phone = booking.client_phone?.trim() || null;
    const normalizedPhone = phone?.replace(/\D/g, '') || '';
    const identity = email ? `email:${email}` : booking.user_id ? `user:${booking.user_id}`
      : normalizedPhone.length >= 7 ? `phone:${normalizedPhone}`
      : booking.client_identity_hash ? `hash:${booking.client_identity_hash}` : `booking:${booking.id}`;
    const id = `${booking.owner_id}:${identity}`;
    const client = clients.get(id) ?? {
      id, name: booking.client_name, email, phone, bookings: [], completedCount: 0, pendingPaymentCount: 0,
    };
    client.bookings.push(booking);
    if (booking.status === 'completed') client.completedCount++;
    if (booking.status === 'pending_payment') client.pendingPaymentCount++;
    clients.set(id, client);
  }
  return Array.from(clients.values()).sort((a, b) => a.name.localeCompare(b.name));
}

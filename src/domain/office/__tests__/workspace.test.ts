import { describe, expect, it } from 'vitest';
import { buildOfficeClients, buildOfficeToday, getBookingInstant, type OfficeBooking } from '../workspace';

const booking = (updates: Partial<OfficeBooking> = {}): OfficeBooking => ({
  id: 'booking-1', page_id: 'page-1', owner_id: 'owner-1', block_id: 'block-1',
  client_name: 'Алия', client_email: 'aliya@example.com', client_phone: null,
  client_notes: null, user_id: null, client_identity_hash: null,
  slot_date: '2026-09-30', slot_time: '10:00:00', slot_end_time: '11:00:00',
  booking_timezone: 'Asia/Almaty', status: 'confirmed', version: 1,
  payment_status: 'paid', paid_amount: 5000, refunded_amount: 0,
  total_price_amount: 5000, service_snapshot: { name: 'Урок', currency: 'KZT' },
  created_at: '2026-09-29T08:00:00Z', ...updates,
});

describe('digital office workspace', () => {
  it('converts a booking using its own timezone, independent of the browser', () => {
    expect(getBookingInstant(booking()).toISOString()).toBe('2026-09-30T05:00:00.000Z');
    expect(getBookingInstant(booking({ booking_timezone: 'America/New_York' })).toISOString())
      .toBe('2026-09-30T14:00:00.000Z');
  });

  it('does not complete an appointment until its end and excludes cancelled appointments', () => {
    const now = new Date('2026-09-30T05:30:00Z');
    const result = buildOfficeToday([
      booking(),
      booking({ id: 'older', slot_time: '08:00:00', slot_end_time: '09:00:00' }),
      booking({ id: 'cancelled', status: 'cancelled' }),
      booking({ id: 'awaiting', status: 'pending_payment', slot_time: '10:30:00', slot_end_time: '11:30:00' }),
    ], now, 'Asia/Almaty');
    expect(result.today.map((item) => item.id)).toEqual(['older', 'booking-1', 'awaiting']);
    expect(result.needsCompletion.map((item) => item.id)).toEqual(['older']);
    expect(result.pendingPayments.map((item) => item.id)).toEqual(['awaiting']);
  });

  it('uses the viewer timezone to put appointments on the correct calendar day', () => {
    const row = booking({ slot_time: '00:30:00', slot_end_time: '01:30:00' });
    const result = buildOfficeToday([row], new Date('2026-09-29T20:00:00Z'), 'UTC');
    expect(result.today).toHaveLength(1);
  });

  it('groups recurring clients across pages by normalized contact, never by name', () => {
    const rows = [booking(), booking({ id: 'second', page_id: 'page-2', client_email: ' ALIYA@example.com ' }),
      booking({ id: 'different', client_email: 'another@example.com' }),
      booking({ id: 'anonymous', client_email: null }), booking({ id: 'anonymous-2', client_email: null })];
    const clients = buildOfficeClients(rows);
    expect(clients).toHaveLength(4);
    expect(clients.find((client) => client.email === 'aliya@example.com')?.bookings).toHaveLength(2);
  });

  it('never merges different owners or conflicting email addresses using a shared phone', () => {
    expect(buildOfficeClients([booking(), booking({ id: 'other-owner', owner_id: 'owner-2' })])).toHaveLength(2);
    expect(buildOfficeClients([
      booking({ client_phone: '+7 700 000 00 00' }),
      booking({ id: 'other-email', client_email: 'other@example.com', client_phone: '+77000000000' }),
    ])).toHaveLength(2);
  });

  it('keeps unknown timezone data out of automatic attention decisions', () => {
    const result = buildOfficeToday([booking({ booking_timezone: 'invalid/timezone' })], new Date(), 'UTC');
    expect(result.today).toHaveLength(0);
    expect(result.needsCompletion).toHaveLength(0);
    expect(result.unscheduled).toHaveLength(1);
  });
});

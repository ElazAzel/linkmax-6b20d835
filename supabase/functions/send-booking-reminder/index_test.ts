import {
  bookingReminderIdempotencyKey,
  reminderScheduledAt,
} from './contracts.ts';

function assertEquals(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) throw new Error(`${message}: ${actual} !== ${expected}`);
}

Deno.test('same 24-hour reminder window produces one stable queue idempotency key', () => {
  const first = bookingReminderIdempotencyKey('booking-1', 'email', '2026-08-31T05:00:00.000Z');
  const second = bookingReminderIdempotencyKey('booking-1', 'email', '2026-08-31T05:00:00.000Z');
  assertEquals(first, second, 'reminder key changed');
  assertEquals(first, 'booking:booking-1:reminder_24h:email:2026-08-31T05:00:00.000Z', 'unexpected reminder key');
});

Deno.test('24-hour schedule is calculated from the booking timezone', () => {
  assertEquals(
    reminderScheduledAt('2026-09-01', '10:00:00', 'Asia/Almaty'),
    '2026-08-31T05:00:00.000Z',
    'Asia/Almaty reminder instant is wrong',
  );
  assertEquals(
    reminderScheduledAt('2026-09-01', '10:00:00', 'Europe/Berlin'),
    '2026-08-31T08:00:00.000Z',
    'Europe/Berlin reminder instant is wrong',
  );
});

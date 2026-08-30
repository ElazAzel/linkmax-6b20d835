import {
  buildBookingNotificationRows,
  safeNotificationMetadata,
} from './contracts.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test('booking notification contract uses stable role/channel/template fields without raw contacts', () => {
  const rows = buildBookingNotificationRows({
    bookingId: 'booking-1',
    ownerId: 'owner-1',
    locale: 'ru',
    variables: {
      client_name: 'Алия',
      service_name: 'Маникюр',
      slot_date: '2026-09-01',
      slot_time: '10:00',
      timezone: 'Asia/Almaty',
    },
    ownerTelegramCiphertext: 'cipher-owner',
    customerEmailCiphertext: 'cipher-customer',
    reminderScheduledAt: '2026-08-31T05:00:00.000Z',
  });

  assert(rows.length === 3, 'expected owner, customer, and reminder rows');
  for (const row of rows) {
    const metadata = safeNotificationMetadata(row.payload);
    assert(metadata.booking_id === 'booking-1', 'booking id missing');
    assert(['owner', 'customer'].includes(metadata.recipient_role), 'recipient role missing');
    assert(['telegram', 'email'].includes(metadata.channel), 'channel missing');
    assert(metadata.template_key.length > 0, 'template key missing');
    assert(metadata.locale === 'ru', 'locale missing');
    const serialized = JSON.stringify(metadata);
    assert(!serialized.includes('+77000000000'), 'phone leaked to telemetry metadata');
    assert(!serialized.includes('aliya@example.com'), 'email leaked to telemetry metadata');
    assert(!serialized.includes('raw-management-token'), 'token leaked to telemetry metadata');
  }
});

Deno.test('notification idempotency keys are stable per booking, role, channel and template', () => {
  const input = {
    bookingId: 'booking-1',
    ownerId: 'owner-1',
    locale: 'ru',
    variables: {
      client_name: 'Алия', service_name: 'Маникюр', slot_date: '2026-09-01',
      slot_time: '10:00', timezone: 'Asia/Almaty',
    },
    ownerTelegramCiphertext: 'cipher-owner',
    customerEmailCiphertext: 'cipher-customer',
    reminderScheduledAt: '2026-08-31T05:00:00.000Z',
  } as const;
  const first = buildBookingNotificationRows(input);
  const second = buildBookingNotificationRows(input);
  assert(JSON.stringify(first.map((row) => row.idempotency_key)) === JSON.stringify(second.map((row) => row.idempotency_key)), 'keys changed');
});

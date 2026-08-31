import { buildDeliveryFact, sanitizeDeliveryError } from './contracts.ts';
import {
  decryptNotificationSecret,
  encryptNotificationSecret,
} from '../_shared/notification-crypto.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test('terminal delivery facts contain operational fields but no contact or token data', () => {
  const fact = buildDeliveryFact({
    queueId: 'queue-1',
    bookingId: 'booking-1',
    recipientRole: 'customer',
    channel: 'email',
    templateKey: 'booking_reminder_24h_customer',
    outcome: 'failed',
    error: 'Email error for aliya@example.com using /booking/manage/raw-management-token',
  });

  const serialized = JSON.stringify(fact);
  assert(fact.event_kind === 'failed', 'failure outcome missing');
  assert(fact.error_code === 'delivery_failed', 'stable failure code missing');
  assert(!serialized.includes('aliya@example.com'), 'email leaked to delivery fact');
  assert(!serialized.includes('raw-management-token'), 'token leaked to delivery fact');
});

Deno.test('delivery errors are collapsed to safe operational codes', () => {
  assert(sanitizeDeliveryError(new Error('telegram +77000000000 failed')) === 'delivery_failed', 'error was not sanitized');
  assert(sanitizeDeliveryError(new Error('RESEND_API_KEY not configured')) === 'provider_not_configured', 'configuration error was not classified');
});

Deno.test('notification destinations and management links are encrypted at rest', async () => {
  const secret = 'test-secret-that-is-longer-than-thirty-two-characters';
  const sensitive = { email: 'aliya@example.com', management_url: '/booking/manage/raw-token' };
  const encrypted = await encryptNotificationSecret(sensitive, secret);
  assert(!encrypted.includes('aliya@example.com'), 'email remained in ciphertext');
  assert(!encrypted.includes('raw-token'), 'token remained in ciphertext');
  const decrypted = await decryptNotificationSecret<typeof sensitive>(encrypted, secret);
  assert(decrypted.email === sensitive.email, 'email did not decrypt');
  assert(decrypted.management_url === sensitive.management_url, 'management URL did not decrypt');
});

import { describe, expect, it } from 'vitest';
import {
  WEBHOOK_API_SCOPES,
  WEBHOOK_EVENT_TYPES,
  buildWebhookHeaders,
  createWebhookSignature,
  getNextWebhookRetryAt,
  isWebhookApiScope,
  isWebhookEventType,
  shouldRetryWebhookDelivery,
  validateWebhookTargetUrl,
} from '../webhooks';

describe('webhooks service contract', () => {
  it('defines the canonical Webhooks V2 event catalog', () => {
    expect(WEBHOOK_EVENT_TYPES).toEqual([
      'lead.created',
      'lead.updated',
      'booking.created',
      'booking.cancelled',
      'event.registration_created',
      'invoice.created',
      'invoice.paid',
      'page.published',
      'form.submitted',
      'review_request.created',
      'review_request.used',
      'review.created',
      'review.published',
    ]);
    expect(isWebhookEventType('lead.created')).toBe(true);
    expect(isWebhookEventType('review_request.used')).toBe(true);
    expect(isWebhookEventType('review.published')).toBe(true);
    expect(isWebhookEventType('payment.succeeded')).toBe(false);
  });

  it('defines the public API scope catalog', () => {
    expect(WEBHOOK_API_SCOPES).toContain('webhooks:manage');
    expect(isWebhookApiScope('analytics:read')).toBe(true);
    expect(isWebhookApiScope('admin:write')).toBe(false);
  });

  it('validates webhook endpoint URLs defensively', () => {
    expect(validateWebhookTargetUrl('https://example.com/webhooks/linkmax')).toEqual({ valid: true });
    expect(validateWebhookTargetUrl('')).toEqual({ valid: false, reason: 'missing' });
    expect(validateWebhookTargetUrl('not-a-url')).toEqual({ valid: false, reason: 'invalid_url' });
    expect(validateWebhookTargetUrl('http://example.com')).toEqual({ valid: false, reason: 'https_required' });
    expect(validateWebhookTargetUrl('https://localhost:3000/hook')).toEqual({
      valid: false,
      reason: 'private_network_blocked',
    });
    expect(validateWebhookTargetUrl('https://192.168.1.10/hook')).toEqual({
      valid: false,
      reason: 'private_network_blocked',
    });
  });

  it('calculates the V2 retry schedule', () => {
    const baseDate = new Date('2026-07-02T00:00:00.000Z');
    expect(getNextWebhookRetryAt(1, baseDate)).toBe('2026-07-02T00:01:00.000Z');
    expect(getNextWebhookRetryAt(2, baseDate)).toBe('2026-07-02T00:05:00.000Z');
    expect(getNextWebhookRetryAt(5, baseDate)).toBe('2026-07-02T04:00:00.000Z');
    expect(getNextWebhookRetryAt(6, baseDate)).toBeNull();
  });

  it('marks transient delivery failures as retryable', () => {
    expect(shouldRetryWebhookDelivery(null)).toBe(true);
    expect(shouldRetryWebhookDelivery(429)).toBe(true);
    expect(shouldRetryWebhookDelivery(503)).toBe(true);
    expect(shouldRetryWebhookDelivery(400)).toBe(false);
    expect(shouldRetryWebhookDelivery(201)).toBe(false);
  });

  it('creates HMAC signatures over timestamp and payload', async () => {
    const timestamp = '2026-07-02T00:00:00.000Z';
    const first = await createWebhookSignature('whsec_test', '{"event":"lead.created"}', timestamp);
    const second = await createWebhookSignature('whsec_test', '{"event":"lead.updated"}', timestamp);

    expect(first.timestamp).toBe(timestamp);
    expect(first.signedPayload).toBe(`${timestamp}.{"event":"lead.created"}`);
    expect(first.signature).toMatch(/^[a-f0-9]{64}$/);
    expect(first.signature).not.toBe(second.signature);
  });

  it('builds the LinkMAX webhook header contract', () => {
    expect(buildWebhookHeaders({
      eventType: 'lead.created',
      eventId: 'evt_123',
      deliveryId: 'del_123',
      timestamp: '2026-07-02T00:00:00.000Z',
      signature: 'abc123',
    })).toEqual({
      'Content-Type': 'application/json',
      'User-Agent': 'LinkMAX-Webhooks/2.0',
      'X-LinkMAX-Event': 'lead.created',
      'X-LinkMAX-Event-Id': 'evt_123',
      'X-LinkMAX-Delivery-Id': 'del_123',
      'X-LinkMAX-Timestamp': '2026-07-02T00:00:00.000Z',
      'X-LinkMAX-Signature': 'v1=abc123',
    });
  });
});

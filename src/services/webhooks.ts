const WEBHOOK_EVENT_TYPES = [
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
] as const;

const WEBHOOK_API_SCOPES = [
  'leads:read',
  'leads:write',
  'bookings:read',
  'bookings:write',
  'pages:read',
  'analytics:read',
  'webhooks:manage',
] as const;

export const WEBHOOK_RETRY_DELAYS_SECONDS = [60, 300, 900, 3600, 14400] as const;

export type WebhookEventType = typeof WEBHOOK_EVENT_TYPES[number];
export type WebhookApiScope = typeof WEBHOOK_API_SCOPES[number];

export interface WebhookUrlValidationResult {
  valid: boolean;
  reason?: 'missing' | 'invalid_url' | 'https_required' | 'private_network_blocked';
}

export interface WebhookSignatureResult {
  timestamp: string;
  signature: string;
  signedPayload: string;
}

export interface WebhookHeaderInput {
  eventType: WebhookEventType;
  eventId: string;
  deliveryId: string;
  timestamp: string;
  signature: string;
}

const WEBHOOK_EVENT_SET = new Set<string>(WEBHOOK_EVENT_TYPES);
const WEBHOOK_SCOPE_SET = new Set<string>(WEBHOOK_API_SCOPES);

export { WEBHOOK_API_SCOPES, WEBHOOK_EVENT_TYPES };

export function isWebhookEventType(value: string): value is WebhookEventType {
  return WEBHOOK_EVENT_SET.has(value);
}

export function isWebhookApiScope(value: string): value is WebhookApiScope {
  return WEBHOOK_SCOPE_SET.has(value);
}

export function validateWebhookTargetUrl(url: string): WebhookUrlValidationResult {
  if (!url.trim()) return { valid: false, reason: 'missing' };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: 'invalid_url' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, reason: 'https_required' };
  }

  if (isPrivateWebhookHost(parsed.hostname)) {
    return { valid: false, reason: 'private_network_blocked' };
  }

  return { valid: true };
}

export function shouldRetryWebhookDelivery(statusCode: number | null | undefined): boolean {
  if (statusCode == null) return true;
  if ([408, 409, 425, 429].includes(statusCode)) return true;
  return statusCode >= 500 && statusCode <= 599;
}

export function getNextWebhookRetryAt(
  failedAttemptNumber: number,
  baseDate: Date = new Date()
): string | null {
  const delay = WEBHOOK_RETRY_DELAYS_SECONDS[failedAttemptNumber - 1];
  if (!delay) return null;
  return new Date(baseDate.getTime() + delay * 1000).toISOString();
}

export async function createWebhookSignature(
  secret: string,
  payload: string,
  timestamp: string = new Date().toISOString()
): Promise<WebhookSignatureResult> {
  const signedPayload = `${timestamp}.${payload}`;
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await globalThis.crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    new TextEncoder().encode(signedPayload)
  );

  return {
    timestamp,
    signature: toHex(signatureBuffer),
    signedPayload,
  };
}

export function buildWebhookHeaders(input: WebhookHeaderInput): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'LinkMAX-Webhooks/2.0',
    'X-LinkMAX-Event': input.eventType,
    'X-LinkMAX-Event-Id': input.eventId,
    'X-LinkMAX-Delivery-Id': input.deliveryId,
    'X-LinkMAX-Timestamp': input.timestamp,
    'X-LinkMAX-Signature': `v1=${input.signature}`,
  };
}

function isPrivateWebhookHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host === '::1' || host.endsWith('.localhost')) return true;

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) return false;

  const parts = ipv4.slice(1).map(Number);
  if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return true;

  const [first, second] = parts;
  return (
    first === 10 ||
    first === 127 ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 169 && second === 254)
  );
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

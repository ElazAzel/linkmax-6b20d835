import type {
  NotificationChannel,
  RecipientRole,
} from '../send-booking-notification/contracts.ts';

export type DeliveryOutcome = 'delivered' | 'failed';

export function sanitizeDeliveryError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/not configured|missing api key|RESEND_API_KEY/i.test(message)) return 'provider_not_configured';
  if (/timeout|timed out|network/i.test(message)) return 'network_error';
  return 'delivery_failed';
}

export function buildDeliveryFact(input: {
  queueId: string;
  bookingId: string;
  recipientRole: RecipientRole;
  channel: NotificationChannel;
  templateKey: string;
  outcome: DeliveryOutcome;
  error?: unknown;
}) {
  return {
    queue_id: input.queueId,
    booking_id: input.bookingId,
    event_kind: input.outcome,
    recipient_role: input.recipientRole,
    channel: input.channel,
    template_key: input.templateKey,
    error_code: input.outcome === 'failed' ? sanitizeDeliveryError(input.error) : null,
  };
}

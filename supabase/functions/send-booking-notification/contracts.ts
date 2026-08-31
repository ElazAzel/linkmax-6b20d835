import { bookingReminderIdempotencyKey } from '../send-booking-reminder/contracts.ts';

export type RecipientRole = 'owner' | 'staff' | 'customer';
export type NotificationChannel = 'telegram' | 'email';

export interface BookingNotificationVariables {
  client_name: string;
  service_name: string;
  slot_date: string;
  slot_time: string;
  timezone: string;
  [key: string]: string;
}

export interface BookingNotificationPayload {
  booking_id: string;
  recipient_role: RecipientRole;
  channel: NotificationChannel;
  template_key: string;
  locale: string;
  variables: BookingNotificationVariables;
  secure_ciphertext: string;
}

export interface BookingNotificationQueueRow {
  user_id: string | null;
  event_type: string;
  payload: BookingNotificationPayload;
  idempotency_key: string;
  scheduled_at: string;
}

interface BuildBookingNotificationRowsInput {
  bookingId: string;
  ownerId: string;
  locale: string;
  variables: BookingNotificationVariables;
  ownerTelegramCiphertext?: string | null;
  customerEmailCiphertext?: string | null;
  reminderScheduledAt: string;
}

function notificationKey(
  bookingId: string,
  templateKey: string,
  recipientRole: RecipientRole,
  channel: NotificationChannel,
): string {
  return `booking:${bookingId}:${templateKey}:${recipientRole}:${channel}`;
}

export function buildBookingNotificationRows(
  input: BuildBookingNotificationRowsInput,
): BookingNotificationQueueRow[] {
  const now = new Date().toISOString();
  const rows: BookingNotificationQueueRow[] = [];

  if (input.ownerTelegramCiphertext) {
    const templateKey = 'booking_created_owner';
    rows.push({
      user_id: input.ownerId,
      event_type: templateKey,
      payload: {
        booking_id: input.bookingId,
        recipient_role: 'owner',
        channel: 'telegram',
        template_key: templateKey,
        locale: input.locale,
        variables: input.variables,
        secure_ciphertext: input.ownerTelegramCiphertext,
      },
      idempotency_key: notificationKey(input.bookingId, templateKey, 'owner', 'telegram'),
      scheduled_at: now,
    });
  }

  if (input.customerEmailCiphertext) {
    const createdTemplate = 'booking_created_customer';
    rows.push({
      user_id: null,
      event_type: createdTemplate,
      payload: {
        booking_id: input.bookingId,
        recipient_role: 'customer',
        channel: 'email',
        template_key: createdTemplate,
        locale: input.locale,
        variables: input.variables,
        secure_ciphertext: input.customerEmailCiphertext,
      },
      idempotency_key: notificationKey(input.bookingId, createdTemplate, 'customer', 'email'),
      scheduled_at: now,
    });

    const reminderTemplate = 'booking_reminder_24h_customer';
    rows.push({
      user_id: null,
      event_type: reminderTemplate,
      payload: {
        booking_id: input.bookingId,
        recipient_role: 'customer',
        channel: 'email',
        template_key: reminderTemplate,
        locale: input.locale,
        variables: input.variables,
        secure_ciphertext: input.customerEmailCiphertext,
      },
      idempotency_key: bookingReminderIdempotencyKey(
        input.bookingId,
        'email',
        input.reminderScheduledAt,
      ),
      scheduled_at: input.reminderScheduledAt,
    });
  }

  return rows;
}

export function safeNotificationMetadata(payload: BookingNotificationPayload) {
  return {
    booking_id: payload.booking_id,
    recipient_role: payload.recipient_role,
    channel: payload.channel,
    template_key: payload.template_key,
    locale: payload.locale,
  };
}

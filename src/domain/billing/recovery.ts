export const BILLING_RECOVERY_MAX_ATTEMPTS = 3;
export const BILLING_RECOVERY_RETRY_DELAY_DAYS = [1, 3] as const;

export type BillingRecoveryStatus = 'none' | 'scheduled' | 'notified' | 'recovered' | 'exhausted';

export interface BillingRecoveryStateInput {
  existingAttemptCount?: number | null;
  occurredAt: string | Date;
  successful?: boolean;
}

export interface BillingRecoveryState {
  status: BillingRecoveryStatus;
  attemptCount: number;
  nextActionAt: string | null;
}

export interface BillingRecoveryNotificationCopyInput {
  attemptCount: number;
  maxAttempts?: number;
  nextActionAt?: string | null;
  manageBillingUrl?: string | null;
}

export interface BillingRecoveryNotificationCopy {
  subject: string;
  telegramText: string;
  html: string;
}

export function clampBillingRecoveryAttemptCount(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value ?? 0);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(BILLING_RECOVERY_MAX_ATTEMPTS, Math.max(0, Math.trunc(numeric)));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toValidDate(value: string | Date): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid billing recovery date');
  }
  return date;
}

export function calculateBillingRecoveryState(input: BillingRecoveryStateInput): BillingRecoveryState {
  if (input.successful) {
    return {
      status: 'recovered',
      attemptCount: 0,
      nextActionAt: null,
    };
  }

  const occurredAt = toValidDate(input.occurredAt);
  const attemptCount = Math.min(
    BILLING_RECOVERY_MAX_ATTEMPTS,
    clampBillingRecoveryAttemptCount(input.existingAttemptCount) + 1
  );
  const exhausted = attemptCount >= BILLING_RECOVERY_MAX_ATTEMPTS;
  const delayDays = BILLING_RECOVERY_RETRY_DELAY_DAYS[attemptCount - 1];

  return {
    status: exhausted ? 'exhausted' : 'scheduled',
    attemptCount,
    nextActionAt: exhausted || delayDays == null ? null : addDays(occurredAt, delayDays).toISOString(),
  };
}

export function normalizeBillingPromoCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(normalized)) return null;
  return normalized;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildBillingRecoveryNotificationCopy(
  input: BillingRecoveryNotificationCopyInput
): BillingRecoveryNotificationCopy {
  const maxAttempts = input.maxAttempts ?? BILLING_RECOVERY_MAX_ATTEMPTS;
  const attemptLabel = `${input.attemptCount}/${maxAttempts}`;
  const nextAction = input.nextActionAt
    ? `Next recovery check: ${new Date(input.nextActionAt).toISOString().slice(0, 10)}.`
    : 'This is the final recovery touchpoint for this billing window.';
  const manageBillingUrl = input.manageBillingUrl ?? '/pricing?billing=recover';
  const escapedUrl = escapeHtml(manageBillingUrl);

  return {
    subject: 'Action needed: LinkMAX Pro payment failed',
    telegramText: [
      '<b>LinkMAX Pro payment failed</b>',
      `Recovery touchpoint: ${attemptLabel}.`,
      'Please update the payment method to keep Pro features active.',
      nextAction,
      `Billing: ${manageBillingUrl}`,
    ].join('\n'),
    html: [
      '<h2>LinkMAX Pro payment failed</h2>',
      `<p>Recovery touchpoint: <strong>${attemptLabel}</strong>.</p>`,
      '<p>Please update the payment method to keep Pro features active.</p>',
      `<p>${escapeHtml(nextAction)}</p>`,
      `<p><a href="${escapedUrl}">Manage billing</a></p>`,
    ].join(''),
  };
}

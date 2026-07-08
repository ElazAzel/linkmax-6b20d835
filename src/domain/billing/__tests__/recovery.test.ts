import { describe, expect, it } from 'vitest';
import {
  BILLING_RECOVERY_MAX_ATTEMPTS,
  buildBillingRecoveryNotificationCopy,
  calculateBillingRecoveryState,
  clampBillingRecoveryAttemptCount,
  normalizeBillingPromoCode,
} from '@/domain/billing/recovery';

describe('billing recovery domain', () => {
  it('clamps recovery attempts to the supported dunning window', () => {
    expect(clampBillingRecoveryAttemptCount(null)).toBe(0);
    expect(clampBillingRecoveryAttemptCount(-4)).toBe(0);
    expect(clampBillingRecoveryAttemptCount(2.7)).toBe(2);
    expect(clampBillingRecoveryAttemptCount(99)).toBe(BILLING_RECOVERY_MAX_ATTEMPTS);
  });

  it('schedules the first and second recovery touchpoints', () => {
    const first = calculateBillingRecoveryState({
      existingAttemptCount: 0,
      occurredAt: '2026-07-04T00:00:00.000Z',
    });
    expect(first).toEqual({
      status: 'scheduled',
      attemptCount: 1,
      nextActionAt: '2026-07-05T00:00:00.000Z',
    });

    const second = calculateBillingRecoveryState({
      existingAttemptCount: 1,
      occurredAt: '2026-07-04T00:00:00.000Z',
    });
    expect(second).toEqual({
      status: 'scheduled',
      attemptCount: 2,
      nextActionAt: '2026-07-07T00:00:00.000Z',
    });
  });

  it('marks the third recovery touchpoint as exhausted', () => {
    expect(calculateBillingRecoveryState({
      existingAttemptCount: 2,
      occurredAt: '2026-07-04T00:00:00.000Z',
    })).toEqual({
      status: 'exhausted',
      attemptCount: 3,
      nextActionAt: null,
    });
  });

  it('resets recovery state after a successful billing event', () => {
    expect(calculateBillingRecoveryState({
      existingAttemptCount: 2,
      occurredAt: '2026-07-04T00:00:00.000Z',
      successful: true,
    })).toEqual({
      status: 'recovered',
      attemptCount: 0,
      nextActionAt: null,
    });
  });

  it('normalizes safe promo codes for provider checkout handoff', () => {
    expect(normalizeBillingPromoCode(' summer_26 ')).toBe('SUMMER_26');
    expect(normalizeBillingPromoCode('ab')).toBeNull();
    expect(normalizeBillingPromoCode('DROP TABLE')).toBeNull();
    expect(normalizeBillingPromoCode('x'.repeat(33))).toBeNull();
  });

  it('builds notification copy with billing action link', () => {
    const copy = buildBillingRecoveryNotificationCopy({
      attemptCount: 1,
      nextActionAt: '2026-07-05T00:00:00.000Z',
      manageBillingUrl: 'https://lnkmx.my/pricing?billing=recover',
    });

    expect(copy.subject).toContain('payment failed');
    expect(copy.telegramText).toContain('1/3');
    expect(copy.html).toContain('https://lnkmx.my/pricing?billing=recover');
  });
});

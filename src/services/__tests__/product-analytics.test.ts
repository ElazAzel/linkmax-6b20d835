import { describe, expect, it } from 'vitest';
import {
  PRODUCT_EVENT_NAMES,
  calculateCreatorHealthScore,
  mapActivationEventToProductEvent,
} from '../product-analytics';

describe('product analytics', () => {
  it('includes review request events in the canonical product event catalog', () => {
    expect(PRODUCT_EVENT_NAMES).toContain('review_request_created');
    expect(PRODUCT_EVENT_NAMES).toContain('review_request_used');
  });

  it('calculates creator health score from activation milestones', () => {
    const score = calculateCreatorHealthScore({
      pagePublishedAt: '2026-07-01T09:00:00.000Z',
      conversionBlockAddedAt: '2026-07-01T09:05:00.000Z',
      telegramConnectedAt: '2026-07-01T09:10:00.000Z',
      firstLeadReceivedAt: '2026-07-01T09:20:00.000Z',
      firstLeadProcessedAt: '2026-07-01T09:30:00.000Z',
      dashboardReturnedAt: '2026-07-02T09:00:00.000Z',
    });

    expect(score.score).toBe(100);
    expect(score.reasons).toEqual([
      'page_published',
      'conversion_block_added',
      'telegram_connected',
      'first_lead_received',
      'lead_processed',
      'dashboard_returned',
    ]);
  });

  it('keeps score partial when activation milestones are missing', () => {
    const score = calculateCreatorHealthScore({
      pagePublishedAt: '2026-07-01T09:00:00.000Z',
      firstLeadReceivedAt: '2026-07-01T09:20:00.000Z',
    });

    expect(score.score).toBe(40);
    expect(score.telegramPoints).toBe(0);
    expect(score.reasons).toEqual(['page_published', 'first_lead_received']);
  });

  it('maps existing activation events into product analytics event names', () => {
    expect(mapActivationEventToProductEvent('wizard_started')).toBe('onboarding_started');
    expect(mapActivationEventToProductEvent('wizard_completed')).toBe('onboarding_step_completed');
    expect(mapActivationEventToProductEvent('lead_seen')).toBe('lead_viewed');
    expect(mapActivationEventToProductEvent('activation_checklist_step_completed', { stepId: 'connect-telegram' }))
      .toBe('telegram_connected');
  });

  it('ignores activation events that are not creator activation milestones', () => {
    expect(mapActivationEventToProductEvent('activation_checklist_step_clicked')).toBeNull();
    expect(mapActivationEventToProductEvent('repeat_followup_sent')).toBeNull();
  });
});

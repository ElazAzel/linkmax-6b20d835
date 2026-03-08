/**
 * Activation & CRM Events — Server-side tracking for activation + conversion funnel
 * Activation: wizard_completed, page_published, page_shared, first_external_view
 * CRM: lead_seen, lead_replied, lead_status_changed, booking_confirmed, first_lead_reply, lead_stale_24h
 */
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';

export type ActivationEventType =
  | 'wizard_started'
  | 'wizard_niche_selected'
  | 'wizard_completed'
  | 'page_published'
  | 'page_shared'
  | 'first_external_view'
  | 'first_block_click'
  | 'first_lead_captured'
  | 'dashboard_return'
  // CRM-layer events
  | 'lead_seen'
  | 'lead_replied'
  | 'lead_status_changed'
  | 'booking_confirmed'
  | 'first_lead_reply'
  | 'lead_stale_24h'
  // Booking funnel events
  | 'booking_slot_selected'
  | 'booking_form_opened'
  | 'booking_submitted'
  | 'booking_prepayment_initiated'
  | 'booking_cancelled'
  | 'booking_payment_confirmed'
  | 'booking_completed'
  // Retention events
  | 'post_service_followup_sent'
  | 'repeat_booking_detected'
  | 'creator_returned_after_gap'
  | 'stale_leads_alert_shown'
  | 'weekly_digest_sent'
  // Inbound limit events
  | 'inbound_limit_warning'
  | 'inbound_limit_reached'
  | 'inbound_blocked_submission'
  | 'upgrade_from_limit';

/**
 * Track an activation event to the analytics table
 */
export async function trackActivationEvent(
  pageId: string,
  eventType: ActivationEventType,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('analytics')
      .insert([{
        page_id: pageId,
        event_type: `activation:${eventType}`,
        metadata: (metadata || {}) as Record<string, string>,
      }]);

    if (error) {
      logger.error('Failed to track activation event', error, { context: 'activation-events' });
    }
  } catch (err) {
    // Fire-and-forget: never block UI for analytics
    logger.error('Activation event error', err, { context: 'activation-events' });
  }
}

/**
 * Track page_shared with channel info
 */
export function trackPageShared(pageId: string, channel: string): void {
  trackActivationEvent(pageId, 'page_shared', { channel });
}

/**
 * Track wizard milestones
 */
export function trackWizardStarted(pageId: string): void {
  trackActivationEvent(pageId, 'wizard_started');
}

export function trackWizardNicheSelected(pageId: string, niche: string): void {
  trackActivationEvent(pageId, 'wizard_niche_selected', { niche });
}

export function trackWizardCompleted(pageId: string, niche: string): void {
  trackActivationEvent(pageId, 'wizard_completed', { niche });
}

/**
 * Track page published
 */
export function trackPagePublished(pageId: string): void {
  trackActivationEvent(pageId, 'page_published');
}

// ──────────── CRM-layer event helpers ────────────

/** User opened lead details */
export function trackLeadSeen(pageId: string, leadId: string): void {
  trackActivationEvent(pageId, 'lead_seen', { leadId });
}

/** User replied via WhatsApp/Telegram/call */
export function trackLeadReplied(pageId: string, leadId: string, channel: string): void {
  trackActivationEvent(pageId, 'lead_replied', { leadId, channel });
}

/** Lead status changed */
export function trackLeadStatusChanged(pageId: string, leadId: string, from: string, to: string): void {
  trackActivationEvent(pageId, 'lead_status_changed', { leadId, from, to });
}

/** Booking confirmed */
export function trackBookingConfirmed(pageId: string, bookingId: string): void {
  trackActivationEvent(pageId, 'booking_confirmed', { bookingId });
}

/** First ever lead reply (milestone) */
export function trackFirstLeadReply(pageId: string): void {
  trackActivationEvent(pageId, 'first_lead_reply');
}

// ──────────── Booking funnel event helpers ────────────

/** Booking slot selected by customer */
export function trackBookingSlotSelected(pageId: string, blockId: string, date: string, time: string): void {
  trackActivationEvent(pageId, 'booking_slot_selected', { blockId, date, time });
}

/** Booking form opened */
export function trackBookingFormOpened(pageId: string, blockId: string): void {
  trackActivationEvent(pageId, 'booking_form_opened', { blockId });
}

/** Booking submitted */
export function trackBookingSubmitted(pageId: string, bookingId: string, hasPrepayment: boolean): void {
  trackActivationEvent(pageId, 'booking_submitted', { bookingId, hasPrepayment: String(hasPrepayment) });
}

/** Prepayment initiated (customer clicked pay button) */
export function trackBookingPrepaymentInitiated(pageId: string, bookingId: string, method: string): void {
  trackActivationEvent(pageId, 'booking_prepayment_initiated', { bookingId, method });
}

/** Owner confirmed payment */
export function trackBookingPaymentConfirmed(pageId: string, bookingId: string): void {
  trackActivationEvent(pageId, 'booking_payment_confirmed', { bookingId });
}

/** Booking cancelled */
export function trackBookingCancelled(pageId: string, bookingId: string, by: string): void {
  trackActivationEvent(pageId, 'booking_cancelled', { bookingId, cancelledBy: by });
}

// ──────────── Retention event helpers ────────────

/** Owner sent follow-up after service */
export function trackPostServiceFollowUp(pageId: string, bookingId: string, channel: string): void {
  trackActivationEvent(pageId, 'post_service_followup_sent', { bookingId, channel });
}

/** Repeat booking detected (same phone/email booked again) */
export function trackRepeatBookingDetected(pageId: string, bookingId: string, phone?: string): void {
  trackActivationEvent(pageId, 'repeat_booking_detected', { bookingId, phone: phone || '' });
}

/** Creator returned after 3+ day gap */
export function trackCreatorReturnedAfterGap(pageId: string, daysSinceLastVisit: number): void {
  trackActivationEvent(pageId, 'creator_returned_after_gap', { daysSinceLastVisit: String(daysSinceLastVisit) });
}

/** Stale leads alert shown */
export function trackStaleLeadsAlertShown(pageId: string, count: number): void {
  trackActivationEvent(pageId, 'stale_leads_alert_shown', { count: String(count) });
}

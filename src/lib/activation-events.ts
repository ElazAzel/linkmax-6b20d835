/**
 * Activation Events — Server-side tracking for activation funnel
 * Tracks key milestones: wizard_completed, page_published, page_shared, first_external_view
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
  | 'dashboard_return';

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
        metadata: metadata || {},
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

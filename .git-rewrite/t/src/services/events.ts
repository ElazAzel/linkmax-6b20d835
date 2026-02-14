import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/logger';
import type { EventBlock } from '@/types/page';
import type { Json } from '@/integrations/supabase/types';

const mapEventBlockToRecord = (block: EventBlock, pageId: string, ownerId: string) => ({
  id: block.eventId,
  block_id: block.id,
  page_id: pageId,
  owner_id: ownerId,
  title_i18n_json: block.title as Json,
  description_i18n_json: (block.description || {}) as Json,
  cover_url: block.coverUrl || null,
  start_at: block.startAt || null,
  end_at: block.endAt || null,
  timezone: block.timezone || null,
  registration_closes_at: block.registrationClosesAt || null,
  location_type: block.locationType || null,
  location_value: block.locationValue || null,
  is_paid: Boolean(block.isPaid),
  price_amount: block.price ?? null,
  currency: block.currency || null,
  capacity: block.capacity ?? null,
  status: block.status || 'draft',
  form_schema_json: (block.formFields || []) as unknown as Json,
  settings_json: (block.settings || {}) as unknown as Json,
});

export async function syncEventBlock(block: EventBlock, pageId?: string, ownerId?: string) {
  if (!pageId || !ownerId || !block.eventId) {
    logger.warn('syncEventBlock: missing pageId, ownerId, or eventId', { context: 'events' });
    return;
  }
  try {
    const record = mapEventBlockToRecord(block, pageId, ownerId);
    const { error } = await supabase.from('events').upsert([record], {
      onConflict: 'id',
      ignoreDuplicates: false
    });
    if (error) {
      logger.error('Failed to sync event block', error, { context: 'events', data: { eventId: block.eventId } });
    }
  } catch (error) {
    logger.error('Failed to sync event block', error, { context: 'events' });
  }
}

export async function deleteEventBlock(eventId?: string, ownerId?: string) {
  if (!eventId || !ownerId) return;
  try {
    const { error } = await supabase.from('events').delete().eq('id', eventId).eq('owner_id', ownerId);
    if (error) {
      logger.error('Failed to delete event block', error, { context: 'events', data: { eventId } });
    }
  } catch (error) {
    logger.error('Failed to delete event block', error, { context: 'events' });
  }
}

/**
 * Fetch event by ID for public display
 */
export async function getPublicEvent(eventId: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    logger.error('Failed to fetch public event', error, { context: 'events', data: { eventId } });
    return null;
  }
  return data;
}

/**
 * Get registration count for an event
 */
export async function getEventRegistrationCount(eventId: string): Promise<number> {
  // Use security definer function to bypass RLS for public count access
  const { data, error } = await supabase
    .rpc('get_event_registration_count' as never, { p_event_id: eventId } as never);

  if (error) {
    logger.error('Failed to get registration count', error, { context: 'events', data: { eventId } });
    return 0;
  }
  return (data as number) || 0;
}

/**
 * Check if email is already registered for event
 * Uses SECURITY DEFINER function to bypass RLS for public access
 */
export async function isEmailRegistered(eventId: string, email: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('check_email_registered_for_event' as never, {
      p_event_id: eventId,
      p_email: email
    } as never);

  if (error) {
    logger.error('Failed to check email registration', error, { context: 'events', data: { eventId, email } });
    return false;
  }
  return Boolean(data);
}

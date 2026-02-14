import { supabase } from '@/platform/supabase/client';
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
    console.warn('syncEventBlock: missing pageId, ownerId, or eventId');
    return;
  }
  try {
    const record = mapEventBlockToRecord(block, pageId, ownerId);
    const { error } = await supabase.from('events').upsert([record], { 
      onConflict: 'id',
      ignoreDuplicates: false 
    });
    if (error) {
      console.error('Failed to sync event block:', error);
    }
  } catch (error) {
    console.error('Failed to sync event block', error);
  }
}

export async function deleteEventBlock(eventId?: string, ownerId?: string) {
  if (!eventId || !ownerId) return;
  try {
    const { error } = await supabase.from('events').delete().eq('id', eventId).eq('owner_id', ownerId);
    if (error) {
      console.error('Failed to delete event block:', error);
    }
  } catch (error) {
    console.error('Failed to delete event block', error);
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
    console.error('Failed to fetch public event:', error);
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
    console.error('Failed to get registration count:', error);
    return 0;
  }
  return (data as number) || 0;
}

/**
 * Check if email is already registered for event
 */
export async function isEmailRegistered(eventId: string, email: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('attendee_email', email)
    .not('status', 'eq', 'cancelled');
  
  if (error) {
    console.error('Failed to check email registration:', error);
    return false;
  }
  return (count || 0) > 0;
}

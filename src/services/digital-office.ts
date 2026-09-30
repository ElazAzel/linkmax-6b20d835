import { supabase } from '@/platform/supabase/client';
import { isMissingSchemaError } from '@/lib/resilience/missing-schema';
import type { OfficeBooking } from '@/domain/office/workspace';

const PAGE_SIZE = 500;
const BOOKING_FIELDS = 'id,page_id,owner_id,block_id,client_name,client_email,client_phone,client_notes,user_id,client_identity_hash,slot_date,slot_time,slot_end_time,booking_timezone,status,version,payment_status,paid_amount,refunded_amount,total_price_amount,service_snapshot,created_at' as const;

/** Account-wide projection of existing records; RLS remains the authorization boundary. */
export async function loadOfficeBookings(ownerId: string, signal?: AbortSignal): Promise<OfficeBooking[]> {
  if (!ownerId) throw new Error('not_allowed');
  const cutoff = new Date().toISOString();
  const rows = new Map<string, OfficeBooking>();
  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = supabase.from('bookings').select(BOOKING_FIELDS)
      .eq('owner_id', ownerId).lte('created_at', cutoff)
      .order('created_at', { ascending: false }).order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (signal) query = query.abortSignal(signal);
    const { data, error } = await query;
    if (error) throw new Error(isMissingSchemaError(error) ? 'feature_unavailable' : 'request_failed');
    for (const booking of data ?? []) rows.set(booking.id, booking);
    if (!data || data.length < PAGE_SIZE) return Array.from(rows.values());
  }
}

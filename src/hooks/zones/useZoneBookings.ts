import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ZoneBooking {
  id: string;
  block_id: string;
  page_id: string;
  owner_id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_notes: string | null;
  slot_date: string;
  slot_time: string;
  slot_end_time: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  // joined
  page_title?: string;
  page_slug?: string;
}

export const zoneBookingsKeys = {
  all: (zoneId: string) => ['zone-bookings', zoneId] as const,
};

async function fetchZoneBookings(zoneId: string): Promise<ZoneBooking[]> {
  // Get pages linked to this zone
  const { data: pages, error: pagesErr } = await supabase
    .from('pages')
    .select('id, title, slug')
    .eq('organization_id', zoneId);

  if (pagesErr) throw pagesErr;
  if (!pages || pages.length === 0) return [];

  const pageIds = pages.map(p => p.id);
  const pageMap = new Map(pages.map(p => [p.id, p]));

  // Get bookings for those pages
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('*')
    .in('page_id', pageIds)
    .order('slot_date', { ascending: true });

  if (error) throw error;

  return (bookings || []).map(b => ({
    ...b,
    page_title: pageMap.get(b.page_id)?.title || '',
    page_slug: pageMap.get(b.page_id)?.slug || '',
  })) as ZoneBooking[];
}

export function useZoneBookings(zoneId: string | null) {
  const safeZoneId = zoneId || '';

  const { data: bookings = [], isLoading: loading, refetch } = useQuery({
    queryKey: zoneBookingsKeys.all(safeZoneId),
    queryFn: () => fetchZoneBookings(safeZoneId),
    enabled: !!safeZoneId,
    staleTime: 30_000,
  });

  return { bookings, loading, refetch };
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

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
  timezone?: string;
  // joined
  page_title?: string;
  page_slug?: string;
  viewer_formatted_date?: string;
  viewer_formatted_time?: string;
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

  // Retrieve the local timezone of the viewer to normalize the display
  const viewerTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (bookings || []).map(b => {
    // If the booking has no timezone info, default to viewer's timezone
    // @ts-expect-error - timezone will be added in the upcoming db migration
    const bookingTz = b.timezone || viewerTimeZone;

    // Create a date object in UTC for the exact booked string
    // This allows accurate cross-timezone rendering in the UI layer
    const slotDateTimeStr = `${b.slot_date}T${b.slot_time}`;
    let viewDateObj = new Date(slotDateTimeStr);

    // if a slot is provided but we are looking at it from a different timezone:
    if (viewerTimeZone !== bookingTz) {
      viewDateObj = toZonedTime(slotDateTimeStr, viewerTimeZone);
    }

    return {
      ...b,
      viewer_formatted_date: formatInTimeZone(viewDateObj, viewerTimeZone, 'yyyy-MM-dd'),
      viewer_formatted_time: formatInTimeZone(viewDateObj, viewerTimeZone, 'HH:mm:ss'),
      page_title: pageMap.get(b.page_id)?.title || '',
      page_slug: pageMap.get(b.page_id)?.slug || '',
    };
  }) as ZoneBooking[];
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

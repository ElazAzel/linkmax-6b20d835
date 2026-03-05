import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ZoneEvent {
  id: string;
  block_id: string;
  page_id: string;
  owner_id: string;
  title_i18n_json: Record<string, string>;
  description_i18n_json: Record<string, string> | null;
  start_at: string | null;
  end_at: string | null;
  location_type: string | null;
  location_value: string | null;
  capacity: number | null;
  is_paid: boolean;
  price_amount: number | null;
  currency: string | null;
  status: string;
  cover_url: string | null;
  created_at: string;
  // joined
  page_title?: string;
  registrations_count?: number;
}

export interface ZoneEventRegistration {
  id: string;
  event_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  status: string;
  payment_status: string;
  paid_amount: number | null;
  created_at: string;
}

export const zoneEventsKeys = {
  all: (zoneId: string) => ['zone-events', zoneId] as const,
  registrations: (eventId: string) => ['zone-event-registrations', eventId] as const,
};

async function fetchZoneEvents(zoneId: string): Promise<ZoneEvent[]> {
  const { data: pages, error: pagesErr } = await supabase
    .from('pages')
    .select('id, title')
    .eq('organization_id', zoneId);

  if (pagesErr) throw pagesErr;
  if (!pages || pages.length === 0) return [];

  const pageIds = pages.map(p => p.id);
  const pageMap = new Map(pages.map(p => [p.id, p]));

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .in('page_id', pageIds)
    .order('start_at', { ascending: false });

  if (error) throw error;

  // Get registration counts
  const eventIds = (events || []).map(e => e.id);
  const regCounts: Record<string, number> = {};

  if (eventIds.length > 0) {
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('event_id')
      .in('event_id', eventIds)
      .in('status', ['confirmed', 'pending']);

    if (regs) {
      for (const r of regs) {
        regCounts[r.event_id] = (regCounts[r.event_id] || 0) + 1;
      }
    }
  }

  return (events || []).map(e => ({
    ...e,
    page_title: pageMap.get(e.page_id)?.title || '',
    registrations_count: regCounts[e.id] || 0,
  })) as ZoneEvent[];
}

async function fetchEventRegistrations(eventId: string): Promise<ZoneEventRegistration[]> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('id, event_id, attendee_name, attendee_email, attendee_phone, status, payment_status, paid_amount, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as ZoneEventRegistration[];
}

export function useZoneEvents(zoneId: string | null) {
  const safeZoneId = zoneId || '';

  const { data: events = [], isLoading: loading, refetch } = useQuery({
    queryKey: zoneEventsKeys.all(safeZoneId),
    queryFn: () => fetchZoneEvents(safeZoneId),
    enabled: !!safeZoneId,
    staleTime: 30_000,
  });

  return { events, loading, refetch };
}

export function useZoneEventRegistrations(eventId: string | null) {
  const { data: registrations = [], isLoading: loading } = useQuery({
    queryKey: zoneEventsKeys.registrations(eventId || ''),
    queryFn: () => fetchEventRegistrations(eventId!),
    enabled: !!eventId,
    staleTime: 30_000,
  });

  return { registrations, loading };
}

/**
 * Staff check-in service.
 * Lets an event organizer share a secret link so helpers on the door can scan
 * tickets without signing into the organizer's account.
 */
import { supabase } from '@/platform/supabase/client';

export interface CheckinEventContext {
  event: {
    id: string;
    title: string;
    startAt: string | null;
    timezone: string | null;
    locationValue: string | null;
    status: string | null;
  };
  stats: {
    total: number;
    checkedIn: number;
  };
}

export type CheckinContextResult =
  | { ok: true; context: CheckinEventContext }
  | { ok: false; code: 'invalid_token' | 'unknown' };

export type CheckinScanResult =
  | { ok: true; attendeeName: string | null; checkedIn: number }
  | {
      ok: false;
      code: 'invalid_token' | 'invalid_ticket' | 'not_found' | 'already_used' | 'cancelled' | 'unknown';
      attendeeName?: string | null;
      checkedInAt?: string | null;
    };

type RawContext = {
  ok?: boolean;
  code?: string;
  event?: {
    id?: string;
    title_i18n_json?: Record<string, string> | null;
    start_at?: string | null;
    timezone?: string | null;
    location_value?: string | null;
    status?: string | null;
  };
  stats?: { total?: number; checkedIn?: number };
};

type RawScan = {
  ok?: boolean;
  code?: string;
  attendeeName?: string | null;
  checkedIn?: number;
  checkedInAt?: string | null;
};

const pickTitle = (
  titles: Record<string, string> | null | undefined,
  language: string,
): string => titles?.[language] || titles?.ru || titles?.en || 'Event';

export async function fetchCheckinContext(
  token: string,
  language: string,
): Promise<CheckinContextResult> {
  const { data, error } = await supabase.rpc('get_event_checkin_context', { p_token: token });

  if (error) {
    return { ok: false, code: 'unknown' };
  }

  const raw = (data ?? {}) as RawContext;
  if (!raw.ok || !raw.event?.id) {
    return { ok: false, code: raw.code === 'invalid_token' ? 'invalid_token' : 'unknown' };
  }

  return {
    ok: true,
    context: {
      event: {
        id: raw.event.id,
        title: pickTitle(raw.event.title_i18n_json, language),
        startAt: raw.event.start_at ?? null,
        timezone: raw.event.timezone ?? null,
        locationValue: raw.event.location_value ?? null,
        status: raw.event.status ?? null,
      },
      stats: {
        total: raw.stats?.total ?? 0,
        checkedIn: raw.stats?.checkedIn ?? 0,
      },
    },
  };
}

export async function checkinTicketByToken(
  token: string,
  ticketCode: string,
): Promise<CheckinScanResult> {
  const { data, error } = await supabase.rpc('checkin_event_ticket_by_token', {
    p_token: token,
    p_ticket_code: ticketCode,
  });

  if (error) {
    return { ok: false, code: 'unknown' };
  }

  const raw = (data ?? {}) as RawScan;

  if (raw.ok) {
    return {
      ok: true,
      attendeeName: raw.attendeeName ?? null,
      checkedIn: raw.checkedIn ?? 0,
    };
  }

  const known = ['invalid_token', 'invalid_ticket', 'not_found', 'already_used', 'cancelled'] as const;
  const code = known.find((c) => c === raw.code) ?? 'unknown';

  return {
    ok: false,
    code,
    attendeeName: raw.attendeeName ?? null,
    checkedInAt: raw.checkedInAt ?? null,
  };
}

/** Owner-only: read the current staff link token for an event. */
export async function fetchEventCheckinToken(eventId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_event_checkin_token', { p_event_id: eventId });
  if (error) return null;
  return (data as string | null) ?? null;
}

/** Owner-only: issue a new token, invalidating any previously shared link. */
export async function rotateEventCheckinToken(eventId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('rotate_event_checkin_token', { p_event_id: eventId });
  if (error) return null;
  return (data as string | null) ?? null;
}

export function buildCheckinUrl(token: string, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/events/checkin/${token}`;
}

/**
 * Ticket QR codes may encode the raw code or a URL containing it.
 * Extract the trailing code so both shapes scan correctly.
 */
export function extractTicketCode(scanned: string): string {
  const trimmed = scanned.trim();
  if (!trimmed) return '';
  const fromUrl = trimmed.match(/([A-Za-z0-9-]{4,64})\s*$/);
  const candidate = fromUrl ? fromUrl[1] : trimmed;
  return candidate.toUpperCase();
}

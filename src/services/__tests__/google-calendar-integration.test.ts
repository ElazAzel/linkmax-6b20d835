import { describe, expect, it } from 'vitest';
import { mapGoogleCalendarStatus } from '@/services/google-calendar-integration';

describe('Google Calendar integration mapper', () => {
  it('maps a connected row', () => {
    expect(mapGoogleCalendarStatus({
      is_connected: true,
      updated_at: '2026-04-19T09:00:00Z',
    })).toEqual({
      isConnected: true,
      updatedAt: '2026-04-19T09:00:00Z',
    });
  });

  it('maps missing status as disconnected', () => {
    expect(mapGoogleCalendarStatus(null)).toEqual({
      isConnected: false,
      updatedAt: null,
    });
  });
});

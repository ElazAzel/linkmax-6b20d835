import { supabase } from '@/platform/supabase/client';

export interface GoogleCalendarIntegrationStatus {
  isConnected: boolean;
  updatedAt: string | null;
}

interface GoogleCalendarStatusRow {
  is_connected: boolean | null;
  updated_at: string | null;
}

interface GoogleCalendarAuthUrlResponse {
  auth_url?: string;
  error?: string;
}

interface GoogleCalendarActionResponse {
  success?: boolean;
  error?: string;
}

export function mapGoogleCalendarStatus(
  row: GoogleCalendarStatusRow | null
): GoogleCalendarIntegrationStatus {
  return {
    isConnected: Boolean(row?.is_connected),
    updatedAt: row?.updated_at ?? null,
  };
}

export async function loadGoogleCalendarStatus(): Promise<GoogleCalendarIntegrationStatus> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return mapGoogleCalendarStatus(null);
  }

  const { data, error } = await supabase
    .from('user_integrations_status')
    .select('is_connected, updated_at')
    .eq('user_id', user.id)
    .eq('provider', 'google_calendar')
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return mapGoogleCalendarStatus(data);
}

export async function getGoogleCalendarAuthUrl(redirectUrl: string): Promise<string> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error('No active session');
  }

  const { data, error } = await supabase.functions.invoke<GoogleCalendarAuthUrlResponse>(
    'google-calendar-sync',
    {
      body: {
        action: 'get_auth_url',
        payload: { redirect_url: redirectUrl },
      },
    }
  );

  if (error) {
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.auth_url) {
    throw new Error('Google Calendar not configured');
  }

  return data.auth_url;
}

export async function disconnectGoogleCalendar(): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error('No active session');
  }

  const { data, error } = await supabase.functions.invoke<GoogleCalendarActionResponse>(
    'google-calendar-sync',
    {
      body: {
        action: 'disconnect',
        payload: {},
      },
    }
  );

  if (error) {
    throw error;
  }

  if (data?.error) {
    throw new Error(data.error);
  }
}

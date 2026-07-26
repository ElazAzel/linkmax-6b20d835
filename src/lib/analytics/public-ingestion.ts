export interface PublicAnalyticsEvent {
  pageId?: string | null;
  blockId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}

interface SubmitOptions {
  keepalive?: boolean;
  requireAuthentication?: boolean;
}

const FUNCTION_NAME = 'track-analytics-event';
const FAILURE_COOLDOWN_MS = 5 * 60 * 1000;

let disabledUntil = 0;

/** Sends browser analytics through the server-side validation boundary. */
export async function submitPublicAnalyticsEvent(
  event: PublicAnalyticsEvent,
  options: SubmitOptions = {},
): Promise<void> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!baseUrl || !apiKey) return;
  if (Date.now() < disabledUntil) return;

  const headers: Record<string, string> = {
    apikey: apiKey,
    'Content-Type': 'application/json',
  };

  if (options.requireAuthentication) {
    const { supabase } = await import('@/platform/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      credentials: 'omit',
      keepalive: options.keepalive,
      headers,
      body: JSON.stringify(event),
    });
  } catch (error) {
    disabledUntil = Date.now() + FAILURE_COOLDOWN_MS;
    throw error;
  }

  if (!response.ok) {
    if (response.status === 404 || response.status === 503) {
      disabledUntil = Date.now() + FAILURE_COOLDOWN_MS;
    }
    throw new Error(`Analytics ingestion failed with status ${response.status}`);
  }
}

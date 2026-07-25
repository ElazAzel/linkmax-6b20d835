export interface PublicAnalyticsEvent {
  pageId?: string | null;
  blockId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}

interface SubmitOptions {
  keepalive?: boolean;
}

const FUNCTION_NAME = 'track-analytics-event';

/** Sends browser analytics through the server-side validation boundary. */
export async function submitPublicAnalyticsEvent(
  event: PublicAnalyticsEvent,
  options: SubmitOptions = {},
): Promise<void> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!baseUrl || !apiKey) return;

  const response = await fetch(`${baseUrl}/functions/v1/${FUNCTION_NAME}`, {
    method: 'POST',
    credentials: 'omit',
    keepalive: options.keepalive,
    headers: { apikey: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error(`Analytics ingestion failed with status ${response.status}`);
  }
}

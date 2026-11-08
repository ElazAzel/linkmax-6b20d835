import { storage } from '@/lib/storage';

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
/** Events that arrive together (a page view and its block impressions) share one request. */
const BATCH_DELAY_MS = 250;
const MAX_BATCH_EVENTS = 25;
// The function rejects bodies over 16 KB; leave room for headers and encoding.
const MAX_BATCH_BYTES = 12 * 1024;
const BATCH_UNSUPPORTED_KEY = 'lm-analytics-batch-unsupported';

let disabledUntil = 0;

type Pending = { event: PublicAnalyticsEvent; resolve: () => void; reject: (error: unknown) => void };
let queue: Pending[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;

let batchUnsupported = storage.session.get<boolean>(BATCH_UNSUPPORTED_KEY) === true;

function markBatchUnsupported() {
  batchUnsupported = true;
  storage.session.set(BATCH_UNSUPPORTED_KEY, true);
}

async function post(body: unknown, options: SubmitOptions): Promise<Response | null> {
  const baseUrl = import.meta.env.VITE_SUPABASE_URL;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !apiKey) return null;

  // The legacy publishable key is a JWT. Sending it as the bearer token, like
  // supabase.functions.invoke does, keeps anonymous events working even if the
  // function is deployed with gateway JWT verification on.
  const headers: Record<string, string> = {
    apikey: apiKey,
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (options.requireAuthentication) {
    const { supabase } = await import('@/platform/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  try {
    return await fetch(`${baseUrl}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      credentials: 'omit',
      keepalive: options.keepalive,
      headers,
      body: JSON.stringify(body),
    });
  } catch (error) {
    disabledUntil = Date.now() + FAILURE_COOLDOWN_MS;
    throw error;
  }
}

function failure(response: Response, options: SubmitOptions): Error {
  // Unavailable or rejected: back off instead of retrying every event.
  if ([401, 403, 404, 503].includes(response.status) && !options.requireAuthentication) {
    disabledUntil = Date.now() + FAILURE_COOLDOWN_MS;
  }
  return new Error(`Analytics ingestion failed with status ${response.status}`);
}

async function sendOne(event: PublicAnalyticsEvent, options: SubmitOptions): Promise<void> {
  const response = await post(event, options);
  if (response && !response.ok) throw failure(response, options);
}

async function sendBatch(batch: Pending[], keepalive: boolean) {
  const settleEach = async () => {
    for (const item of batch) {
      if (Date.now() < disabledUntil) { item.resolve(); continue; }
      await sendOne(item.event, { keepalive }).then(item.resolve, item.reject);
    }
  };
  if (batch.length === 1 || batchUnsupported) return settleEach();

  let response: Response | null;
  try {
    response = await post({ events: batch.map((item) => item.event) }, { keepalive });
  } catch (error) {
    batch.forEach((item) => item.reject(error));
    return;
  }
  if (!response || response.ok) {
    batch.forEach((item) => item.resolve());
    return;
  }
  // A function deployed before batching answers 400 to the unknown shape:
  // remember that for the session and deliver these events one by one.
  if (response.status === 400) {
    markBatchUnsupported();
    return settleEach();
  }
  const error = failure(response, {});
  batch.forEach((item) => item.reject(error));
}

/** Splits the queue so every request stays under the event and size limits. */
function takeBatches(items: Pending[]): Pending[][] {
  const batches: Pending[][] = [];
  let current: Pending[] = [];
  let bytes = 0;
  for (const item of items) {
    const size = JSON.stringify(item.event).length;
    if (current.length && (current.length >= MAX_BATCH_EVENTS || bytes + size > MAX_BATCH_BYTES)) {
      batches.push(current);
      current = [];
      bytes = 0;
    }
    current.push(item);
    bytes += size;
  }
  if (current.length) batches.push(current);
  return batches;
}

function flush(keepalive = false) {
  if (timer) { clearTimeout(timer); timer = null; }
  const items = queue;
  queue = [];
  for (const batch of takeBatches(items)) void sendBatch(batch, keepalive);
}

function listenForPageHide() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  // Events still waiting for the batch timer must not die with the tab.
  window.addEventListener('pagehide', () => flush(true));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush(true);
  });
}

/** Sends browser analytics through the server-side validation boundary. */
export function submitPublicAnalyticsEvent(
  event: PublicAnalyticsEvent,
  options: SubmitOptions = {},
): Promise<void> {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) return Promise.resolve();
  if (Date.now() < disabledUntil) return Promise.resolve();
  // Editor events carry the user's session and are checked one by one.
  if (options.requireAuthentication) return sendOne(event, options);

  listenForPageHide();
  return new Promise<void>((resolve, reject) => {
    queue.push({ event, resolve, reject });
    if (options.keepalive) flush(true);
    else if (!timer) timer = setTimeout(() => flush(false), BATCH_DELAY_MS);
  });
}

import {
  REVENUE_EVENTS,
  isAuthoritativeRevenueEvent,
  type RevenueEventName,
} from '@/domain/revenue/events';

type PostHogClient = typeof import('posthog-js').default;

const CONSENT_KEY = 'lnkmx_cookie_consent';

export const POSTHOG_KEY = import.meta.env.VITE_LOVABLE_CONNECTOR_POSTHOG_API_KEY || '';
const POSTHOG_REGION = import.meta.env.VITE_LOVABLE_CONNECTOR_POSTHOG_REGION || 'us';
export const POSTHOG_HOST = POSTHOG_REGION === 'eu'
  ? 'https://eu.i.posthog.com'
  : 'https://us.i.posthog.com';

let posthogClient: PostHogClient | null = null;
let posthogLoad: Promise<PostHogClient | null> | null = null;
let posthogDisabled = false;

function hasAcceptedThirdPartyAnalytics(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}

function shouldUsePostHog(): boolean {
  if (typeof window === 'undefined') return false;
  if (posthogDisabled || !POSTHOG_KEY) return false;
  if (!hasAcceptedThirdPartyAnalytics()) return false;
  return true;
}

export function initPostHog(): Promise<PostHogClient | null> {
  if (!shouldUsePostHog()) return Promise.resolve(null);
  if (posthogClient) return Promise.resolve(posthogClient);
  if (posthogLoad) return posthogLoad;

  posthogLoad = import('posthog-js')
    .then(({ default: client }) => {
      if (!shouldUsePostHog()) return null;

      const existing = (window as typeof window & { posthog?: { __loaded?: boolean } }).posthog;
      const loaded = (client as unknown as { __loaded?: boolean }).__loaded;
      if (!existing?.__loaded && !loaded) {
        client.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          person_profiles: 'identified_only',
          capture_pageview: false,
          capture_pageleave: false,
          autocapture: false,
          disable_session_recording: true,
          advanced_disable_flags: true,
        });
      }

      posthogClient = client;
      return client;
    })
    .catch(() => {
      posthogDisabled = true;
      posthogLoad = null;
      return null;
    });

  return posthogLoad;
}

function withPostHog(callback: (client: PostHogClient) => void): void {
  if (!shouldUsePostHog()) return;
  void initPostHog().then((client) => {
    if (!client) return;
    try {
      callback(client);
    } catch {
      posthogDisabled = true;
    }
  });
}

export const posthog = {
  capture(event: string, properties?: Record<string, unknown>): void {
    withPostHog((client) => client.capture(event, properties));
  },
  identify(distinctId: string, properties?: Record<string, unknown>): void {
    withPostHog((client) => client.identify(distinctId, properties));
  },
  reset(): void {
    if (posthogClient) {
      posthogClient.reset();
    }
  },
  has_opted_out_capturing(): boolean {
    return !shouldUsePostHog() || Boolean(posthogClient?.has_opted_out_capturing());
  },
};

const REVENUE_PROPERTY_KEY_MAP = {
  pageId: 'page_id',
  blockId: 'block_id',
  serviceOfferingId: 'service_offering_id',
  bookingId: 'booking_id',
  visitorId: 'visitor_id',
  sessionId: 'session_id',
  actorType: 'actor_type',
  source: 'source',
  medium: 'medium',
  campaign: 'campaign',
  content: 'content',
  referrerHost: 'referrer_host',
  landingPath: 'landing_path',
  action: 'action',
  step: 'step',
  durationMinutes: 'duration_minutes',
  method: 'method',
  hasPrepayment: 'has_prepayment',
} as const;

type SafeRevenueProperty = string | number | boolean | null;

export interface PreparedClientRevenueEvent {
  eventName: RevenueEventName;
  properties: Record<string, SafeRevenueProperty>;
}

const REVENUE_EVENT_NAMES = new Set<string>(Object.values(REVENUE_EVENTS));

export function prepareClientRevenueEvent(
  eventName: string,
  properties: Record<string, unknown>,
): PreparedClientRevenueEvent | null {
  if (!REVENUE_EVENT_NAMES.has(eventName) || isAuthoritativeRevenueEvent(eventName)) {
    return null;
  }

  const safeProperties: Record<string, SafeRevenueProperty> = { taxonomy_version: 2 };

  for (const [inputKey, outputKey] of Object.entries(REVENUE_PROPERTY_KEY_MAP)) {
    const value = properties[inputKey];
    if (value === null || typeof value === 'number' || typeof value === 'boolean') {
      safeProperties[outputKey] = value;
    } else if (typeof value === 'string' && value.length > 0) {
      safeProperties[outputKey] = value.slice(0, inputKey === 'landingPath' ? 500 : 200);
    }
  }

  return {
    eventName: eventName as RevenueEventName,
    properties: safeProperties,
  };
}

export function captureRevenueEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
): boolean {
  const event = prepareClientRevenueEvent(eventName, properties);
  if (!event) return false;

  posthog.capture(event.eventName, event.properties);
  return true;
}

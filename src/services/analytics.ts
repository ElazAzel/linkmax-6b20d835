/**
 * Analytics Service
 * Handles all analytics tracking operations
 * @version 2.1 - Fixed UUID validation for block_id
 */

import { supabase } from '@/platform/supabase/client';
import type { Json } from '@/platform/supabase/types';
import { logger } from '@/lib/utils/logger';
import { session, storage } from '@/lib/storage';
import { trackViewContent, trackClickLink } from '@/lib/analytics';

// ============================================
// Types
// ============================================

export type AnalyticsEventType = 'view' | 'click' | 'share';

export interface TrackEventOptions {
  pageId: string;
  eventType: AnalyticsEventType;
  blockId?: string;
  experimentId?: string;
  variantLabel?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsEvent {
  id: string;
  page_id: string;
  block_id: string | null;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Global analytics feature flag.
 */
const ANALYTICS_ENABLED = true; // explicitly enable analytics for testing + prod

// ============================================
// Geo-location Cache
// ============================================

interface GeoInfo {
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
}

// Timezone → country mapping (covers 95%+ of real traffic)
const TZ_COUNTRY_MAP: Record<string, { code: string; name: string }> = {
  'Asia/Almaty': { code: 'KZ', name: 'Kazakhstan' },
  'Asia/Aqtau': { code: 'KZ', name: 'Kazakhstan' },
  'Asia/Aqtobe': { code: 'KZ', name: 'Kazakhstan' },
  'Asia/Atyrau': { code: 'KZ', name: 'Kazakhstan' },
  'Asia/Oral': { code: 'KZ', name: 'Kazakhstan' },
  'Asia/Qostanay': { code: 'KZ', name: 'Kazakhstan' },
  'Asia/Qyzylorda': { code: 'KZ', name: 'Kazakhstan' },
  'Europe/Moscow': { code: 'RU', name: 'Russia' },
  'Europe/Kaliningrad': { code: 'RU', name: 'Russia' },
  'Asia/Yekaterinburg': { code: 'RU', name: 'Russia' },
  'Asia/Novosibirsk': { code: 'RU', name: 'Russia' },
  'Asia/Krasnoyarsk': { code: 'RU', name: 'Russia' },
  'Asia/Irkutsk': { code: 'RU', name: 'Russia' },
  'Asia/Vladivostok': { code: 'RU', name: 'Russia' },
  'Asia/Kamchatka': { code: 'RU', name: 'Russia' },
  'Europe/Samara': { code: 'RU', name: 'Russia' },
  'Europe/Volgograd': { code: 'RU', name: 'Russia' },
  'Europe/Saratov': { code: 'RU', name: 'Russia' },
  'Europe/Kirov': { code: 'RU', name: 'Russia' },
  'Europe/Astrakhan': { code: 'RU', name: 'Russia' },
  'Europe/Ulyanovsk': { code: 'RU', name: 'Russia' },
  'Asia/Omsk': { code: 'RU', name: 'Russia' },
  'Asia/Barnaul': { code: 'RU', name: 'Russia' },
  'Asia/Tomsk': { code: 'RU', name: 'Russia' },
  'Asia/Novokuznetsk': { code: 'RU', name: 'Russia' },
  'Asia/Chita': { code: 'RU', name: 'Russia' },
  'Asia/Yakutsk': { code: 'RU', name: 'Russia' },
  'Asia/Magadan': { code: 'RU', name: 'Russia' },
  'Asia/Sakhalin': { code: 'RU', name: 'Russia' },
  'Asia/Srednekolymsk': { code: 'RU', name: 'Russia' },
  'Asia/Anadyr': { code: 'RU', name: 'Russia' },
  'Europe/Kyiv': { code: 'UA', name: 'Ukraine' },
  'Europe/Minsk': { code: 'BY', name: 'Belarus' },
  'Asia/Tashkent': { code: 'UZ', name: 'Uzbekistan' },
  'Asia/Samarkand': { code: 'UZ', name: 'Uzbekistan' },
  'Asia/Bishkek': { code: 'KG', name: 'Kyrgyzstan' },
  'Asia/Dushanbe': { code: 'TJ', name: 'Tajikistan' },
  'Asia/Ashgabat': { code: 'TM', name: 'Turkmenistan' },
  'Asia/Baku': { code: 'AZ', name: 'Azerbaijan' },
  'Asia/Tbilisi': { code: 'GE', name: 'Georgia' },
  'Asia/Yerevan': { code: 'AM', name: 'Armenia' },
  'Europe/Istanbul': { code: 'TR', name: 'Turkey' },
  'Asia/Dubai': { code: 'AE', name: 'UAE' },
  'America/New_York': { code: 'US', name: 'USA' },
  'America/Chicago': { code: 'US', name: 'USA' },
  'America/Denver': { code: 'US', name: 'USA' },
  'America/Los_Angeles': { code: 'US', name: 'USA' },
  'Europe/London': { code: 'GB', name: 'United Kingdom' },
  'Europe/Berlin': { code: 'DE', name: 'Germany' },
  'Europe/Paris': { code: 'FR', name: 'France' },
  'Europe/Warsaw': { code: 'PL', name: 'Poland' },
  'Asia/Shanghai': { code: 'CN', name: 'China' },
  'Asia/Tokyo': { code: 'JP', name: 'Japan' },
  'Asia/Seoul': { code: 'KR', name: 'South Korea' },
  'Asia/Kolkata': { code: 'IN', name: 'India' },
};

let _geoCache: GeoInfo | null = null;
let _geoFetchPromise: Promise<GeoInfo | null> | null = null;

/**
 * Get geo from timezone (instant, no network) as primary method,
 * then try IP APIs as fallback
 */
function getGeoFromTimezone(): GeoInfo | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const match = TZ_COUNTRY_MAP[tz];
    if (match) {
      return { country: match.name, countryCode: match.code };
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Fetch geo info — timezone first (instant), then IP API fallback (cached per session)
 */
async function getGeoInfo(): Promise<GeoInfo | null> {
  if (_geoCache) return _geoCache;

  // Try timezone first — instant, no network
  const tzGeo = getGeoFromTimezone();
  if (tzGeo) {
    _geoCache = tzGeo;
    return _geoCache;
  }

  if (_geoFetchPromise) return _geoFetchPromise;

  _geoFetchPromise = (async () => {
    const apis: Array<{
      url: string;
      headers?: Record<string, string>;
      parse: (d: any) => GeoInfo;
    }> = [
      {
        url: 'https://ipwho.is/',
        parse: (d: any) => ({
          country: d.country || 'Unknown',
          countryCode: d.country_code || 'XX',
          city: d.city || undefined,
          region: d.region || undefined,
        }),
      },
      {
        url: 'https://freeipapi.com/api/json',
        parse: (d: any) => ({
          country: d.countryName || 'Unknown',
          countryCode: d.countryCode || 'XX',
          city: d.cityName || undefined,
          region: d.regionName || undefined,
        }),
      },
    ];

    for (const api of apis) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(api.url, {
          signal: controller.signal,
          headers: api.headers,
        }).catch(() => null);

        clearTimeout(timeout);
        if (!response || !response.ok) continue;
        
        const data = await response.json();
        const parsed = api.parse(data);
        
        if (parsed.countryCode && parsed.countryCode !== 'XX') {
          _geoCache = parsed;
          return _geoCache;
        }
      } catch {
        continue;
      }
    }
    return null;
  })();

  return _geoFetchPromise;
}

// ============================================
// Session Duration Tracking
// ============================================

let _pageLoadTime = Date.now();
let _sessionDurationTrackedPageId: string | null = null;
let _sessionDurationCleanup: (() => void) | null = null;
let _sessionDurationSentKey: string | null = null;

/**
 * Get time spent on page in seconds
 */
function getTimeOnPage(): number {
  return Math.round((Date.now() - _pageLoadTime) / 1000);
}

/**
 * Initialize session duration tracking — sends duration on page hide/unload
 */
export function initSessionDurationTracking(pageId: string) {
  const analyticsSession = getOrCreateSession();
  const trackingKey = `${pageId}:${analyticsSession.id}`;

  if (_sessionDurationTrackedPageId === pageId && _sessionDurationSentKey !== trackingKey) return;

  _sessionDurationCleanup?.();
  _sessionDurationTrackedPageId = pageId;
  _sessionDurationSentKey = null;
  _pageLoadTime = Date.now();

  const sendDuration = () => {
    const duration = getTimeOnPage();
    if (duration < 2) return; // Skip very short visits
    if (_sessionDurationSentKey === trackingKey) return;
    _sessionDurationSentKey = trackingKey;

    const payload = JSON.stringify({
      page_id: pageId,
      event_type: 'session_end',
      metadata: {
        sessionDuration: duration,
        visitorId: analyticsSession.visitorId,
        sessionId: analyticsSession.id,
      },
    });

    const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics`;

    if (typeof fetch === 'function') {
      void fetch(url, {
        method: 'POST',
        body: payload,
        keepalive: true,
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
      }).catch(() => undefined);
      return;
    }

    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${url}?apikey=${apiKey}`, new Blob([payload], { type: 'application/json' }));
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      sendDuration();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', sendDuration);
  _sessionDurationCleanup = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', sendDuration);
  };
}

/**
 * Get visitor fingerprint for unique visitor tracking
 * Uses a combination of available browser data
 */
function getVisitorFingerprint(): string {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get referrer information
 */
function getReferrerInfo(): { source: string; medium: string } {
  const referrer = document.referrer;
  if (!referrer) {
    return { source: 'direct', medium: 'none' };
  }

  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();

    // Social media
    if (hostname.includes('instagram')) return { source: 'instagram', medium: 'social' };
    if (hostname.includes('facebook') || hostname.includes('fb.')) return { source: 'facebook', medium: 'social' };
    if (hostname.includes('twitter') || hostname.includes('x.com')) return { source: 'twitter', medium: 'social' };
    if (hostname.includes('tiktok')) return { source: 'tiktok', medium: 'social' };
    if (hostname.includes('linkedin')) return { source: 'linkedin', medium: 'social' };
    if (hostname.includes('youtube')) return { source: 'youtube', medium: 'social' };
    if (hostname.includes('telegram')) return { source: 'telegram', medium: 'social' };
    if (hostname.includes('whatsapp')) return { source: 'whatsapp', medium: 'social' };
    if (hostname.includes('vk.com')) return { source: 'vkontakte', medium: 'social' };

    // Search engines
    if (hostname.includes('google')) return { source: 'google', medium: 'organic' };
    if (hostname.includes('yandex')) return { source: 'yandex', medium: 'organic' };
    if (hostname.includes('bing')) return { source: 'bing', medium: 'organic' };

    return { source: hostname, medium: 'referral' };
  } catch {
    return { source: 'unknown', medium: 'unknown' };
  }
}

/**
 * Get device type from user agent
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Get UTM parameters from URL
 */
function getUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};

  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
    const value = params.get(key);
    if (value) utmParams[key] = value;
  });

  return utmParams;
}

// ============================================
// Session Management
// ============================================

const VISITOR_KEY = 'linkmax_analytics_visitor';
const SESSION_KEY = 'linkmax_analytics_session';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

interface Session {
  id: string;
  startedAt: number;
  visitorId: string;
}

export function getVisitorId(): string {
  try {
    const stored = storage.get<string>(VISITOR_KEY);
    if (stored) return stored;
  } catch {
    // Ignore storage errors
  }

  const visitorId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    storage.set(VISITOR_KEY, visitorId);
  } catch {
    // Ignore storage errors
  }
  return visitorId;
}

function getOrCreateSession(): Session {
  try {
    const stored = session.get<Session>(SESSION_KEY);
    if (stored) {
      // Check if session is still valid
      if (Date.now() - stored.startedAt < SESSION_DURATION) {
        return stored;
      }
    }
  } catch {
    // Ignore storage errors
  }

  // Create new session
  const sessionData: Session = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    startedAt: Date.now(),
    visitorId: getVisitorId(),
  };

  try {
    session.set(SESSION_KEY, sessionData);
  } catch {
    // Ignore storage errors
  }

  return sessionData;
}

// ============================================
// Tracking Functions
// ============================================

/**
 * Track an analytics event
 * This is the main tracking function used throughout the app
 */
export async function trackEvent({
  pageId,
  eventType,
  blockId,
  experimentId,
  variantLabel,
  metadata = {},
}: TrackEventOptions): Promise<void> {
  if (!ANALYTICS_ENABLED) {
    return;
  }
  try {
    const session = getOrCreateSession();
    const referrer = getReferrerInfo();
    const utmParams = getUtmParams();

    // Fetch geo info (non-blocking, cached)
    const geo = await getGeoInfo().catch(() => null);

    const enrichedMetadata = {
      ...metadata,
      ...utmParams,
      experimentId,
      variantLabel,
      visitorId: session.visitorId,
      sessionId: session.id,
      device: getDeviceType(),
      source: referrer.source,
      medium: referrer.medium,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenWidth: screen.width,
      screenHeight: screen.height,
      timestamp: new Date().toISOString(),
      // Geo enrichment
      country: geo?.countryCode || undefined,
      countryName: geo?.country || undefined,
      city: geo?.city || undefined,
      region: geo?.region || undefined,
    };

    await supabase.from('analytics').insert({
      page_id: pageId,
      block_id: blockId || null,
      event_type: eventType,
      metadata: enrichedMetadata as Json,
    });

    // Note: third-party pixel forwarding is handled client-side via
    // `src/lib/analytics.ts` (sendBeacon → pixel-proxy with the proper
    // { pageId, event, eventData } payload). Avoid duplicating it here.
  } catch (error) {
    // Silent fail for analytics - don't break user experience
    logger.debug('Analytics tracking failed', { data: error });
  }
}

/**
 * Log a chat query for Expert Insights
 * Stores the question, whether it was answered, and relevant metadata.
 */
export async function logChatQuery(
  pageId: string,
  queryText: string,
  hasResponse: boolean,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!ANALYTICS_ENABLED) return;

  try {
    const session_data = getOrCreateSession();
    const geo = await getGeoInfo().catch(() => null);

    // Using 'as any' until supabase types are re-generated with expert_queries table
    await (supabase.from('expert_queries' as any) as any).insert({
      page_id: pageId,
      query_text: queryText.substring(0, 500), // Cap length
      has_response: hasResponse,
      metadata: {
        ...metadata,
        visitorId: session_data.visitorId,
        sessionId: session_data.id,
        device: getDeviceType(),
        country: geo?.countryCode || undefined,
        city: geo?.city || undefined,
        timestamp: new Date().toISOString(),
      } as Json,
    });
  } catch (err) {
    // Silent fail for analytics
    logger.debug('Expert Insights logging failed', { data: err });
  }
}

/**
 * Track page view event
 */
export async function trackPageView(pageId: string): Promise<void> {
  // Also increment the view count in the pages table
  try {
    // Get slug from pageId to increment view count
    const { data } = await supabase
      .from('pages')
      .select('slug')
      .eq('id', pageId)
      .maybeSingle();

    if (data?.slug) {
      await supabase.rpc('increment_view_count', { page_slug: data.slug });
    }
  } catch {
    // Silent fail
  }

  return trackEvent({
    pageId,
    eventType: 'view',
  });
}

/**
 * Track block click event
 */
export async function trackBlockClick(
  pageId: string,
  blockId: string,
  blockType?: string,
  blockTitle?: string,
  experimentId?: string,
  variantLabel?: string
): Promise<void> {
  // Increment click count in blocks table
  // blockId is a content-level ID (e.g. "profile-1"), not a DB UUID.
  // We need to look up the real DB UUID to increment clicks.
  if (blockId && pageId) {
    try {
      // Find the actual DB block by matching stable content id.
      // Fallback by type was producing incorrect attribution when multiple blocks shared a type.
      const { data: blockRows } = await supabase
        .from('blocks')
        .select('id')
        .eq('page_id', pageId)
        .eq('content->>id', blockId)
        .limit(2);

      if (blockRows && blockRows.length === 1) {
        await supabase.rpc('increment_block_clicks', { block_uuid: blockRows[0].id });
      }
    } catch {
      // Silent fail
    }
  }

  return trackEvent({
    pageId,
    eventType: 'click',
    // Don't pass blockId to block_id column — it's a content ID, not a DB UUID
    // Store it in metadata instead
    experimentId,
    variantLabel,
    metadata: {
      blockId,
      blockType,
      blockTitle,
    },
  });
}

/**
 * Track block view event (Impression)
 * Crucial for A/B testing conversion rate calculation
 */
export async function trackBlockView(
  pageId: string,
  blockId: string,
  blockType?: string,
  blockTitle?: string,
  experimentId?: string,
  variantLabel?: string
): Promise<void> {
  if (!pageId || !blockId) return;

  return trackEvent({
    pageId,
    eventType: 'view',
    experimentId,
    variantLabel,
    metadata: {
      blockId,
      blockType,
      blockTitle,
      isBlockImpression: true,
    },
  });
}

/**
 * Track share event
 */
export async function trackShare(pageId: string, method?: string): Promise<void> {
  return trackEvent({
    pageId,
    eventType: 'share',
    metadata: {
      method: method || 'unknown',
    },
  });
}

// ============================================
// Analytics Data Fetching
// ============================================

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  totalShares: number;
  uniqueVisitors: number;
  avgViewsPerDay: number;
  viewsChange: number;
  clicksChange: number;
  topBlocks: BlockAnalytics[];
  dailyData: TimeSeriesData[];
  weeklyData: TimeSeriesData[];
  monthlyData: TimeSeriesData[];
  trafficSources: TrafficSource[];
  deviceBreakdown: DeviceBreakdown;
}

export interface BlockAnalytics {
  blockId: string;
  blockType: string;
  blockTitle: string;
  clicks: number;
  ctr: number;
}

export interface TimeSeriesData {
  date: string;
  views: number;
  clicks: number;
  shares: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  count: number;
  percentage: number;
}

export interface DeviceBreakdown {
  mobile: number;
  tablet: number;
  desktop: number;
}

/**
 * Fetch analytics data for a page
 */
export async function fetchPageAnalytics(
  pageId: string,
  startDate: Date,
  endDate: Date
): Promise<AnalyticsEvent[]> {
  const { data, error } = await supabase
    .from('analytics')
    .select('*')
    .eq('page_id', pageId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('Error fetching analytics', error, { context: 'analytics' });
    return [];
  }

  return (data || []) as AnalyticsEvent[];
}

/**
 * Analytics Service
 * Handles all analytics tracking operations
 * @version 2.1 - Fixed UUID validation for block_id
 */

import { supabase } from '@/platform/supabase/client';
import type { Json } from '@/platform/supabase/types';
import { logger } from '@/lib/utils/logger';
import { session } from '@/lib/storage';

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
 * We полностью отключаем клиентскую аналитику в dev‑режиме,
 * чтобы избежать 401/403 в локальной среде без настроенных политик.
 */
const ANALYTICS_ENABLED = !import.meta.env.DEV;

// ============================================
// Geo-location Cache
// ============================================

interface GeoInfo {
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
}

let _geoCache: GeoInfo | null = null;
let _geoFetchPromise: Promise<GeoInfo | null> | null = null;

/**
 * Fetch geo info from a free IP geolocation API (cached per session)
 */
async function getGeoInfo(): Promise<GeoInfo | null> {
  if (_geoCache) return _geoCache;
  if (_geoFetchPromise) return _geoFetchPromise;

  _geoFetchPromise = (async () => {
    try {
      // Use multiple fallback APIs for reliability
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch('https://ipapi.co/json/', {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) return null;

      const data = await response.json();
      _geoCache = {
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || 'XX',
        city: data.city || undefined,
        region: data.region || undefined,
      };
      return _geoCache;
    } catch {
      // Try fallback
      try {
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 3000);
        const resp2 = await fetch('https://ip.guide/', {
          headers: { Accept: 'application/json' },
          signal: controller2.signal,
        });
        clearTimeout(timeout2);
        if (!resp2.ok) return null;
        const d2 = await resp2.json();
        _geoCache = {
          country: d2.location?.country || 'Unknown',
          countryCode: d2.location?.country_code || 'XX',
          city: d2.location?.city || undefined,
        };
        return _geoCache;
      } catch {
        return null;
      }
    }
  })();

  return _geoFetchPromise;
}

// ============================================
// Session Duration Tracking
// ============================================

let _pageLoadTime = Date.now();
let _sessionDurationTracked = false;

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
  if (_sessionDurationTracked) return;
  _sessionDurationTracked = true;
  _pageLoadTime = Date.now();

  const sendDuration = () => {
    const duration = getTimeOnPage();
    if (duration < 2) return; // Skip very short visits

    const session = getOrCreateSession();
    const payload = JSON.stringify({
      page_id: pageId,
      event_type: 'session_end',
      metadata: {
        sessionDuration: duration,
        visitorId: session.visitorId,
        sessionId: session.id,
      },
    });

    // Use sendBeacon for reliable delivery on page unload
    if (navigator.sendBeacon) {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics`;
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    }
  };

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      sendDuration();
    }
  });

  window.addEventListener('pagehide', sendDuration);
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

const SESSION_KEY = 'linkmax_analytics_session';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

interface Session {
  id: string;
  startedAt: number;
  visitorId: string;
}

export function getVisitorId(): string {
  return getOrCreateSession().visitorId;
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
    visitorId: getVisitorFingerprint(),
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
  } catch (error) {
    // Silent fail for analytics - don't break user experience
    logger.debug('Analytics tracking failed', { data: error });
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
  if (blockId) {
    try {
      await supabase.rpc('increment_block_clicks', { block_uuid: blockId } as any);
    } catch {
      // Silent fail
    }
  }

  return trackEvent({
    pageId,
    eventType: 'click',
    blockId,
    experimentId,
    variantLabel,
    metadata: {
      blockType,
      blockTitle,
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

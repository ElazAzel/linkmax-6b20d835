/**
 * Analytics Service
 * Handles all analytics tracking operations
 * @version 2.1 - Fixed UUID validation for block_id
 */

import { supabase } from '@/platform/supabase/client';
import type { Json } from '@/platform/supabase/types';
import { logger } from '@/lib/logger';

// ============================================
// Types
// ============================================

export type AnalyticsEventType = 'view' | 'click' | 'share';

export interface TrackEventOptions {
  pageId: string;
  eventType: AnalyticsEventType;
  blockId?: string;
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

function getOrCreateSession(): Session {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      const session = JSON.parse(stored) as Session;
      // Check if session is still valid
      if (Date.now() - session.startedAt < SESSION_DURATION) {
        return session;
      }
    }
  } catch {
    // Ignore storage errors
  }

  // Create new session
  const session: Session = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
    startedAt: Date.now(),
    visitorId: getVisitorFingerprint(),
  };

  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors
  }

  return session;
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
  metadata = {},
}: TrackEventOptions): Promise<void> {
  try {
    const session = getOrCreateSession();
    const referrer = getReferrerInfo();
    const utmParams = getUtmParams();

    // Validate blockId is a proper UUID before using it as foreign key
    const isValidUuid = blockId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blockId);

    const enrichedMetadata = {
      ...metadata,
      ...utmParams,
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
      // Store non-UUID blockId in metadata if present
      ...(blockId && !isValidUuid ? { blockIdRaw: blockId } : {}),
    };

    await supabase.from('analytics').insert({
      page_id: pageId,
      block_id: isValidUuid ? blockId : null,
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
  blockTitle?: string
): Promise<void> {
  // Validate blockId is a proper UUID before calling RPC
  const isValidUuid = blockId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blockId);

  // Increment click count in blocks table - only if valid UUID
  if (isValidUuid) {
    try {
      await supabase.rpc('increment_block_clicks', { block_uuid: blockId });
    } catch {
      // Silent fail
    }
  }

  return trackEvent({
    pageId,
    eventType: 'click',
    blockId,
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

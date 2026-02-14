/**
 * Supabase Analytics Repository - Implementation of IAnalyticsRepository
 * Infrastructure layer - handles actual data access
 */

import { supabase } from '@/integrations/supabase/client';
import { success, failure, tryCatchAsync, type Result } from '@/domain/value-objects/Result';
import type {
  IAnalyticsRepository,
  TrackEventDTO,
  FetchAnalyticsDTO,
  AnalyticsEvent,
  AnalyticsSummary,
} from '../interfaces/IAnalyticsRepository';
import type { Json } from '@/integrations/supabase/types';

// ============= Helpers =============

function getVisitorFingerprint(): string {
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');
  
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getReferrerInfo(): { source: string; medium: string } {
  const referrer = document.referrer;
  if (!referrer) {
    return { source: 'direct', medium: 'none' };
  }
  
  try {
    const url = new URL(referrer);
    const hostname = url.hostname.toLowerCase();
    
    if (hostname.includes('instagram')) return { source: 'instagram', medium: 'social' };
    if (hostname.includes('facebook') || hostname.includes('fb.')) return { source: 'facebook', medium: 'social' };
    if (hostname.includes('twitter') || hostname.includes('x.com')) return { source: 'twitter', medium: 'social' };
    if (hostname.includes('tiktok')) return { source: 'tiktok', medium: 'social' };
    if (hostname.includes('linkedin')) return { source: 'linkedin', medium: 'social' };
    if (hostname.includes('youtube')) return { source: 'youtube', medium: 'social' };
    if (hostname.includes('telegram')) return { source: 'telegram', medium: 'social' };
    if (hostname.includes('whatsapp')) return { source: 'whatsapp', medium: 'social' };
    if (hostname.includes('vk.com')) return { source: 'vkontakte', medium: 'social' };
    if (hostname.includes('google')) return { source: 'google', medium: 'organic' };
    if (hostname.includes('yandex')) return { source: 'yandex', medium: 'organic' };
    if (hostname.includes('bing')) return { source: 'bing', medium: 'organic' };
    
    return { source: hostname, medium: 'referral' };
  } catch {
    return { source: 'unknown', medium: 'unknown' };
  }
}

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

function getUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};
  
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(key => {
    const value = params.get(key);
    if (value) utmParams[key] = value;
  });
  
  return utmParams;
}

const SESSION_KEY = 'linkmax_analytics_session';
const SESSION_DURATION = 30 * 60 * 1000;

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
      if (Date.now() - session.startedAt < SESSION_DURATION) {
        return session;
      }
    }
  } catch {
    // Ignore storage errors
  }
  
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

// ============= Implementation =============

export class SupabaseAnalyticsRepository implements IAnalyticsRepository {
  async trackEvent(dto: TrackEventDTO): Promise<Result<void, Error>> {
    return tryCatchAsync(async () => {
      const { pageId, eventType, blockId, metadata = {} } = dto;
      
      const session = getOrCreateSession();
      const referrer = getReferrerInfo();
      const utmParams = getUtmParams();
      
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
      };

      await supabase.from('analytics').insert({
        page_id: pageId,
        block_id: blockId || null,
        event_type: eventType,
        metadata: enrichedMetadata as Json,
      });
    });
  }

  async trackPageView(pageId: string): Promise<Result<void, Error>> {
    return tryCatchAsync(async () => {
      // Get slug to increment view count
      const { data } = await supabase
        .from('pages')
        .select('slug')
        .eq('id', pageId)
        .maybeSingle();
      
      if (data?.slug) {
        await supabase.rpc('increment_view_count', { page_slug: data.slug });
      }
      
      await this.trackEvent({ pageId, eventType: 'view' });
    });
  }

  async trackBlockClick(
    pageId: string,
    blockId: string,
    blockType?: string,
    blockTitle?: string
  ): Promise<Result<void, Error>> {
    return tryCatchAsync(async () => {
      await supabase.rpc('increment_block_clicks', { block_uuid: blockId });
      
      await this.trackEvent({
        pageId,
        eventType: 'click',
        blockId,
        metadata: { blockType, blockTitle },
      });
    });
  }

  async trackShare(pageId: string, method?: string): Promise<Result<void, Error>> {
    return this.trackEvent({
      pageId,
      eventType: 'share',
      metadata: { method: method || 'unknown' },
    });
  }

  async fetchEvents(dto: FetchAnalyticsDTO): Promise<Result<AnalyticsEvent[], Error>> {
    return tryCatchAsync(async () => {
      const { pageId, startDate, endDate } = dto;

      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('page_id', pageId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []).map(row => ({
        id: row.id,
        pageId: row.page_id || '',
        blockId: row.block_id,
        eventType: row.event_type as AnalyticsEvent['eventType'],
        metadata: (row.metadata as Record<string, unknown>) || {},
        createdAt: row.created_at || '',
      }));
    });
  }

  async getSummary(dto: FetchAnalyticsDTO): Promise<Result<AnalyticsSummary, Error>> {
    const eventsResult = await this.fetchEvents(dto);
    
    if (!eventsResult.success) {
      return failure((eventsResult as { success: false; error: Error }).error);
    }

    const events = (eventsResult as { success: true; data: AnalyticsEvent[] }).data;
    const uniqueVisitors = new Set(
      events.map(e => (e.metadata as Record<string, unknown>).visitorId as string)
    ).size;

    return success({
      totalViews: events.filter(e => e.eventType === 'view').length,
      totalClicks: events.filter(e => e.eventType === 'click').length,
      totalShares: events.filter(e => e.eventType === 'share').length,
      uniqueVisitors,
    });
  }
}

// ============= Singleton Instance =============

let analyticsRepositoryInstance: SupabaseAnalyticsRepository | null = null;

export function getAnalyticsRepository(): IAnalyticsRepository {
  if (!analyticsRepositoryInstance) {
    analyticsRepositoryInstance = new SupabaseAnalyticsRepository();
  }
  return analyticsRepositoryInstance;
}

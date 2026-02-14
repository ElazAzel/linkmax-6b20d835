import { useCallback, useRef } from 'react';
import { supabase } from '@/platform/supabase/client';
import type { Json } from '@/platform/supabase/types';

export type MarketingEventType =
  | 'landing_view'
  | 'hero_primary_cta_click'
  | 'hero_secondary_cta_click'
  | 'how_it_works_view'
  | 'pricing_view'
  | 'faq_expand'
  | 'alternatives_view'
  | 'alternatives_cta_click'
  | 'signup_from_landing'
  | 'signup_from_alternatives';

interface TrackMarketingEventOptions {
  eventType: MarketingEventType;
  metadata?: Record<string, unknown>;
}

function isBot(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const botPatterns = [
    'bot',
    'crawl',
    'spider',
    'scrape',
    'lighthouse',
    'pagespeed',
    'headless',
    'phantomjs',
    'selenium',
  ];
  return botPatterns.some((pattern) => ua.includes(pattern));
}

function isDevTraffic(): boolean {
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('preview') ||
    window.location.hostname.includes('lovable')
  );
}

export function useMarketingAnalytics() {
  const trackedEvents = useRef<Set<string>>(new Set());

  const trackMarketingEvent = useCallback(async ({ eventType, metadata = {} }: TrackMarketingEventOptions) => {
    if (isBot() || isDevTraffic()) return;

    try {
      await supabase.from('analytics').insert({
        page_id: null,
        block_id: null,
        event_type: eventType,
        metadata: {
          ...metadata,
          path: window.location.pathname,
          referrer: document.referrer || null,
          language: navigator.language,
          timestamp: new Date().toISOString(),
        } as Json,
      });
    } catch (error) {
      console.debug('Marketing analytics failed:', error);
    }
  }, []);

  const trackOnce = useCallback(
    async ({ eventType, metadata = {} }: TrackMarketingEventOptions) => {
      const key = `${eventType}:${window.location.pathname}`;
      if (trackedEvents.current.has(key)) return;
      trackedEvents.current.add(key);
      await trackMarketingEvent({ eventType, metadata });
    },
    [trackMarketingEvent]
  );

  return {
    trackMarketingEvent,
    trackOnce,
  };
}

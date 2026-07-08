import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';
import type { Json } from '@/platform/supabase/types';
import {
  detectRageClickCluster,
  pruneRecentClicks,
  type HeatmapClickSample,
  type RageClickCluster,
} from './heatmap-model';

interface HeatmapEvent {
  type: 'click' | 'scroll' | 'rage_click';
  x?: number;
  y?: number;
  scrollDepth?: number;
  rageCluster?: RageClickCluster;
  viewportWidth: number;
  viewportHeight: number;
  pageHeight: number;
  timestamp: number;
}

const BATCH_INTERVAL = 5000; // Send batch every 5 seconds
const MAX_BATCH_SIZE = 50;
const HEATMAP_ENABLED = !import.meta.env.DEV;
const RAGE_CLICK_SUPPRESSION_MS = 2200;
const RAGE_CLICK_SUPPRESSION_RADIUS_PX = 48;

export function useHeatmapTracking(pageId: string | undefined, enabled: boolean = true) {
  const eventsBuffer = useRef<HeatmapEvent[]>([]);
  const recentClicks = useRef<HeatmapClickSample[]>([]);
  const lastRageCluster = useRef<RageClickCluster | null>(null);
  const lastScrollDepth = useRef<number>(0);
  const scrollSampleInterval = useRef<number>(0);

  // Send batched events to database
  const flushEvents = useCallback(async () => {
    if (!HEATMAP_ENABLED || !pageId || eventsBuffer.current.length === 0) return;

    const events = [...eventsBuffer.current];
    eventsBuffer.current = [];

    try {
      // Group events by type for efficient storage
      const clicks = events.filter(e => e.type === 'click');
      const rageClicks = events.flatMap(e => e.type === 'rage_click' && e.rageCluster ? [e.rageCluster] : []);
      const maxScrollDepth = Math.max(...events.filter(e => e.type === 'scroll').map(e => e.scrollDepth || 0), 0);

      // Store click positions
      if (clicks.length > 0) {
        await supabase.from('analytics').insert({
          page_id: pageId,
          event_type: 'heatmap_clicks',
          metadata: {
            clicks: clicks.map(c => ({
              x: c.x,
              y: c.y,
              relX: c.viewportWidth > 0 ? (c.x || 0) / c.viewportWidth : 0,
              relY: c.pageHeight > 0 ? (c.y || 0) / c.pageHeight : 0,
              timestamp: c.timestamp,
            })),
            viewportWidth: clicks[0]?.viewportWidth,
            viewportHeight: clicks[0]?.viewportHeight,
            pageHeight: clicks[0]?.pageHeight,
          } as Json,
        });
      }

      // Store scroll depth
      if (maxScrollDepth > 0) {
        await supabase.from('analytics').insert({
          page_id: pageId,
          event_type: 'heatmap_scroll',
          metadata: {
            maxDepth: maxScrollDepth,
            viewportHeight: events[0]?.viewportHeight,
            pageHeight: events[0]?.pageHeight,
          } as Json,
        });
      }

      if (rageClicks.length > 0) {
        await supabase.from('analytics').insert({
          page_id: pageId,
          event_type: 'heatmap_rage_clicks',
          metadata: {
            clusters: rageClicks.map(cluster => ({
              x: cluster.x,
              y: cluster.y,
              relX: cluster.relX,
              relY: cluster.relY,
              count: cluster.count,
              windowMs: cluster.windowMs,
              timestamp: cluster.timestamp,
            })),
            viewportWidth: events[0]?.viewportWidth,
            viewportHeight: events[0]?.viewportHeight,
            pageHeight: events[0]?.pageHeight,
          } as Json,
        });
      }
    } catch (error) {
      // Silently fail for analytics
      logger.debug('Heatmap tracking error:', { context: 'useHeatmapTracking', data: { error } });
    }
  }, [pageId]);

  // Track click position
  const handleClick = useCallback((e: MouseEvent) => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const pageHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );
    const timestamp = Date.now();
    const clickSample: HeatmapClickSample = {
      x: e.clientX,
      y: e.clientY + scrollY,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pageHeight,
      timestamp,
    };

    eventsBuffer.current.push({
      type: 'click',
      x: clickSample.x,
      y: clickSample.y, // Position relative to page top
      viewportWidth: clickSample.viewportWidth,
      viewportHeight: clickSample.viewportHeight,
      pageHeight,
      timestamp,
    });

    const rageCluster = detectRageClickCluster(recentClicks.current, clickSample);
    recentClicks.current = pruneRecentClicks([...recentClicks.current, clickSample], timestamp);

    const previousRageCluster = lastRageCluster.current;
    const sameBurst = Boolean(
      rageCluster &&
      previousRageCluster &&
      timestamp - previousRageCluster.timestamp <= RAGE_CLICK_SUPPRESSION_MS &&
      Math.hypot(previousRageCluster.x - rageCluster.x, previousRageCluster.y - rageCluster.y) <= RAGE_CLICK_SUPPRESSION_RADIUS_PX
    );

    if (rageCluster && !sameBurst) {
      lastRageCluster.current = rageCluster;
      eventsBuffer.current.push({
        type: 'rage_click',
        rageCluster,
        viewportWidth: clickSample.viewportWidth,
        viewportHeight: clickSample.viewportHeight,
        pageHeight,
        timestamp,
      });
    }

    if (eventsBuffer.current.length >= MAX_BATCH_SIZE) {
      flushEvents();
    }
  }, [flushEvents]);

  // Track scroll depth
  const handleScroll = useCallback(() => {
    // Throttle scroll events
    const now = Date.now();
    if (now - scrollSampleInterval.current < 500) return;
    scrollSampleInterval.current = now;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;
    const pageHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );

    // Calculate scroll depth as percentage
    const scrollDepth = Math.min(
      100,
      Math.round(((scrollTop + viewportHeight) / pageHeight) * 100)
    );

    // Only track if depth increased
    if (scrollDepth > lastScrollDepth.current) {
      lastScrollDepth.current = scrollDepth;

      eventsBuffer.current.push({
        type: 'scroll',
        scrollDepth,
        viewportWidth: window.innerWidth,
        viewportHeight,
        pageHeight,
        timestamp: Date.now(),
      });
    }
  }, []);

  useEffect(() => {
    if (!enabled || !pageId || !HEATMAP_ENABLED) return;

    // Add event listeners
    document.addEventListener('click', handleClick, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Set up batch interval
    const intervalId = setInterval(flushEvents, BATCH_INTERVAL);

    // Flush on page unload
    const handleUnload = () => flushEvents();
    window.addEventListener('beforeunload', handleUnload);

    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleUnload);
      clearInterval(intervalId);
      flushEvents(); // Flush remaining events
    };
  }, [enabled, pageId, handleClick, handleScroll, flushEvents]);
}

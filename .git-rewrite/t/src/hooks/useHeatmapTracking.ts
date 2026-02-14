import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/platform/supabase/client';
import type { Json } from '@/platform/supabase/types';

interface HeatmapEvent {
  type: 'click' | 'scroll';
  x?: number;
  y?: number;
  scrollDepth?: number;
  viewportWidth: number;
  viewportHeight: number;
  pageHeight: number;
  timestamp: number;
}

const BATCH_INTERVAL = 5000; // Send batch every 5 seconds
const MAX_BATCH_SIZE = 50;

export function useHeatmapTracking(pageId: string | undefined, enabled: boolean = true) {
  const eventsBuffer = useRef<HeatmapEvent[]>([]);
  const lastScrollDepth = useRef<number>(0);
  const scrollSampleInterval = useRef<number>(0);

  // Send batched events to database
  const flushEvents = useCallback(async () => {
    if (!pageId || eventsBuffer.current.length === 0) return;

    const events = [...eventsBuffer.current];
    eventsBuffer.current = [];

    try {
      // Group events by type for efficient storage
      const clicks = events.filter(e => e.type === 'click');
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
    } catch (error) {
      console.debug('Heatmap tracking error:', error);
    }
  }, [pageId]);

  // Track click position
  const handleClick = useCallback((e: MouseEvent) => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const pageHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    );

    eventsBuffer.current.push({
      type: 'click',
      x: e.clientX,
      y: e.clientY + scrollY, // Position relative to page top
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pageHeight,
      timestamp: Date.now(),
    });

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
    if (!enabled || !pageId) return;

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

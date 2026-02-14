/**
 * Landing Page Analytics Hook
 * Tracks scroll depth, CTA clicks, section visibility, and drop-off
 */

import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/platform/supabase/client';
import type { Json } from '@/platform/supabase/types';

// Filter out bots and dev traffic
function isBot(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  const botPatterns = [
    'bot', 'crawl', 'spider', 'scrape', 'lighthouse',
    'pagespeed', 'headless', 'phantomjs', 'selenium'
  ];
  return botPatterns.some(pattern => ua.includes(pattern));
}

function isDevTraffic(): boolean {
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname.includes('preview') ||
    window.location.hostname.includes('lovable')
  );
}

// Session tracking
const SESSION_KEY = 'lnkmx_landing_session';

interface LandingSession {
  id: string;
  startedAt: number;
  maxScrollDepth: number;
  sectionsViewed: string[];
  ctaClicks: string[];
}

function getOrCreateSession(): LandingSession {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore
  }
  
  const session: LandingSession = {
    id: crypto.randomUUID?.() || Math.random().toString(36).substring(2),
    startedAt: Date.now(),
    maxScrollDepth: 0,
    sectionsViewed: [],
    ctaClicks: [],
  };
  
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Ignore
  }
  
  return session;
}

function updateSession(updates: Partial<LandingSession>) {
  try {
    const session = getOrCreateSession();
    const updated = { ...session, ...updates };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return null;
  }
}

// Event types for landing page
type LandingEventType = 
  | 'landing_view'
  | 'landing_scroll'
  | 'landing_section_view'
  | 'cta_create_click'
  | 'cta_gallery_click'
  | 'cta_pricing_click'
  | 'pricing_toggle'
  | 'signup_start'
  | 'landing_exit';

interface TrackLandingEventOptions {
  eventType: LandingEventType;
  metadata?: Record<string, unknown>;
}

async function trackLandingEvent({ eventType, metadata = {} }: TrackLandingEventOptions): Promise<void> {
  // Filter bots and dev traffic
  if (isBot() || isDevTraffic()) return;
  
  try {
    const session = getOrCreateSession();
    
    const enrichedMetadata = {
      ...metadata,
      sessionId: session.id,
      sessionDuration: Date.now() - session.startedAt,
      device: /mobile|android|iphone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
      source: document.referrer ? new URL(document.referrer).hostname : 'direct',
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenWidth: screen.width,
      screenHeight: screen.height,
      timestamp: new Date().toISOString(),
    };

    await supabase.from('analytics').insert({
      page_id: null, // Landing page doesn't have a page_id
      block_id: null,
      event_type: eventType,
      metadata: enrichedMetadata as Json,
    });
  } catch (error) {
    console.debug('Landing analytics failed:', error);
  }
}

export function useLandingAnalytics() {
  const hasTrackedView = useRef(false);
  const scrollDepths = useRef<Set<number>>(new Set());
  const sectionsInViewport = useRef<Set<string>>(new Set());
  
  // Track initial page view
  useEffect(() => {
    if (hasTrackedView.current || isBot() || isDevTraffic()) return;
    
    const sessionKey = 'lnkmx_landing_viewed';
    const alreadyViewed = sessionStorage.getItem(sessionKey);
    
    if (!alreadyViewed) {
      trackLandingEvent({ 
        eventType: 'landing_view',
        metadata: {
          referrer: document.referrer,
          utmSource: new URLSearchParams(window.location.search).get('utm_source'),
          utmMedium: new URLSearchParams(window.location.search).get('utm_medium'),
          utmCampaign: new URLSearchParams(window.location.search).get('utm_campaign'),
        }
      });
      sessionStorage.setItem(sessionKey, 'true');
      hasTrackedView.current = true;
    }
  }, []);
  
  // Track scroll depth
  useEffect(() => {
    if (isBot() || isDevTraffic()) return;
    
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      // Track at 25%, 50%, 75%, 90%, 100% thresholds
      const thresholds = [25, 50, 75, 90, 100];
      for (const threshold of thresholds) {
        if (scrollPercent >= threshold && !scrollDepths.current.has(threshold)) {
          scrollDepths.current.add(threshold);
          trackLandingEvent({
            eventType: 'landing_scroll',
            metadata: { depth: threshold }
          });
          
          // Update session max scroll depth
          const session = getOrCreateSession();
          if (threshold > session.maxScrollDepth) {
            updateSession({ maxScrollDepth: threshold });
          }
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Track section visibility
  const trackSectionView = useCallback((sectionId: string) => {
    if (isBot() || isDevTraffic()) return;
    if (sectionsInViewport.current.has(sectionId)) return;
    
    sectionsInViewport.current.add(sectionId);
    
    trackLandingEvent({
      eventType: 'landing_section_view',
      metadata: { section: sectionId }
    });
    
    // Update session
    const session = getOrCreateSession();
    if (!session.sectionsViewed.includes(sectionId)) {
      updateSession({ sectionsViewed: [...session.sectionsViewed, sectionId] });
    }
  }, []);
  
  // Track CTA clicks
  const trackCtaClick = useCallback((ctaType: 'create' | 'gallery' | 'pricing' | 'signup', location?: string) => {
    if (isBot() || isDevTraffic()) return;
    
    const eventTypeMap: Record<string, LandingEventType> = {
      create: 'cta_create_click',
      gallery: 'cta_gallery_click',
      pricing: 'cta_pricing_click',
      signup: 'signup_start',
    };
    
    trackLandingEvent({
      eventType: eventTypeMap[ctaType],
      metadata: { 
        ctaType,
        location: location || 'unknown',
        scrollDepth: Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100),
      }
    });
    
    // Update session
    const session = getOrCreateSession();
    updateSession({ ctaClicks: [...session.ctaClicks, `${ctaType}_${location || 'unknown'}`] });
  }, []);
  
  // Track pricing toggle
  const trackPricingToggle = useCallback((plan: string) => {
    if (isBot() || isDevTraffic()) return;
    
    trackLandingEvent({
      eventType: 'pricing_toggle',
      metadata: { selectedPlan: plan }
    });
  }, []);
  
  // Track exit (before unload)
  useEffect(() => {
    if (isBot() || isDevTraffic()) return;
    
    const handleBeforeUnload = () => {
      const session = getOrCreateSession();
      // Use sendBeacon for reliable exit tracking
      const data = {
        eventType: 'landing_exit',
        metadata: {
          sessionId: session.id,
          duration: Date.now() - session.startedAt,
          maxScrollDepth: session.maxScrollDepth,
          sectionsViewed: session.sectionsViewed,
          ctaClicks: session.ctaClicks,
        }
      };
      
      navigator.sendBeacon?.(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/analytics`,
        JSON.stringify({
          page_id: null,
          block_id: null,
          event_type: 'landing_exit',
          metadata: data.metadata,
        })
      );
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
  
  return {
    trackSectionView,
    trackCtaClick,
    trackPricingToggle,
  };
}

// Intersection Observer hook for section tracking
export function useSectionObserver(sectionId: string, trackSectionView: (id: string) => void) {
  const sectionRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            trackSectionView(sectionId);
          }
        });
      },
      { threshold: 0.3 } // 30% visibility triggers tracking
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, [sectionId, trackSectionView]);
  
  return sectionRef;
}

/**
 * Hook for tracking analytics on public pages
 * Automatically tracks page views and provides methods for click/share tracking
 * Sends events to both internal DB and marketing pixels
 */

import { useEffect, useCallback, useRef } from 'react';
import { session } from '@/lib/storage';
import {
  trackPageView,
  trackBlockClick,
  trackShare
} from '@/services/analytics';
import { trackClickLink, trackViewContent } from '@/lib/analytics';

interface UseAnalyticsTrackingOptions {
  pageId: string | undefined;
  enabled?: boolean;
}

export function useAnalyticsTracking({ pageId, enabled = true }: UseAnalyticsTrackingOptions) {
  const hasTrackedView = useRef(false);

  // Disable tracking inside dashboard to prevent 403 errors on unpublished pages
  const isInsideDashboard = typeof window !== 'undefined' && window.location.pathname.includes('/dashboard');
  const trackingEnabled = enabled && !isInsideDashboard;

  // Track page view on mount (only once per session per page)
  useEffect(() => {
    if (!pageId || !trackingEnabled || hasTrackedView.current) return;

    // Check if we've already tracked this page in this session
    const sessionKey = `linkmax_viewed_${pageId}`;
    const alreadyViewed = session.get(sessionKey);

    if (!alreadyViewed) {
      trackPageView(pageId);
      session.set(sessionKey, 'true');
      hasTrackedView.current = true;
    }
  }, [pageId, trackingEnabled]);

  // Track block click — sends to internal DB + marketing pixels
  const onBlockClick = useCallback(
    (blockId: string, blockType?: string, blockTitle?: string, experimentId?: string, variantLabel?: string) => {
      if (!pageId || !trackingEnabled) return;
      // Internal analytics (DB)
      trackBlockClick(pageId, blockId, blockType, blockTitle, experimentId, variantLabel);
      // Marketing pixels (FB, TikTok, GA4)
      trackClickLink(blockTitle, undefined);
    },
    [pageId, trackingEnabled]
  );

  // Track share
  const onShare = useCallback(
    (method?: string) => {
      if (!pageId || !trackingEnabled) return;
      trackShare(pageId, method);
    },
    [pageId, trackingEnabled]
  );

  return {
    onBlockClick,
    onShare,
  };
}

/**
 * Context for passing analytics tracking down the component tree
 */
import { createContext, useContext, type ReactNode } from 'react';

interface AnalyticsContextValue {
  pageId: string | undefined;
  onBlockClick: (
    blockId: string,
    blockType?: string,
    blockTitle?: string,
    experimentId?: string,
    variantLabel?: string
  ) => void;
  onShare: (method?: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  pageId: string | undefined;
  enabled?: boolean;
  children: ReactNode;
}

export function AnalyticsProvider({ pageId, enabled = true, children }: AnalyticsProviderProps) {
  const { onBlockClick, onShare } = useAnalyticsTracking({ pageId, enabled });

  return (
    <AnalyticsContext.Provider value={{ pageId, onBlockClick, onShare }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    // Return no-op functions if not in provider
    return {
      pageId: undefined,
      onBlockClick: () => { },
      onShare: () => { },
    };
  }
  return context;
}

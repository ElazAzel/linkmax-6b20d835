/**
 * Hook for tracking analytics on public pages
 * Automatically tracks page views and provides methods for click/share tracking
 */

import { useEffect, useCallback, useRef } from 'react';
import { 
  trackPageView, 
  trackBlockClick, 
  trackShare 
} from '@/services/analytics';

interface UseAnalyticsTrackingOptions {
  pageId: string | undefined;
  enabled?: boolean;
}

export function useAnalyticsTracking({ pageId, enabled = true }: UseAnalyticsTrackingOptions) {
  const hasTrackedView = useRef(false);

  // Track page view on mount (only once per session per page)
  useEffect(() => {
    if (!pageId || !enabled || hasTrackedView.current) return;

    // Check if we've already tracked this page in this session
    const sessionKey = `linkmax_viewed_${pageId}`;
    const alreadyViewed = sessionStorage.getItem(sessionKey);

    if (!alreadyViewed) {
      trackPageView(pageId);
      sessionStorage.setItem(sessionKey, 'true');
      hasTrackedView.current = true;
    }
  }, [pageId, enabled]);

  // Track block click
  const onBlockClick = useCallback(
    (blockId: string, blockType?: string, blockTitle?: string) => {
      if (!pageId || !enabled) return;
      trackBlockClick(pageId, blockId, blockType, blockTitle);
    },
    [pageId, enabled]
  );

  // Track share
  const onShare = useCallback(
    (method?: string) => {
      if (!pageId || !enabled) return;
      trackShare(pageId, method);
    },
    [pageId, enabled]
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
  onBlockClick: (blockId: string, blockType?: string, blockTitle?: string) => void;
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
      onBlockClick: () => {},
      onShare: () => {},
    };
  }
  return context;
}

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const canPrefetch = () => {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;

  if (connection?.saveData) return false;
  if (connection?.effectiveType && ['slow-2g', '2g'].includes(connection.effectiveType)) {
    return false;
  }

  return true;
};

const idle = (cb: () => void): number => {
  if (typeof window.requestIdleCallback === 'function') {
    return window.requestIdleCallback(cb, { timeout: 1200 });
  }

  return window.setTimeout(cb, 400);
};

const prefetchDashboardRoute = () => import('@/pages/DashboardV2');
const prefetchAuthRoute = () => import('@/pages/Auth');
const prefetchEditorRoute = () => import('@/components/dashboard-v2/screens/EditorScreen');
const prefetchEventsRoute = () => import('@/components/dashboard-v2/screens/EventsScreen');

/**
 * Route-level prefetching for the most probable next transitions.
 *
 * NOTE: intentionally avoids global prefetching to keep network/CPU budget tight.
 */
export function RoutePrefetchManager() {
  const location = useLocation();
  const prefetched = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!canPrefetch()) return;

    const runPrefetch = (key: string, jobs: Array<() => Promise<unknown>>) => {
      if (prefetched.current.has(key)) return;
      prefetched.current.add(key);
      idle(() => {
        jobs.forEach((job) => void job());
      });
    };

    const { pathname } = location;

    if (pathname === '/') {
      const onIntent = () => runPrefetch('landing-intent', [prefetchAuthRoute, prefetchDashboardRoute]);
      const events: Array<keyof WindowEventMap> = ['mousemove', 'touchstart', 'keydown'];
      events.forEach((eventName) => window.addEventListener(eventName, onIntent, { once: true, passive: true }));
      return () => {
        events.forEach((eventName) => window.removeEventListener(eventName, onIntent));
      };
    }

    if (pathname === '/dashboard' || pathname === '/dashboard/home') {
      runPrefetch('dashboard-home-next', [prefetchEditorRoute, prefetchEventsRoute]);
      return;
    }

    if (pathname.startsWith('/dashboard/events')) {
      runPrefetch('dashboard-events-next', [prefetchEditorRoute]);
      return;
    }

    if (pathname === '/dashboard/pages') {
      runPrefetch('dashboard-pages-next', [prefetchEditorRoute]);
    }
  }, [location]);

  return null;
}

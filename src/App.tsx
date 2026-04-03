// Polyfill requestIdleCallback for Safari
const _ric = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 1);

import React, { Suspense, useEffect, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/hooks/user/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RoutePrefetchManager } from "@/components/performance/RoutePrefetchManager";
import { RouteWebVitalsMonitor } from "@/components/performance/RouteWebVitalsMonitor";


// Lazy load non-critical shell components to reduce main bundle
const PWAInstallPrompt = lazy(() => import("@/components/pwa/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));
const PWAUpdatePrompt = lazy(() => import("@/components/pwa/PWAUpdatePrompt").then(m => ({ default: m.PWAUpdatePrompt })));
const CookieConsent = lazy(() => import("@/components/legal/CookieConsent").then(m => ({ default: m.CookieConsent })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading fallback for pages — visible in both light and dark mode
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
    </div>
  </div>
);

// Error boundary for lazy-loaded routes
class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.error('Route error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-6">
            <p className="text-lg font-semibold text-foreground">Something went wrong</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


import { SkipToMainContent } from "@/components/ui/SkipToMainContent";
import { CommandPalette } from "@/components/dashboard-v2/CommandPalette";

const App = () => {
  // Defer non-critical init until user interacts or after 8s
  // This prevents web-vitals, storage, and i18n-db-backend chunks from loading on initial paint
  useEffect(() => {
    let fired = false;
    const run = () => {
      if (fired) return;
      fired = true;
      ['scroll', 'click', 'keydown', 'touchstart'].forEach(e =>
        window.removeEventListener(e, run)
      );
      _ric(() => {
        // Clear old storage versions
        import('@/lib/storage').then(({ storage }) => {
          storage.clearOldVersions();
        });
        // Sync translations from DB
        import('./i18n/config').then(({ default: i18n }) => {
          import('./lib/i18n-db-backend').then(({ syncI18nWithDB }) => {
            syncI18nWithDB(i18n);
          });
        });
      });
    };
    ['scroll', 'click', 'keydown', 'touchstart'].forEach(e =>
      window.addEventListener(e, run, { once: true, passive: true })
    );
    const timer = setTimeout(run, 8000);
    return () => { clearTimeout(timer); };
  }, []);

  // Listen for OAuth errors in URL
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const error = hashParams.get('error');
    const errorDescription = hashParams.get('error_description');

    if (error) {
      // Clear hash to prevent repeated errors
      window.history.replaceState(null, '', window.location.pathname);
      // Wait for toast to be ready
      setTimeout(() => {
        toast.error(`Authentication Error: ${errorDescription || error}`);
      }, 500);
    }
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <TooltipProvider>
              <SkipToMainContent />
              <Toaster />
              <Sonner />
              <CommandPalette />
              <RoutePrefetchManager />
              <RouteWebVitalsMonitor />
              <RouteErrorBoundary>
                <div id="main-content" className="outline-none" tabIndex={-1}>
                  <Suspense fallback={<PageLoader />}>
                    <Outlet />
                  </Suspense>
                </div>
              </RouteErrorBoundary>
              <Suspense fallback={null}>
                <PWAInstallPrompt />
                <PWAUpdatePrompt />
                <CookieConsent />
              </Suspense>
            </TooltipProvider>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;

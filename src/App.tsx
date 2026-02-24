// Polyfill requestIdleCallback for Safari
const _ric = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 1);

import { Suspense, useEffect, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/hooks/user/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load non-critical shell components to reduce main bundle
const PWAInstallPrompt = lazy(() => import("@/components/pwa/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));
const PWAUpdatePrompt = lazy(() => import("@/components/pwa/PWAUpdatePrompt").then(m => ({ default: m.PWAUpdatePrompt })));
const CookieConsent = lazy(() => import("@/components/legal/CookieConsent").then(m => ({ default: m.CookieConsent })));

const queryClient = new QueryClient();

// Loading fallback for pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="space-y-4 w-full max-w-md p-4">
      <Skeleton className="h-12 w-3/4 mx-auto" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);


const App = () => {
  // Defer non-critical init to after first paint
  useEffect(() => {
    _ric(() => {
      // Web Vitals — monitoring only, not needed for render
      import("@/hooks/analytics/useWebVitals");
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
              <Toaster />
              <Sonner />
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
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

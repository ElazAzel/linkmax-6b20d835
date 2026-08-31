// Polyfill requestIdleCallback for Safari
const _ric = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 1);

import React, { Suspense, useEffect, lazy } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner, toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { queryRetryOptions, mutationRetryOptions } from "@/lib/resilience/retry-policy";
import { reportBackendFailure, reportBackendSuccess, startNetworkHealthWatch } from "@/lib/resilience/backend-health";
import { hydrateQueryCache, persistQueryCache } from "@/lib/resilience/query-cache-persist";

import { BackendStatusBanner } from "@/components/system/BackendStatusBanner";
import { BuildingLoader } from "@/components/ui/building-loader";
import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/hooks/user/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { RouteWebVitalsMonitor } from "@/components/performance/RouteWebVitalsMonitor";
import { TMAProvider } from "@/platform/tma/TMAProvider";
import { SkipToMainContent } from "@/components/ui/SkipToMainContent";
import { initPostHog } from "@/lib/posthog";
import { useGrowthAttribution } from "@/hooks/useGrowthAttribution";
import { consumePendingPageClone } from "@/services/page-cloning";
import { useAuth } from "@/hooks/user/useAuth";

// Initialize PostHog before rendering
initPostHog();

// Lazy load non-critical shell components to reduce main bundle
const PWAInstallPrompt = lazy(() => import("@/components/pwa/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));
const PWAUpdatePrompt = lazy(() => import("@/components/pwa/PWAUpdatePrompt").then(m => ({ default: m.PWAUpdatePrompt })));
const CookieConsent = lazy(() => import("@/components/legal/CookieConsent").then(m => ({ default: m.CookieConsent })));
const CommandPalette = lazy(() => import("@/components/dashboard-v2/CommandPalette").then(m => ({ default: m.CommandPalette })));
const PaymentTestModeBanner = lazy(() => import("@/components/PaymentTestModeBanner").then(m => ({ default: m.PaymentTestModeBanner })));

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => reportBackendFailure(error),
    onSuccess: () => reportBackendSuccess(),
  }),
  mutationCache: new MutationCache({
    onError: (error) => reportBackendFailure(error),
    onSuccess: () => reportBackendSuccess(),
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      ...queryRetryOptions,
    },
    mutations: {
      ...mutationRetryOptions,
    },
  },
});

// Последние успешные данные живут в localStorage: при недоступном бэкенде
// показываем их вместо пустых экранов.
hydrateQueryCache(queryClient);
persistQueryCache(queryClient);

// Возврат сети → сбрасываем состояние и обновляем активные запросы.
startNetworkHealthWatch(() => {
  void queryClient.refetchQueries({ type: 'active' });
});




// Loading fallback for pages
const ERROR_COPY: Record<string, { title: string; reload: string }> = {
  ru: { title: 'Что-то пошло не так', reload: 'Обновить страницу' },
  en: { title: 'Something went wrong', reload: 'Reload page' },
  kk: { title: 'Бірдеңе дұрыс болмады', reload: 'Бетті жаңарту' },
  uz: { title: 'Nimadir noto‘g‘ri ketdi', reload: 'Sahifani yangilash' },
};
const OAUTH_ERROR_COPY: Record<string, string> = {
  ru: 'Ошибка входа', en: 'Sign-in error', kk: 'Кіру қатесі', uz: 'Kirish xatosi',
};
const getLang = () => {
  const l = (typeof document !== 'undefined' ? document.documentElement.lang : 'ru') || 'ru';
  return (['ru','en','kk','uz'].includes(l) ? l : 'ru');
};
const PageLoader = () => <BuildingLoader />;

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
      const c = ERROR_COPY[getLang()];
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 p-6">
            <p className="text-lg font-semibold text-foreground">{c.title}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
            >
              {c.reload}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Runs inside AuthProvider so auth context is available.
const AppAuthEffects = () => {
  // Capture page-level referral visits and convert the first-touch attribution
  // after authentication. The hook is intentionally global so auth redirects
  // cannot lose the referral code.
  useGrowthAttribution();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const timer = window.setTimeout(() => {
      void consumePendingPageClone();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [user?.id]);

  return null;
};

const App = () => {


  // Defer non-critical init until user interacts or after 8s
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
      window.history.replaceState(null, '', window.location.pathname);
      setTimeout(() => {
        toast.error(`${OAUTH_ERROR_COPY[getLang()]}: ${errorDescription || error}`);
      }, 500);
    }
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
          <TMAProvider>
            <AuthProvider>
              <LanguageProvider>
                <TooltipProvider>
                  <SkipToMainContent />
                  <Suspense fallback={null}>
                    <Toaster />
                    <Sonner />
                    <CommandPalette />
                  </Suspense>
                  <RouteWebVitalsMonitor />
                  <RouteErrorBoundary>
                    <BackendStatusBanner />
                    <PaymentTestModeBanner />
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
          </TMAProvider>
        </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;

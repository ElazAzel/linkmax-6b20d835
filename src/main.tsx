// CRITICAL: i18n must be imported FIRST, before any React components
import "./i18n/config";

// Polyfill requestIdleCallback for Safari
const _ric = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 1) as unknown as number;

import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
import Index from "./pages/Index";
import Auth from "./pages/Auth";

// Defer non-critical init: only load after user interacts or 10s idle
// This prevents vendor-sentry (150KB) and cache-utils from loading on landing page
const deferNonCritical = () => {
  // Sentry — only init when actually needed (lazy-loaded via logger on first error)
  // No eager import here; logger.ts handles dynamic import on warn/error
  
  // Cache version check — defer to background
  import('@/lib/utils/cache-utils').then(({ checkCacheVersion }) => {
    checkCacheVersion();
  });
};

// Trigger on first user interaction OR after 10s, whichever comes first
let deferFired = false;
const fireDeferOnce = () => {
  if (deferFired) return;
  deferFired = true;
  ['scroll', 'click', 'keydown', 'touchstart'].forEach(e => 
    window.removeEventListener(e, fireDeferOnce)
  );
  _ric(deferNonCritical);
};
['scroll', 'click', 'keydown', 'touchstart'].forEach(e =>
  window.addEventListener(e, fireDeferOnce, { once: true, passive: true })
);
setTimeout(fireDeferOnce, 10000);

// Runtime recovery: handle stale chunk/cache mismatch to avoid infinite static fallback
const CHUNK_RECOVERY_KEY = 'lnkmx_chunk_recovery_once';

function isChunkRuntimeError(err: unknown): boolean {
  const message = typeof err === 'string'
    ? err
    : (err as { message?: string })?.message || '';

  return [
    'ChunkLoadError',
    'Loading chunk',
    'Failed to fetch dynamically imported module',
    'Importing a module script failed',
    'O is not a function',
  ].some((token) => message.includes(token));
}

function recoverFromStaleAssets(): void {
  try {
    if (sessionStorage.getItem(CHUNK_RECOVERY_KEY) === '1') return;
    sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1');

    // Clear runtime caches that can hold stale assets
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('linkmax_') || key.startsWith('lnkmx_') || key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // ignore
    }

    try {
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
          window.location.reload();
        });
        return;
      }
    } catch {
      // ignore
    }

    window.location.reload();
  } catch {
    window.location.reload();
  }
}

window.addEventListener('error', (event) => {
  if (isChunkRuntimeError(event.error || event.message)) {
    recoverFromStaleAssets();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (isChunkRuntimeError(event.reason)) {
    event.preventDefault();
    recoverFromStaleAssets();
  }
});

// If app boot succeeded, allow future recovery attempts
window.addEventListener('load', () => {
  setTimeout(() => {
    sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
  }, 15000);
});

// Lazy load page components for route-based code splitting
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Dashboard = lazy(() => import("./pages/DashboardV2"));
const PublicPage = lazy(() => import("./pages/PublicPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Install = lazy(() => import("./pages/Install"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Alternatives = lazy(() => import("./pages/Alternatives"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminTranslations = lazy(() => import("./pages/AdminTranslations"));
const AdminTemplateEditor = lazy(() => import("./pages/AdminTemplateEditor"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const CollabPage = lazy(() => import("./pages/CollabPage"));
const JoinTeam = lazy(() => import("./pages/JoinTeam"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const PaymentTerms = lazy(() => import("./pages/PaymentTerms"));
const Experts = lazy(() => import("./pages/Experts"));
const EventScanner = lazy(() => import("./pages/EventScanner"));
const SeoLanding = lazy(() => import("./pages/SeoLanding"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));

// Create router with optimized code splitting
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Index /> },
      { path: "auth", element: <Auth /> },
      { path: "auth/callback", element: <AuthCallback /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "dashboard/home", element: <Dashboard /> },
      { path: "dashboard/pages", element: <Dashboard /> },
      { path: "dashboard/activity", element: <Dashboard /> },
      { path: "dashboard/insights", element: <Dashboard /> },
      { path: "dashboard/monetize", element: <Dashboard /> },
      { path: "dashboard/settings", element: <Dashboard /> },
      { path: "dashboard/events", element: <Dashboard /> },
      { path: "dashboard/events/:eventId", element: <Dashboard /> },
      { path: "dashboard/events/:eventId/scanner", element: <EventScanner /> },
      { path: "dashboard/zone-dashboard", element: <Dashboard /> },
      { path: "dashboard/zone-deals", element: <Dashboard /> },
      { path: "dashboard/zone-contacts", element: <Dashboard /> },
      { path: "dashboard/zone-inbox", element: <Dashboard /> },
      { path: "dashboard/zone-tasks", element: <Dashboard /> },
      { path: "dashboard/zone-automations", element: <Dashboard /> },
      { path: "dashboard/zone-invoices", element: <Dashboard /> },
      { path: "dashboard/zone-settings", element: <Dashboard /> },
      { path: "dashboard/team", element: <Dashboard /> },
      { path: "install", element: <Install /> },
      { path: "gallery", element: <Gallery /> },
      { path: "pricing", element: <Pricing /> },
      { path: "alternatives", element: <Alternatives /> },
      { path: "seo-landing", element: <SeoLanding /> },
      { path: "admin", element: <Admin /> },
      { path: "admin/translations", element: <AdminTranslations /> },
      { path: "admin/templates/new", element: <AdminTemplateEditor /> },
      { path: "admin/templates/:id", element: <AdminTemplateEditor /> },
      { path: "team/:slug", element: <TeamPage /> },
      { path: "join/:inviteCode", element: <JoinTeam /> },
      { path: "invites/:token", element: <AcceptInvite /> },
      { path: "terms", element: <Terms /> },
      { path: "privacy", element: <Privacy /> },
      { path: "payment-terms", element: <PaymentTerms /> },
      { path: "experts", element: <Experts /> },
      { path: "experts/:tag", element: <Experts /> },
      { path: "collab/:collabSlug", element: <CollabPage /> },
      { path: "p/:compressed", element: <PublicPage /> },
      { path: ":slug", element: <PublicPage /> },
      {
        path: "*",
        element: <NotFound />,
        loader: ({ request }) => {
          const url = new URL(request.url);
          if (url.pathname.startsWith('/~oauth')) {
            window.location.href = url.href;
            return new Promise(() => { });
          }
          return null;
        }
      },
    ],
  },
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </StrictMode>
);

// Disable Service Worker to prevent stale offline app-shell causing black-screen loops
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));

      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(
          names
            .filter((name) => name.startsWith('lnkmx-') || name.startsWith('linkmax-'))
            .map((name) => caches.delete(name))
        );
      }
    } catch {
      // Non-blocking cleanup
    }
  });
}

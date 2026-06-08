// CRITICAL: i18n must be imported FIRST, before any React components
import "./i18n/config";
import { validateEnv } from "./lib/utils/env-validator";

// Validate environment before anything else
validateEnv();

// Polyfill requestIdleCallback for Safari
const _ric = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 1) as unknown as number;

import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App";
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
import {
  CHUNK_RECOVERY_KEY,
  isChunkRuntimeError,
  recoverFromStaleAssets,
} from "@/lib/utils/runtime-recovery";
import { prefetchRouteChunks } from "@/lib/routing/route-prefetch";

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

// Route-level prefetch only for nearest likely transitions
const scheduleLikelyRoutePrefetch = () => {
  const path = window.location.pathname;

  if (path === '/' || path === '/auth') {
    // Landing/auth users usually continue to dashboard, pricing, or view examples
    prefetchRouteChunks(['dashboard', 'pricing', 'gallery']);
    return;
  }

  if (path.startsWith('/dashboard')) {
    // Dashboard users frequently open editor and preview public page
    prefetchRouteChunks(['editor', 'publicPage']);
    return;
  }

  // Public profile visitors most likely auth or open dashboard after sign-in
  prefetchRouteChunks(['auth', 'dashboard']);
};

_ric(scheduleLikelyRoutePrefetch);

// Runtime recovery uses imported functions from runtime-recovery module

// Recovery function wraps the imported version

window.addEventListener('error', (event) => {
  if (isChunkRuntimeError(event.error || event.message)) {
    recoverFromStaleAssets('window.error');
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (isChunkRuntimeError(event.reason)) {
    event.preventDefault();
    recoverFromStaleAssets('unhandledrejection');
  }
});

// If app boot succeeded, allow future recovery attempts
window.addEventListener('load', () => {
  setTimeout(() => {
    window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
  }, 15000);
});

// Lazy load page components for route-based code splitting
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Dashboard = lazy(() => import("./pages/DashboardV2"));
const PublicPage = lazy(() => import("./pages/PublicPage"));
const PublicServicePage = lazy(() => import("./pages/PublicServicePage"));
const PublicEventPage = lazy(() => import("./pages/PublicEventPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Install = lazy(() => import("./pages/Install"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Alternatives = lazy(() => import("./pages/Alternatives"));
const AlternativeDetail = lazy(() => import("./pages/AlternativeDetail"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminTranslations = lazy(() => import("./pages/AdminTranslations"));
const AdminLanguageAlgorithms = lazy(() => import("./pages/AdminLanguageAlgorithms"));
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
const ForMasters = lazy(() => import("./pages/ForMasters"));
const NicheLanding = lazy(() => import("./pages/NicheLanding"));
const FromPage = lazy(() => import("./pages/FromPage"));
const DeveloperSettings = lazy(() => import("./pages/DeveloperSettings"));
const Customers = lazy(() => import("./pages/Customers"));
const BlogIndex = lazy(() => import("./pages/BlogIndex"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const LocaleIndex = lazy(() => import("./components/routing/LocaleIndex"));

// Create router with optimized code splitting
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Index /> },
      { path: "index", element: <Index /> },
      // Language-prefixed homepage for international SEO (/ru, /en, /kk, /uz)
      { path: "ru", element: <LocaleIndex /> },
      { path: "en", element: <LocaleIndex /> },
      { path: "kk", element: <LocaleIndex /> },
      { path: "uz", element: <LocaleIndex /> },
      { path: "auth", element: <Auth /> },
      { path: "auth/callback", element: <AuthCallback /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "dashboard/home", element: <Dashboard /> },
      { path: "dashboard/pages", element: <Dashboard /> },
      { path: "dashboard/activity", element: <Dashboard /> },
      { path: "dashboard/insights", element: <Dashboard /> },
      { path: "dashboard/monetize", element: <Dashboard /> },
      { path: "dashboard/finance", element: <Dashboard /> },
      { path: "dashboard/settings", element: <Dashboard /> },
      { path: "dashboard/events", element: <Dashboard /> },
      { path: "dashboard/events/:eventId", element: <Dashboard /> },
      { path: "dashboard/events/:eventId/scanner", element: <EventScanner /> },
      { path: "dashboard/zone-dashboard", element: <Dashboard /> },
      { path: "dashboard/zone-analytics", element: <Dashboard /> },
      { path: "dashboard/leads", element: <Dashboard /> },
      { path: "dashboard/zone-deals", element: <Dashboard /> },
      { path: "dashboard/zone-contacts", element: <Dashboard /> },
      { path: "dashboard/zone-inbox", element: <Dashboard /> },
      { path: "dashboard/zone-tasks", element: <Dashboard /> },
      { path: "dashboard/developers", element: <Dashboard /> },
      { path: "dashboard/zone-automations", element: <Dashboard /> },
      { path: "dashboard/zone-invoices", element: <Dashboard /> },
      { path: "dashboard/zone-products", element: <Dashboard /> },
      { path: "dashboard/zone-calendar", element: <Dashboard /> },
      { path: "dashboard/zone-events", element: <Dashboard /> },
      { path: "dashboard/zone-documents", element: <Dashboard /> },
      { path: "dashboard/zone-settings", element: <Dashboard /> },
      { path: "dashboard/team", element: <Dashboard /> },
      { path: "install", element: <Install /> },
      { path: "gallery", element: <Gallery /> },
      { path: "customers", element: <Customers /> },
      { path: "pricing", element: <Pricing /> },
      { path: "alternatives", element: <Alternatives /> },
      { path: "alternatives/:competitor", element: <AlternativeDetail /> },
      { path: "seo-landing", element: <SeoLanding /> },
      { path: "admin", element: <Admin /> },
      { path: "admin/language-algorithms", element: <AdminLanguageAlgorithms /> },
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
      { path: "для-репетиторов", element: <NicheLanding landingKey="tutors" /> },
      { path: "для-бьюти-мастеров", element: <NicheLanding landingKey="beauty-masters" /> },
      { path: "for-masters", element: <ForMasters /> },
      { path: "for/:landingSlug", element: <NicheLanding /> },
      // SEO keyword landings (2026-05 sprint)
      { path: "taplink-alternative", element: <NicheLanding landingKey="taplink-alternative" /> },
      { path: "sayt-vizitka-dlya-uslug", element: <NicheLanding landingKey="sayt-vizitka" /> },
      { path: "multilink", element: <NicheLanding landingKey="multilink" /> },
      { path: "link-in-bio-ru", element: <NicheLanding landingKey="link-in-bio" /> },
      { path: "vizitka-onlayn", element: <NicheLanding landingKey="vizitka-onlayn" /> },
      // Programmatic niche pages /dlya/{niche}
      { path: "dlya/:landingSlug", element: <NicheLanding /> },
      // Blog
      { path: "blog", element: <BlogIndex /> },
      { path: "blog/:slug", element: <BlogPost /> },
      { path: "from/:slug", element: <FromPage /> },
      { path: "collab/:collabSlug", element: <CollabPage /> },
      { path: "p/:compressed", element: <PublicPage /> },
      { path: ":slug/services/:serviceSlug", element: <PublicServicePage /> },
      { path: ":slug/events/:eventId", element: <PublicEventPage /> },
      // Sprint 1: Multi-Page sub-pages (e.g. /username/p/about, /username/p/pricing)
      { path: ":slug/p/:pagePath", element: <PublicPage /> },
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

import { PushService } from "@/lib/notifications/push-service";
import { registerServiceWorker } from "@/pwa/registerSW";
import { installKeyboardHandlers } from "@/platform/native/keyboard";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  </StrictMode>
);

// Initialize Push Notifications for native mobile
PushService.init();

// Smooth keyboard handling on iOS/Android (no-op on web)
installKeyboardHandlers();

// Guarded Service Worker registration (skips Lovable preview / dev / iframe)
registerServiceWorker();


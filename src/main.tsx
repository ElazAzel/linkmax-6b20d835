// CRITICAL: Sentry must be initialized FIRST to capture all errors from boot
import "./lib/sentry";

// CRITICAL: i18n must be imported FIRST, before any React components
import "./i18n/config";

import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { checkCacheVersion } from "./lib/cache-utils";
import App from "./App";

// Check cache version on app load
checkCacheVersion();

// Lazy load page components for route-based code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
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
const SeoLanding = lazy(() => import("./pages/SeoLanding")); // New SEO/AEO Landing Page

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
          // Let platform handle OAuth routes via full page navigation
          if (url.pathname.startsWith('/~oauth')) {
            window.location.href = url.href;
            return new Promise(() => { }); // Never resolves, page will navigate away
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

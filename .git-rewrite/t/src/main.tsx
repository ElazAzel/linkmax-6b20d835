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
const Index = lazy(() => import("./pages/LandingV5"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/DashboardV2"));
const PublicPage = lazy(() => import("./pages/PublicPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Install = lazy(() => import("./pages/Install"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Alternatives = lazy(() => import("./pages/Alternatives"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminTranslations = lazy(() => import("./pages/AdminTranslations"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const CollabPage = lazy(() => import("./pages/CollabPage"));
const JoinTeam = lazy(() => import("./pages/JoinTeam"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const PaymentTerms = lazy(() => import("./pages/PaymentTerms"));
const Experts = lazy(() => import("./pages/Experts"));

// Create router with optimized code splitting
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Index /> },
      { path: "auth", element: <Auth /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "dashboard/home", element: <Dashboard /> },
      { path: "dashboard/pages", element: <Dashboard /> },
      { path: "dashboard/activity", element: <Dashboard /> },
      { path: "dashboard/insights", element: <Dashboard /> },
      { path: "dashboard/monetize", element: <Dashboard /> },
      { path: "dashboard/settings", element: <Dashboard /> },
      { path: "install", element: <Install /> },
      { path: "gallery", element: <Gallery /> },
      { path: "pricing", element: <Pricing /> },
      { path: "alternatives", element: <Alternatives /> },
      { path: "admin", element: <Admin /> },
      { path: "admin/translations", element: <AdminTranslations /> },
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
      { path: "*", element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

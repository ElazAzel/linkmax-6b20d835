import { lazy } from "react";
import { Route } from "react-router-dom";
import App from "./App";

// Lazy load page components for route-based code splitting
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardV2 = lazy(() => import("./pages/DashboardV2"));
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
const IndexBento = lazy(() => import("./pages/IndexBento"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const PaymentTerms = lazy(() => import("./pages/PaymentTerms"));
const EventScanner = lazy(() => import("./pages/EventScanner"));

export function AppRoutes() {
  return (
    <Route element={<App />}>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      {/* Dashboard v1 (legacy) */}
      <Route path="/dashboard" element={<Dashboard />} />
      {/* Dashboard v2 (new multi-page) */}
      <Route path="/dashboard/v2" element={<DashboardV2 />} />
      <Route path="/dashboard/home" element={<DashboardV2 />} />
      <Route path="/dashboard/pages" element={<DashboardV2 />} />
      <Route path="/dashboard/activity" element={<DashboardV2 />} />
      <Route path="/dashboard/insights" element={<DashboardV2 />} />
      <Route path="/dashboard/monetize" element={<DashboardV2 />} />
      <Route path="/dashboard/settings" element={<DashboardV2 />} />
      {/* Events management */}
      <Route path="/dashboard/events" element={<DashboardV2 />} />
      <Route path="/dashboard/events/:eventId" element={<DashboardV2 />} />
      {/* Event scanner (Pro feature) */}
      <Route path="/dashboard/events/:eventId/scanner" element={<EventScanner />} />
      <Route path="/install" element={<Install />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/alternatives" element={<Alternatives />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/translations" element={<AdminTranslations />} />
      <Route path="/team/:slug" element={<TeamPage />} />
      <Route path="/join/:inviteCode" element={<JoinTeam />} />
      <Route path="/bento" element={<IndexBento />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/payment-terms" element={<PaymentTerms />} />
      <Route path="/collab/:collabSlug" element={<CollabPage />} />
      <Route path="/p/:compressed" element={<PublicPage />} />
      <Route path="/:slug" element={<PublicPage />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Route>
  );
}

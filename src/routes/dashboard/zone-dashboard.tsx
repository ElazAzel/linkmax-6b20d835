import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/DashboardV2";

export const Route = createFileRoute("/dashboard/zone-dashboard")({
  ssr: false,
  component: Dashboard,
});

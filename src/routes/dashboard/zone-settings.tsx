import { createFileRoute } from "@tanstack/react-router";
import Dashboard from "@/pages/DashboardV2";

export const Route = createFileRoute("/dashboard/zone-settings")({
  ssr: false,
  component: Dashboard,
});

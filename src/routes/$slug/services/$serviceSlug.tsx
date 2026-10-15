import { createFileRoute } from "@tanstack/react-router";
import PublicServicePage from "@/pages/PublicServicePage";

export const Route = createFileRoute("/$slug/services/$serviceSlug")({
  component: PublicServicePage,
});

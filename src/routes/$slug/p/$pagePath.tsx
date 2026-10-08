import { createFileRoute } from "@tanstack/react-router";
import PublicPage from "@/pages/PublicPage";

export const Route = createFileRoute("/$slug/p/$pagePath")({
  component: PublicPage,
});

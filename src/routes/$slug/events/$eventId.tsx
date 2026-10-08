import { createFileRoute } from "@tanstack/react-router";
import PublicEventPage from "@/pages/PublicEventPage";

export const Route = createFileRoute("/$slug/events/$eventId")({
  component: PublicEventPage,
});

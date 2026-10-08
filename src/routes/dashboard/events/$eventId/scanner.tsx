import { createFileRoute } from "@tanstack/react-router";
import EventScanner from "@/pages/EventScanner";

export const Route = createFileRoute("/dashboard/events/$eventId/scanner")({
  component: EventScanner,
});

import { createFileRoute } from "@tanstack/react-router";
import EventCheckin from "@/pages/EventCheckin";

export const Route = createFileRoute("/events/checkin/$token")({
  component: EventCheckin,
});

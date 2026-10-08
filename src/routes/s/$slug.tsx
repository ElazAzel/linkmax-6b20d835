import { createFileRoute } from "@tanstack/react-router";
import SmartLinkRedirect from "@/pages/SmartLinkRedirect";

export const Route = createFileRoute("/s/$slug")({
  component: SmartLinkRedirect,
});

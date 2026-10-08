import { createFileRoute } from "@tanstack/react-router";
import SmartLinks from "@/pages/SmartLinks";

export const Route = createFileRoute("/dashboard/smart-links")({
  component: SmartLinks,
});

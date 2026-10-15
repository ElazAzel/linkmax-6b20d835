import { createFileRoute } from "@tanstack/react-router";
import DesignSystem from "@/pages/DesignSystem";

export const Route = createFileRoute("/design-system")({
  component: DesignSystem,
});

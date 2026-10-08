import { createFileRoute } from "@tanstack/react-router";
import Experts from "@/pages/Experts";

export const Route = createFileRoute("/experts/$tag/$city")({
  component: Experts,
});

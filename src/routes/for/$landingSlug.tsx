import { createFileRoute } from "@tanstack/react-router";
import NicheLanding from "@/pages/NicheLanding";

export const Route = createFileRoute("/for/$landingSlug")({
  component: NicheLanding,
});

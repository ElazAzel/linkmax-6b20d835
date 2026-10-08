import { createFileRoute } from "@tanstack/react-router";
import { CanonicalDemoRedirect as CanonicalDemoRedirect } from "@/components/routing/CanonicalDemoRedirect";

export const Route = createFileRoute("/demo_nails")({
  component: CanonicalDemoRedirect,
});

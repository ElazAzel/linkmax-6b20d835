import { createFileRoute } from "@tanstack/react-router";
import Install from "@/pages/Install";

export const Route = createFileRoute("/install")({
  component: Install,
});

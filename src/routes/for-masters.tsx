import { createFileRoute } from "@tanstack/react-router";
import ForMasters from "@/pages/ForMasters";

export const Route = createFileRoute("/for-masters")({
  component: ForMasters,
});

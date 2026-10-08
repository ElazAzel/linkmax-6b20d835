import { createFileRoute } from "@tanstack/react-router";
import NicheLanding from "@/pages/NicheLanding";

export const Route = createFileRoute("/vizitka-onlayn")({
  component: () => <NicheLanding landingKey="vizitka-onlayn" />,
});

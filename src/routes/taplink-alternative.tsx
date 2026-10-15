import { createFileRoute } from "@tanstack/react-router";
import NicheLanding from "@/pages/NicheLanding";

export const Route = createFileRoute("/taplink-alternative")({
  component: () => <NicheLanding landingKey="taplink-alternative" />,
});

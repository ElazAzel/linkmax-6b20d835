import { createFileRoute } from "@tanstack/react-router";
import NicheLanding from "@/pages/NicheLanding";

export const Route = createFileRoute("/link-in-bio-ru")({
  component: () => <NicheLanding landingKey="link-in-bio" />,
});

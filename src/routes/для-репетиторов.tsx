import { createFileRoute } from "@tanstack/react-router";
import NicheLanding from "@/pages/NicheLanding";

export const Route = createFileRoute("/для-репетиторов")({
  component: () => <NicheLanding landingKey="tutors" />,
});

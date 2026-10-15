import { createFileRoute } from "@tanstack/react-router";
import NicheLanding from "@/pages/NicheLanding";

export const Route = createFileRoute("/для-бьюти-мастеров")({
  component: () => <NicheLanding landingKey="beauty-masters" />,
});

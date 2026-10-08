import { createFileRoute } from "@tanstack/react-router";
import NicheLanding from "@/pages/NicheLanding";

export const Route = createFileRoute("/sayt-vizitka-dlya-uslug")({
  component: () => <NicheLanding landingKey="sayt-vizitka" />,
});

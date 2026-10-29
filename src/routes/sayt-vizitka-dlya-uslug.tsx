import { buildMarketingHead } from '@/lib/seo/marketing-metadata';
import { createFileRoute } from "@tanstack/react-router";
import NicheLanding from "@/pages/NicheLanding";

export const Route = createFileRoute("/sayt-vizitka-dlya-uslug")({
  head: ({ match }) => buildMarketingHead(match),
  component: () => <NicheLanding landingKey="sayt-vizitka" />,
});

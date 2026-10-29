import { buildMarketingHead } from '@/lib/seo/marketing-metadata';
import { createFileRoute } from "@tanstack/react-router";
import NicheLanding from "@/pages/NicheLanding";

export const Route = createFileRoute("/taplink-alternative")({
  head: ({ match }) => buildMarketingHead(match),
  component: () => <NicheLanding landingKey="taplink-alternative" />,
});

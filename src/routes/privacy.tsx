import { buildMarketingHead } from '@/lib/seo/marketing-head';
import { createFileRoute } from "@tanstack/react-router";
import Privacy from "@/pages/Privacy";

export const Route = createFileRoute("/privacy")({
  head: ({ match }) => buildMarketingHead(match),
  component: Privacy,
});

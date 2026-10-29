import { buildMarketingHead } from '@/lib/seo/marketing-metadata';
import { createFileRoute } from "@tanstack/react-router";
import Terms from "@/pages/Terms";

export const Route = createFileRoute("/terms")({
  head: ({ match }) => buildMarketingHead(match),
  component: Terms,
});

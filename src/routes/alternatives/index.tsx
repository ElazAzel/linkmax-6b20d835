import { buildMarketingHead } from '@/lib/seo/marketing-metadata';
import { createFileRoute } from "@tanstack/react-router";
import Alternatives from "@/pages/Alternatives";

export const Route = createFileRoute("/alternatives/")({
  head: ({ match }) => buildMarketingHead(match),
  component: Alternatives,
});

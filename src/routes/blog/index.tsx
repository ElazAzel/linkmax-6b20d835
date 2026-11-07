import { buildMarketingHead } from '@/lib/seo/marketing-head';
import { createFileRoute } from "@tanstack/react-router";
import BlogIndex from "@/pages/BlogIndex";

export const Route = createFileRoute("/blog/")({
  head: ({ match }) => buildMarketingHead(match),
  component: BlogIndex,
});

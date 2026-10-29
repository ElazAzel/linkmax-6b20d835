import { buildMarketingHead } from '@/lib/seo/marketing-metadata';
import { createFileRoute } from "@tanstack/react-router";
import SitemapPage from "@/pages/SitemapPage";

export const Route = createFileRoute("/sitemap")({
  head: ({ match }) => buildMarketingHead(match),
  component: SitemapPage,
});

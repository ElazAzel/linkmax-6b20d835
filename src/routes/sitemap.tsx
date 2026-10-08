import { createFileRoute } from "@tanstack/react-router";
import SitemapPage from "@/pages/SitemapPage";

export const Route = createFileRoute("/sitemap")({
  component: SitemapPage,
});

import { createFileRoute } from "@tanstack/react-router";
import { proxySitemap } from "@/lib/seo/sitemap-proxy";

export const Route = createFileRoute("/sitemap-experts.xml")({
  server: { handlers: { GET: () => proxySitemap("sitemap-experts") } },
});

import { createFileRoute } from "@tanstack/react-router";
import Index from "@/pages/Index";
import i18n from "@/i18n/config";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: i18n.t('landing.revenue.seo.title') },
    { name: "description", content: i18n.t('landing.revenue.seo.description') },
    { property: "og:title", content: i18n.t('landing.revenue.seo.title') },
    { property: "og:description", content: i18n.t('landing.revenue.seo.description') },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

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
    { property: "og:url", content: "https://lnkmx.my/" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: i18n.t('landing.revenue.seo.title') },
    { name: "twitter:description", content: i18n.t('landing.revenue.seo.description') },
    { name: "theme-color", content: "#0a0a0a", media: "(prefers-color-scheme: light)" },
    { name: "theme-color", content: "#0a0a0a", media: "(prefers-color-scheme: dark)" },
  ], links: [{ rel: "canonical", href: "https://lnkmx.my/" }] }),
  component: Index,
});

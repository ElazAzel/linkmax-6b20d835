import { createFileRoute } from "@tanstack/react-router";
import Auth from "@/pages/Auth";
import i18n from "@/i18n/config";

export const Route = createFileRoute("/auth/")({
  head: () => ({ meta: [
    { title: i18n.t('auth.seo.title') },
    { name: "description", content: i18n.t('auth.seo.description') },
    { property: "og:title", content: i18n.t('auth.seo.title') },
    { property: "og:description", content: i18n.t('auth.seo.description') },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Auth,
});

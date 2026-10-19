import { createFileRoute } from "@tanstack/react-router";
import LocaleIndex from "@/components/routing/LocaleIndex";
import i18n, { changeLanguageLoaded } from "@/i18n/config";

export const Route = createFileRoute("/en")({
  beforeLoad: async () => {
    await changeLanguageLoaded("en");
  },
  head: () => ({
    meta: [
      { title: i18n.t("landing.revenue.seo.title", { lng: "en" }) },
      { name: "description", content: i18n.t("landing.revenue.seo.description", { lng: "en" }) },
      { property: "og:title", content: i18n.t("landing.revenue.seo.title", { lng: "en" }) },
      { property: "og:description", content: i18n.t("landing.revenue.seo.description", { lng: "en" }) },
      { property: "og:locale", content: "en_US" },
    ],
  }),
  component: () => <LocaleIndex lang="en" />,
});

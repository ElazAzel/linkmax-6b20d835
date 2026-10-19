import { createFileRoute } from "@tanstack/react-router";
import LocaleIndex from "@/components/routing/LocaleIndex";
import i18n, { changeLanguageLoaded } from "@/i18n/config";

export const Route = createFileRoute("/ru")({
  beforeLoad: async () => {
    await changeLanguageLoaded("ru");
  },
  head: () => ({
    meta: [
      { title: i18n.t("landing.revenue.seo.title", { lng: "ru" }) },
      { name: "description", content: i18n.t("landing.revenue.seo.description", { lng: "ru" }) },
      { property: "og:title", content: i18n.t("landing.revenue.seo.title", { lng: "ru" }) },
      { property: "og:description", content: i18n.t("landing.revenue.seo.description", { lng: "ru" }) },
      { property: "og:locale", content: "ru_RU" },
    ],
  }),
  component: () => <LocaleIndex lang="ru" />,
});

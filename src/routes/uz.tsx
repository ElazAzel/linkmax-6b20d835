import { createFileRoute } from "@tanstack/react-router";
import LocaleIndex from "@/components/routing/LocaleIndex";
import i18n, { changeLanguageLoaded } from "@/i18n/config";

export const Route = createFileRoute("/uz")({
  beforeLoad: async () => {
    await changeLanguageLoaded("uz");
  },
  head: () => ({
    meta: [
      { title: i18n.t("landing.revenue.seo.title", { lng: "uz" }) },
      { name: "description", content: i18n.t("landing.revenue.seo.description", { lng: "uz" }) },
      { property: "og:title", content: i18n.t("landing.revenue.seo.title", { lng: "uz" }) },
      { property: "og:description", content: i18n.t("landing.revenue.seo.description", { lng: "uz" }) },
      { property: "og:locale", content: "uz_UZ" },
    ],
  }),
  component: () => <LocaleIndex lang="uz" />,
});

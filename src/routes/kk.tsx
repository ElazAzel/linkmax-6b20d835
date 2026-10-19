import { createFileRoute } from "@tanstack/react-router";
import LocaleIndex from "@/components/routing/LocaleIndex";
import i18n, { changeLanguageLoaded } from "@/i18n/config";

export const Route = createFileRoute("/kk")({
  beforeLoad: async () => {
    await changeLanguageLoaded("kk");
  },
  head: () => ({
    meta: [
      { title: i18n.t("landing.revenue.seo.title", { lng: "kk" }) },
      { name: "description", content: i18n.t("landing.revenue.seo.description", { lng: "kk" }) },
      { property: "og:title", content: i18n.t("landing.revenue.seo.title", { lng: "kk" }) },
      { property: "og:description", content: i18n.t("landing.revenue.seo.description", { lng: "kk" }) },
      { property: "og:locale", content: "kk_KZ" },
    ],
  }),
  component: () => <LocaleIndex lang="kk" />,
});

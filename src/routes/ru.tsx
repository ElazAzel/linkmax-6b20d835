import { createFileRoute } from "@tanstack/react-router";
import { buildLandingHead } from "@/lib/seo/landing-head";
import LocaleIndex from "@/components/routing/LocaleIndex";
import { changeLanguageLoaded } from "@/i18n/config";

export const Route = createFileRoute("/ru")({
  beforeLoad: async () => {
    await changeLanguageLoaded("ru");
  },
  head: () => buildLandingHead("ru", "/ru"),
  component: () => <LocaleIndex lang="ru" />,
});

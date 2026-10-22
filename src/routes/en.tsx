import { createFileRoute } from "@tanstack/react-router";
import { buildLandingHead } from "@/lib/seo/landing-head";
import LocaleIndex from "@/components/routing/LocaleIndex";
import { changeLanguageLoaded } from "@/i18n/config";

export const Route = createFileRoute("/en")({
  beforeLoad: async () => {
    await changeLanguageLoaded("en");
  },
  head: () => buildLandingHead("en", "/en"),
  component: () => <LocaleIndex lang="en" />,
});

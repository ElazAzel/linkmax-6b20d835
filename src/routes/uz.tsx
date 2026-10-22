import { createFileRoute } from "@tanstack/react-router";
import { buildLandingHead } from "@/lib/seo/landing-head";
import LocaleIndex from "@/components/routing/LocaleIndex";
import { changeLanguageLoaded } from "@/i18n/config";

export const Route = createFileRoute("/uz")({
  beforeLoad: async () => {
    await changeLanguageLoaded("uz");
  },
  head: () => buildLandingHead("uz", "/uz"),
  component: () => <LocaleIndex lang="uz" />,
});

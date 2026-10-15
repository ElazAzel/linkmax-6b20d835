import { createFileRoute } from "@tanstack/react-router";
import SeoLanding from "@/pages/SeoLanding";

export const Route = createFileRoute("/seo-landing")({
  component: SeoLanding,
});

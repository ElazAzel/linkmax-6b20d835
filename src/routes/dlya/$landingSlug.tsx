import { buildMarketingHead } from '@/lib/seo/marketing-metadata';
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { getNicheLandingByKey } from '@/lib/niche-landing-data';
import NicheLanding from "@/pages/NicheLanding";

export const Route = createFileRoute("/dlya/$landingSlug")({
  head: ({ match }) => buildMarketingHead(match),
  beforeLoad: ({ params, location }) => {
    const landing = getNicheLandingByKey(params.landingSlug);
    if (!landing) throw notFound();
    if (location.pathname !== landing.canonicalPath) throw redirect({ href: landing.canonicalPath, statusCode: 301 });
  },
  component: NicheLanding,
});

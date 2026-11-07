import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import NicheLanding from "@/pages/NicheLanding";

export const Route = createFileRoute("/for/$landingSlug")({
  beforeLoad: async ({ params, location }) => {
    const { getNicheLandingByKey } = await import('@/lib/niche-landing-data');
    const landing = getNicheLandingByKey(params.landingSlug);
    if (!landing) throw notFound();
    // Location headers must be ASCII, so Cyrillic canonical paths are percent-encoded.
    if (location.pathname !== landing.canonicalPath) throw redirect({ href: encodeURI(landing.canonicalPath), statusCode: 301 });
  },
  component: NicheLanding,
});

import { createFileRoute } from "@tanstack/react-router";
import PublicPage from "@/pages/PublicPage";
import { fetchPublicPageSnapshot } from "@/lib/seo/public-page-snapshot";
import { buildMissingPageHead, buildPublicPageHead } from "@/lib/seo/public-page-seo";

// The loader runs during SSR, so crawlers (including AI bots that never run JS)
// get the profile, canonical URL and JSON-LD in the first HTML response.
export const Route = createFileRoute("/$slug/")({
  loader: ({ params }) => fetchPublicPageSnapshot(params.slug),
  staleTime: 60_000,
  head: ({ loaderData }) => {
    if (loaderData?.status === "ok") return buildPublicPageHead(loaderData.page);
    if (loaderData?.status === "missing") return buildMissingPageHead();
    return {};
  },
  component: PublicPageRoute,
});

function PublicPageRoute() {
  const snapshot = Route.useLoaderData();
  return <PublicPage initialPage={snapshot.status === "ok" ? snapshot.page : null} headManagedByRoute={snapshot.status === "ok"} />;
}

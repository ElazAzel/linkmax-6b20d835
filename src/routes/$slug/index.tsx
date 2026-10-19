import { createFileRoute } from "@tanstack/react-router";
import PublicPage from "@/pages/PublicPage";
import { fetchPublicPageSnapshot } from "@/lib/seo/public-page-snapshot";
import { buildMissingPageHead, buildPublicPageHead, normalizeSeoLanguage } from "@/lib/seo/public-page-seo";
import { PublicProfileHeadSync } from "@/components/seo/PublicProfileHeadSync";

// The loader runs during SSR, so crawlers (including AI bots that never run JS)
// get the profile, canonical URL and JSON-LD in the first HTML response.
export const Route = createFileRoute("/$slug/")({
  loader: ({ params }) => fetchPublicPageSnapshot(params.slug),
  staleTime: 60_000,
  // Lets a CDN answer crawlers from cache and refresh in the background
  // instead of rendering the profile from scratch on every bot hit.
  headers: ({ loaderData }) =>
    loaderData?.status === "ok"
      ? { "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=86400" }
      : undefined,
  head: ({ loaderData, match }) => {
    const search = match.search as { lang?: unknown; lng?: unknown };
    if (loaderData?.status === "ok") return buildPublicPageHead(loaderData.page, { language: normalizeSeoLanguage(search.lang ?? search.lng) });
    if (loaderData?.status === "missing") return buildMissingPageHead();
    return {};
  },
  component: PublicPageRoute,
});

function PublicPageRoute() {
  const snapshot = Route.useLoaderData();
  const matchId = Route.useMatch({ select: match => match.id });
  return <>
    {snapshot.status === "ok" && <PublicProfileHeadSync page={snapshot.page} matchId={matchId} />}
    <PublicPage initialPage={snapshot.status === "ok" ? snapshot.page : null} headManagedByRoute={snapshot.status === "ok"} />
  </>;
}

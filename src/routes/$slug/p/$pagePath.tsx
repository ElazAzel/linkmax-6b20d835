import { buildContentHead, fetchContentMetadata, contentLanguage } from '@/lib/seo/content-head';
import { createFileRoute } from "@tanstack/react-router";
import PublicPage from "@/pages/PublicPage";

export const Route = createFileRoute("/$slug/p/$pagePath")({
  loader: ({ params, location }) => fetchContentMetadata('subpage', params, contentLanguage(location)),
  head: ({ loaderData, match }) => buildContentHead(loaderData, match.pathname),
  component: PublicPage,
});

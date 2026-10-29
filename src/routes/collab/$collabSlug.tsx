import { buildContentHead, fetchContentMetadata, contentLanguage } from '@/lib/seo/content-head';
import { createFileRoute } from "@tanstack/react-router";
import CollabPage from "@/pages/CollabPage";

export const Route = createFileRoute("/collab/$collabSlug")({
  loader: ({ params, location }) => fetchContentMetadata('collab', params, contentLanguage(location)),
  head: ({ loaderData, match }) => buildContentHead(loaderData, match.pathname),
  component: CollabPage,
});

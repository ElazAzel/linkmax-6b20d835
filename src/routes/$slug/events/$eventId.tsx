import { buildContentHead, fetchContentMetadata, contentLanguage } from '@/lib/seo/content-head';
import { createFileRoute } from "@tanstack/react-router";
import PublicEventPage from "@/pages/PublicEventPage";

export const Route = createFileRoute("/$slug/events/$eventId")({
  loader: ({ params, location }) => fetchContentMetadata('event', params, contentLanguage(location)),
  head: ({ loaderData, match }) => buildContentHead(loaderData, match.pathname),
  component: PublicEventPage,
});

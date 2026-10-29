import { createFileRoute } from "@tanstack/react-router";
import TeamPage from "@/pages/TeamPage";
import { buildContentHead, fetchContentMetadata, contentLanguage } from '@/lib/seo/content-head';

export const Route = createFileRoute("/team/$slug")({
  loader: ({ params, location }) => fetchContentMetadata('team', params, contentLanguage(location)),
  head: ({ loaderData, match }) => buildContentHead(loaderData, match.pathname),
  component: TeamPage,
});

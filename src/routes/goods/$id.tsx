import { buildContentHead, fetchContentMetadata, contentLanguage } from '@/lib/seo/content-head';
import { createFileRoute } from "@tanstack/react-router";
import PublicGoodsPage from "@/pages/PublicGoodsPage";

export const Route = createFileRoute("/goods/$id")({
  loader: ({ params, location }) => fetchContentMetadata('goods', params, contentLanguage(location)),
  head: ({ loaderData, match }) => buildContentHead(loaderData, match.pathname),
  component: PublicGoodsPage,
});

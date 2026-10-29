import { buildUtilityHead } from '@/lib/seo/content-head';
import { createFileRoute } from "@tanstack/react-router";
import FromPage from "@/pages/FromPage";

export const Route = createFileRoute("/from/$slug")({
  head: ({ match }) => buildUtilityHead(match, 'from.seoTitle', 'from.seoDesc'),
  component: FromPage,
});

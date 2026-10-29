import { buildUtilityHead } from '@/lib/seo/content-head';
import { createFileRoute } from "@tanstack/react-router";
import DesignSystem from "@/pages/DesignSystem";

export const Route = createFileRoute("/design-system")({
  head: ({ match }) => buildUtilityHead(match, 'seoUtility.designTitle', 'seoUtility.designDescription'),
  component: DesignSystem,
});

import { buildUtilityHead } from '@/lib/seo/content-head';
import { createFileRoute } from "@tanstack/react-router";
import Install from "@/pages/Install";

export const Route = createFileRoute("/install")({
  head: ({ match }) => buildUtilityHead(match, 'install.title', 'install.description'),
  component: Install,
});

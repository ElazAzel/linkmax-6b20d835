import { buildUtilityHead } from '@/lib/seo/content-head';
import { createFileRoute } from "@tanstack/react-router";
import SmartLinkRedirect from "@/pages/SmartLinkRedirect";

export const Route = createFileRoute("/s/$slug")({
  head: ({ match }) => buildUtilityHead(match, 'smartLink.leaveTitle', 'smartLink.leaveHint'),
  component: SmartLinkRedirect,
});

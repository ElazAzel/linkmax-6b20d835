import { buildMarketingHead } from '@/lib/seo/marketing-metadata';
import { createFileRoute } from "@tanstack/react-router";
import Customers from "@/pages/Customers";

export const Route = createFileRoute("/customers")({
  head: ({ match }) => buildMarketingHead(match),
  component: Customers,
});

import { createFileRoute } from "@tanstack/react-router";
import PublicPurchasePage from "@/pages/PublicPurchasePage";

export const Route = createFileRoute("/purchase/$token")({
  component: PublicPurchasePage,
});

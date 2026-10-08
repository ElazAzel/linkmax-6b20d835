import { createFileRoute } from "@tanstack/react-router";
import PublicGoodsPage from "@/pages/PublicGoodsPage";

export const Route = createFileRoute("/goods/$id")({
  component: PublicGoodsPage,
});

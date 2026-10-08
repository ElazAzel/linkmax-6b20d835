import { createFileRoute } from "@tanstack/react-router";
import AlternativeDetail from "@/pages/AlternativeDetail";

export const Route = createFileRoute("/alternatives/$competitor")({
  component: AlternativeDetail,
});

import { createFileRoute } from "@tanstack/react-router";
import FromPage from "@/pages/FromPage";

export const Route = createFileRoute("/from/$slug")({
  component: FromPage,
});

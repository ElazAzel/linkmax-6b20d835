import { createFileRoute } from "@tanstack/react-router";
import CollabPage from "@/pages/CollabPage";

export const Route = createFileRoute("/collab/$collabSlug")({
  component: CollabPage,
});

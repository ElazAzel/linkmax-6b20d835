import { createFileRoute } from "@tanstack/react-router";
import Alternatives from "@/pages/Alternatives";

export const Route = createFileRoute("/alternatives/")({
  component: Alternatives,
});

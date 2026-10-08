import { createFileRoute } from "@tanstack/react-router";
import AdminLanguageAlgorithms from "@/pages/AdminLanguageAlgorithms";

export const Route = createFileRoute("/admin/language-algorithms")({
  component: AdminLanguageAlgorithms,
});

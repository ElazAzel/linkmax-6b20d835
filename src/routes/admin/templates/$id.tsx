import { createFileRoute } from "@tanstack/react-router";
import AdminTemplateEditor from "@/pages/AdminTemplateEditor";

export const Route = createFileRoute("/admin/templates/$id")({
  ssr: false,
  component: AdminTemplateEditor,
});
